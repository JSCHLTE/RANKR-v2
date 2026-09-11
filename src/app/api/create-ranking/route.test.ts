import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function setup() {
  const writes: { ref: string; data: Record<string, unknown> }[] = [];
  let committed = false;
  const exports: { POST?: (request: Request) => Promise<Response> } = {};
  const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, {
    exports, Response, console, process: { cwd: () => "/test" },
    require: (name: string) => {
      if (name === "@/lib/template-files") return { readTemplate: async () => ({ ranks: [{ player_id: "a", rank: 1 }] }) };
      if (name === "fs") return { default: { readFileSync: () => '[{"player_id":"a","rank":1}]' } };
      if (name === "path") return { default: { join: (...parts: string[]) => parts.join("/") } };
      if (name === "next/cache") return { revalidatePath: () => {} };
      if (name === "@/lib/firebase-admin") return {
        auth: { verifyIdToken: async () => ({ uid: "owner" }) },
        admin: { firestore: { FieldValue: { serverTimestamp: () => "server-time" } } },
        db: {
          collection: (collection: string) => ({ doc: (id = "new-ranking") => ({ id, path: `${collection}/${id}`,
            get: async () => ({ exists: true, data: () => ({ username: "owner", displayName: "Owner", pfp: "" }) }),
          }) }),
          batch: () => ({
            set: (ref: { path: string }, data: Record<string, unknown>) => writes.push({ ref: ref.path, data }),
            commit: async () => { committed = true; },
          }),
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
