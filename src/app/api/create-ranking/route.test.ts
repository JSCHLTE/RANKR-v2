import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { rankingLimit } from "../../../lib/ranking-limit";

function setup(count = 0, pass?: unknown) {
  const writes: { ref: string; data: Record<string, unknown> }[] = [];
  let committed = false;
  const exports: { POST?: (request: Request) => Promise<Response> } = {};
  const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, {
    exports, Response, console, process: { cwd: () => "/test" },
    require: (name: string) => {
      if (name === "@/lib/ranking-limit") return { rankingLimit };
      if (name === "@/lib/template-files") return { readTemplate: async () => ({ ranks: [{ player_id: "a", rank: 1 }] }) };
      if (name === "fs") return { default: { readFileSync: () => '[{"player_id":"a","rank":1}]' } };
      if (name === "path") return { default: { join: (...parts: string[]) => parts.join("/") } };
      if (name === "next/cache") return { revalidatePath: () => {} };
      if (name === "@/lib/firebase-admin") return {
        auth: { verifyIdToken: async () => ({ uid: "owner" }) },
        admin: { firestore: { FieldValue: { serverTimestamp: () => "server-time" } } },
        db: {
          collection: (collection: string) => ({ where: (field: string, op: string, uid: string) => {
            assert.equal(collection, "rankings-meta"); assert.equal(field, "author.uid"); assert.equal(op, "=="); assert.equal(uid, "owner");
            return { select: () => ({ query: true }) };
          }, doc: (id = "new-ranking") => ({ id, path: `${collection}/${id}`,
            get: async () => ({ exists: true, data: () => ({ username: "owner", displayName: "Owner", pfp: "" }) }),
          }) }),
          runTransaction: async (callback: (transaction: unknown) => Promise<void>) => {
            const pending: typeof writes = [];
            await callback({
              get: async (ref: { query?: boolean }) => ref.query ? { size: count } : { data: () => ({ username: "owner", displayName: "Owner", pfp: "", rankrPass: pass }) },
              set: (ref: { path: string }, data: Record<string, unknown>) => pending.push({ ref: ref.path, data }),
              update: (ref: { path: string }, data: Record<string, unknown>) => { assert.equal(ref.path, "users/owner"); assert.equal(data.lastRankingCreatedAt, "server-time"); },
            });
            writes.push(...pending); committed = true;
          },
        },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return { handler: exports.POST!, writes, committed: () => committed };
}

const rankObj = { name: " My ranking ", description: "", scoring: "", format: null, leagueSize: "", visibility: "PUBLIC" };
function request(body: unknown) {
  return new Request("http://localhost/api/create-ranking", { method: "POST", headers: { authorization: "Bearer valid" }, body: JSON.stringify(body) });
}

test("current creation form succeeds without the removed positionGroup field", async () => {
  const context = setup();
  const response = await context.handler(request({ rankObj }));
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { rankingId: "new-ranking" });
  assert.equal(context.committed(), true);
  assert.deepEqual(context.writes.map(write => write.ref), ["rankings-meta/new-ranking", "rankings-ranks/new-ranking"]);
  assert.equal((context.writes[0].data.rankObj as { name: string }).name, "My ranking");
  assert.equal(context.writes[0].data.updatedAt, "server-time");
});

test("invalid names and visibility still return bad request without writes", async () => {
  for (const fields of [{ name: " " }, { name: 123 }, { visibility: "invalid" }, { description: 123 }]) {
    const context = setup();
    assert.equal((await context.handler(request({ rankObj: { ...rankObj, ...fields } }))).status, 400);
    assert.equal(context.writes.length, 0);
    assert.equal(context.committed(), false);
  }
});

test("null or missing request fields return a validation error", async () => {
  for (const body of [null, {}]) {
    const context = setup();
    assert.equal((await context.handler(request(body))).status, 400);
    assert.equal(context.writes.length, 0);
  }
});

test("free users can create their second ranking but not their third", async () => {
  assert.equal((await setup(1).handler(request({ rankObj }))).status, 201);
  const context = setup(2);
  const response = await context.handler(request({ rankObj: { ...rankObj, visibility: "PRIVATE" } }));
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.limit, 2);
  assert.equal(body.code, "RANKING_LIMIT_REACHED");
  assert.equal(context.writes.length, 0);
  assert.equal(context.committed(), false);
});

test("active passes allow 20 rankings, including public and private, but not 21", async () => {
  const pass = { expiresAt: { toMillis: () => Date.now() + 60000 } };
  assert.equal((await setup(19, pass).handler(request({ rankObj }))).status, 201);
  const context = setup(20, pass);
  const response = await context.handler(request({ rankObj }));
  assert.equal(response.status, 403);
  assert.equal((await response.json()).limit, 20);
  assert.equal(context.writes.length, 0);
});

test("expired passes use the free limit and deleting a ranking frees a slot", async () => {
  const pass = { expiresAt: Date.now() - 1000 };
  const context = setup(10, pass);
  assert.equal((await context.handler(request({ rankObj }))).status, 403);
  assert.equal(context.writes.length, 0);
  assert.equal((await setup(1, pass).handler(request({ rankObj }))).status, 201);
});
