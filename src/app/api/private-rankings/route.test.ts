import { serializeRankrPass } from "../../../lib/rankr-pass";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function setup() {
  const records = new Map<string, Record<string, unknown>>([
    ["rankings-meta/secret", { author: { uid: "owner" }, rankObj: { visibility: "PRIVATE", name: "Secret board" } }],
    ["rankings-meta/public", { author: { uid: "owner" }, rankObj: { visibility: "PUBLIC", name: "Public board" } }],
    ["rankings-meta/other", { author: { uid: "other" }, rankObj: { visibility: "PRIVATE", name: "Other board" } }],
    ["rankings-ranks/secret", { ranks: [{ player_id: "123", rank: 1 }] }],
  ]);
  const reads: string[] = [];
  const snapshot = (key: string) => ({ id: key.split("/")[1], exists: records.has(key), data: () => records.get(key) });
  const exports: { GET?: (req: Request) => Promise<Response> } = {};
  const code = ts.transpileModule(readFileSync(new URL("./route.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, Response, URL, require(name: string) {
    if (name === "@/lib/rankr-pass") return { serializeRankrPass };
    if (name === "@/lib/rankr-pass-server") return { withRankrPass: async (rows: unknown[]) => rows };
    if (name === "@/hooks/formatTimeStamp") return { default: () => "—" };
    if (name !== "@/lib/firebase-admin") throw new Error(name);
    return {
      auth: { async verifyIdToken(token: string, revoked: boolean) { assert.equal(revoked, true); if (!["owner", "other"].includes(token)) throw new Error("Invalid"); return { uid: token }; } },
      db: {
        collection(collection: string) { return {
          doc(id: string) { return { key: `${collection}/${id}` }; },
          where(field: string, operator: string, uid: string) {
            assert.equal(field, "author.uid"); assert.equal(operator, "==");
            return { get: async () => ({ docs: [...records].filter(([key, data]) => key.startsWith(`${collection}/`) && (data.author as { uid: string })?.uid === uid).map(([key]) => snapshot(key)) }) };
          },
        }; },
        async runTransaction(callback: (transaction: unknown) => Promise<unknown>) {
          return callback({ get: async (ref: { key: string }) => { reads.push(ref.key); return snapshot(ref.key); } });
        },
      },
    };
  } });
  return { get: exports.GET!, reads };
}
const request = (token: string, query = "?id=secret") => new Request(`http://localhost/api/private-rankings${query}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

test("anonymous and invalid tokens cannot read private metadata or ranks", async () => {
  for (const token of ["", "invalid"]) {
    const context = setup();
    const response = await context.get(request(token));
    assert.equal(response.status, 401);
    assert.deepEqual(context.reads, []);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  }
});
test("nonowners and forged query identities never receive private ranking contents", async () => {
  const context = setup();
  const response = await context.get(request("other", "?id=secret&uid=owner"));
  assert.equal(response.status, 404);
  assert.ok(!(await response.text()).includes("Secret board"));
  assert.deepEqual(context.reads, ["rankings-meta/secret"]);
});
test("the owner receives metadata and player order without shared caching", async () => {
  const context = setup();
  const response = await context.get(request("owner"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.meta.rankObj.name, "Secret board");
  assert.deepEqual(body.ranks, [{ player_id: "123", rank: 1 }]);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("Vary"), "Authorization");
});
test("private list uses token identity, excludes public rankings and other owners", async () => {
  const context = setup();
  const response = await context.get(request("owner", "?uid=other"));
  assert.deepEqual((await response.json()).rankings.map((rank: { id: string }) => rank.id), ["secret"]);
});
test("invalid and missing IDs fail without exposing content", async () => {
  const context = setup();
  assert.equal((await context.get(request("owner", "?id=bad/path"))).status, 400);
  assert.equal((await context.get(request("owner", "?id=missing"))).status, 404);
});
