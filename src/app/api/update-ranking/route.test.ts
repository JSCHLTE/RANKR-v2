import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as validation from "../../../lib/ranking-update";

// Execute the real handler with Firebase and Next adapters replaced; no credentials or writes to live data.
function setup(owner = "owner", exists = true) {
  const writes: { ref: string; data: Record<string, unknown> }[] = [];
  const invalidated: string[] = [];
  const timestamp = { serverTimestamp: true };
  const exports: { PATCH?: (request: Request) => Promise<Response> } = {};
  const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, {
    exports, Response, console,
    require: (name: string) => {
      if (name === "@/lib/ranking-update") return validation;
      if (name === "@/hooks/formatTimeStamp") return { default: () => "Sep 8, 2026" };
      if (name === "next/cache") return { revalidatePath: (path: string) => invalidated.push(path) };
      if (name === "@/lib/firebase-admin") return {
        auth: { verifyIdToken: async (token: string, revoked: boolean) => {
          assert.equal(revoked, true);
          if (token !== "valid") throw new Error("Invalid token");
          return { uid: "owner" };
        } },
        admin: { firestore: { FieldValue: { serverTimestamp: () => timestamp } } },
        db: {
          collection: (collection: string) => ({ doc: () => ({ collection, get: async () => ({ data: () => ({ updatedAt: timestamp }) }) }) }),
          runTransaction: async (callback: (transaction: unknown) => Promise<void>) => callback({
            get: async (ref: { collection: string }) => ({ exists, data: () => ref.collection === "rankings-meta"
              ? { author: { uid: owner } } : { ranks: [{ player_id: "a", rank: 1 }, { player_id: "b", rank: 2 }] } }),
            update: (ref: { collection: string }, data: Record<string, unknown>) => writes.push({ ref: ref.collection, data }),
          }),
        },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return { handler: exports.PATCH!, writes, invalidated, timestamp };
}

const body = { rankingId: "ranking123", name: " New title ", description: "New description", ranks: [{ player_id: "b", rank: 1 }, { player_id: "a", rank: 2 }] };
function request(token = "valid", data: unknown = body) {
  return new Request("http://localhost/api/update-ranking", { method: "PATCH", headers: token ? { authorization: `Bearer ${token}` } : {}, body: JSON.stringify(data) });
}

test("missing and invalid authentication cannot write", async () => {
  for (const token of ["", "invalid"]) {
    const context = setup();
    assert.equal((await context.handler(request(token))).status, 401);
    assert.equal(context.writes.length, 0);
  }
});

test("non-owners cannot write, even with a forged author", async () => {
  const context = setup("someone-else");
  assert.equal((await context.handler(request("valid", { ...body, author: { uid: "owner" } }))).status, 403);
  assert.equal(context.writes.length, 0);
});

test("missing rankings and changed player sets cannot write", async () => {
  const missing = setup("owner", false);
  assert.equal((await missing.handler(request())).status, 404);
  assert.equal(missing.writes.length, 0);
  const changed = setup();
  assert.equal((await changed.handler(request("valid", { ...body, ranks: [{ player_id: "c", rank: 1 }] }))).status, 400);
  assert.equal(changed.writes.length, 0);
});

test("owner saves both documents and server timestamp, without overwriting protected fields", async () => {
  const context = setup();
  const response = await context.handler(request("valid", { ...body, updatedAt: "forged", author: { uid: "forged" } }));
  assert.equal(response.status, 200);
  assert.equal(context.writes.length, 2);
  assert.equal(context.writes[0].data["rankObj.name"], "New title");
  assert.equal(context.writes[0].data["rankObj.description"], "New description");
  assert.equal(context.writes[0].data.updatedAt, context.timestamp);
  assert.equal(context.writes[0].data.author, undefined);
  assert.equal(context.writes[0].data.createdAt, undefined);
  assert.equal(JSON.stringify(context.writes[1].data.ranks), JSON.stringify(body.ranks));
  assert.deepEqual(context.invalidated, ["/rankings/ranking123", "/rankings"]);
});
