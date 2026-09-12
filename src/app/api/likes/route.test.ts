import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function setup(failCommit = false) {
  const records = new Map<string, Record<string, unknown>>([
    ["rankings-meta/r1", { author: { uid: "owner" }, rankObj: { visibility: "PUBLIC", name: "Test" } }],
    ["users/viewer", { username: "viewer", displayName: "Viewer", email: "private@example.com" }],
  ]);
  const snapshot = (key: string) => ({ id: key.split("/").pop(), exists: records.has(key), data: () => records.get(key) });
  const exports: { GET?: (req: Request) => Promise<Response>; PUT?: (req: Request) => Promise<Response> } = {};
  const code = ts.transpileModule(readFileSync(new URL("./route.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, Response, URL, Buffer, console: { error() {} }, require(name: string) {
    if (name === "next/cache") return { revalidatePath() {} };
    if (name === "@/hooks/formatTimeStamp") return { default: () => "—" };
    if (name !== "@/lib/firebase-admin") throw new Error(name);
    return {
      auth: { async verifyIdToken(token: string, revoked: boolean) { assert.equal(revoked, true); if (!["viewer", "owner"].includes(token)) throw new Error("Invalid"); return { uid: token }; } },
      admin: { firestore: { FieldValue: { serverTimestamp: () => 123 } } },
      db: {
        collection(collection: string) { return {
          doc(id: string) { const key = `${collection}/${id}`; return { key, get: async () => snapshot(key) }; },
          where(field: string, operator: string, value: string) { assert.equal(operator, "=="); return { get: async () => ({ docs: [...records].filter(([key, data]) => key.startsWith(`${collection}/`) && data[field] === value).map(([key]) => snapshot(key)) }) }; },
        }; },
        async runTransaction(callback: (transaction: unknown) => Promise<unknown>) {
          const pending: (() => void)[] = [];
          const result = await callback({
            get: async (ref: { key: string }) => snapshot(ref.key),
            set: (ref: { key: string }, value: Record<string, unknown>) => pending.push(() => { records.set(ref.key, value); }),
            delete: (ref: { key: string }) => pending.push(() => { records.delete(ref.key); }),
            update: (ref: { key: string }, value: Record<string, unknown>) => pending.push(() => { records.set(ref.key, { ...records.get(ref.key), ...value }); }),
          });
          if (failCommit) throw new Error("Commit failed");
          pending.forEach(write => write());
          return result;
        },
      },
    };
  } });
  return { records, get: exports.GET!, put: exports.PUT! };
}
const request = (method: string, token = "viewer", body: unknown = { rankingId: "r1", liked: true }, query = "") => new Request(`http://localhost/api/likes${query}`, { method, headers: token ? { Authorization: `Bearer ${token}` } : {}, ...(method === "PUT" ? { body: JSON.stringify(body) } : {}) });

test("sign-in is required for mutations, saved rankings and liker identities", async () => {
  for (const token of ["", "invalid"]) {
    const context = setup();
    assert.equal((await context.put(request("PUT", token))).status, 401);
    assert.equal((await context.get(request("GET", token))).status, 401);
    assert.equal((await context.get(request("GET", token, null, "?rankingId=r1&users=true"))).status, 401);
  }
});
test("owners cannot like their ranking, even with a forged uid", async () => {
  const context = setup();
  assert.equal((await context.put(request("PUT", "owner", { rankingId: "r1", liked: true, uid: "viewer" }))).status, 403);
  assert.equal(context.records.size, 2);
});
test("repeated likes and unlikes are idempotent and counts never go negative", async () => {
  const context = setup();
  for (const liked of [true, true, false, false]) {
    const response = await context.put(request("PUT", "viewer", { rankingId: "r1", liked }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { liked, count: liked ? 1 : 0 });
    assert.equal(context.records.get("rankings-meta/r1")?.likeCount, liked ? 1 : 0);
  }
  assert.equal(context.records.size, 2);
});
test("liker list returns public profile fields only and saved likes belong to caller", async () => {
  const context = setup();
  await context.put(request("PUT"));
  const response = await context.get(request("GET", "viewer", null, "?rankingId=r1&users=true"));
  assert.deepEqual((await response.json()).users, [{ uid: "viewer", username: "viewer", displayName: "Viewer", pfp: "" }]);
  assert.equal((await (await context.get(request("GET"))).json()).rankings.length, 1);
  assert.equal((await (await context.get(request("GET", "owner"))).json()).rankings.length, 0);
  context.records.delete("rankings-meta/r1");
  assert.equal((await (await context.get(request("GET"))).json()).rankings.length, 0);
});
test("private rankings cannot be liked or have their likers exposed to other users", async () => {
  const context = setup();
  context.records.set("rankings-meta/r1", { author: { uid: "owner" }, rankObj: { visibility: "PRIVATE" } });
  assert.equal((await context.put(request("PUT"))).status, 403);
  assert.equal((await context.get(request("GET", "viewer", null, "?rankingId=r1&users=true"))).status, 403);
});
test("invalid input, missing rankings and failed writes cannot change counts", async () => {
  for (const body of [null, {}, { rankingId: "../r1", liked: true }, { rankingId: "r1", liked: "true" }]) {
    const context = setup();
    assert.equal((await context.put(request("PUT", "viewer", body))).status, 400);
    assert.equal(context.records.size, 2);
  }
  const missing = setup();
  assert.equal((await missing.put(request("PUT", "viewer", { rankingId: "missing", liked: true }))).status, 404);
  const failed = setup(true);
  assert.equal((await failed.put(request("PUT"))).status, 500);
  assert.equal(failed.records.size, 2);
  assert.equal(failed.records.get("rankings-meta/r1")?.likeCount, undefined);
});
