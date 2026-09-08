import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function setup(owner: string | undefined = "owner", exists = true, failCommit = false) {
  const deleted: string[] = [];
  const invalidated: string[] = [];
  const exports: { DELETE?: (request: Request) => Promise<Response> } = {};
  const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, {
    exports, Response, console: { error: () => {} },
    require: (name: string) => {
      if (name === "next/cache") return { revalidatePath: (path: string) => invalidated.push(path) };
      if (name === "@/lib/firebase-admin") return {
        auth: { verifyIdToken: async (token: string, checkRevoked: boolean) => {
          assert.equal(checkRevoked, true);
          if (token !== "valid") throw new Error("Invalid token");
          return { uid: "owner" };
        } },
        db: {
          collection: (collection: string) => ({ doc: (id: string) => `${collection}/${id}` }),
          runTransaction: async (callback: (transaction: unknown) => Promise<void>) => {
            const pending: string[] = [];
            await callback({
              get: async () => ({ exists, data: () => ({ author: { uid: owner } }) }),
              delete: (ref: string) => pending.push(ref),
            });
            if (failCommit) throw new Error("Commit failed");
            deleted.push(...pending);
          },
        },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return { handler: exports.DELETE!, deleted, invalidated };
}

function request(token = "valid", body = JSON.stringify({ rankingId: "ranking123" })) {
  return new Request("http://localhost/api/delete-ranking", { method: "DELETE", headers: token ? { authorization: `Bearer ${token}` } : {}, body });
}

test("missing, invalid and revoked tokens cannot delete", async () => {
  for (const token of ["", "invalid", "revoked"]) {
    const context = setup();
    assert.equal((await context.handler(request(token))).status, 401);
    assert.deepEqual(context.deleted, []);
  }
});

test("a forged owner in the request cannot bypass stored ownership", async () => {
  const context = setup("other-user");
  const response = await context.handler(request("valid", JSON.stringify({ rankingId: "ranking123", author: { uid: "owner" } })));
  assert.equal(response.status, 403);
  assert.deepEqual(context.deleted, []);
});

test("invalid bodies and document paths cannot delete", async () => {
  for (const body of ["invalid json", "null", "{}", '{"rankingId":"a/b"}', '{"rankingId":123}']) {
    const context = setup();
    assert.equal((await context.handler(request("valid", body))).status, 400);
    assert.deepEqual(context.deleted, []);
  }
});

test("missing rankings return 404 without deleting anything", async () => {
  const context = setup("owner", false);
  assert.equal((await context.handler(request())).status, 404);
  assert.deepEqual(context.deleted, []);
});

test("owner deletes both documents and invalidates the ranking pages", async () => {
  const context = setup();
  const response = await context.handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { deleted: true });
  assert.deepEqual(context.deleted, ["rankings-ranks/ranking123", "rankings-meta/ranking123"]);
  assert.deepEqual(context.invalidated, ["/rankings/ranking123", "/rankings"]);
});

test("failed transaction returns an error without partial deletion or invalidation", async () => {
  const context = setup("owner", true, true);
  assert.equal((await context.handler(request())).status, 500);
  assert.deepEqual(context.deleted, []);
  assert.deepEqual(context.invalidated, []);
});
