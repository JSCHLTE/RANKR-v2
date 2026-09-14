import assert from "node:assert/strict";
import { test } from "node:test";
import { ADMIN_UID } from "@/lib/admin-access";
import { loadTestModule } from "@/lib/odds/server/testHelpers";

function setup(fail = false) {
  let synced = 0;
  let revalidated = 0;
  const { POST } = loadTestModule<{ POST: (request: Request) => Promise<Response> }>("src/app/api/admin/odds/sync/route.ts", {
    "@/lib/firebase-admin": { auth: { async verifyIdToken(token: string, revoked: boolean) {
      assert.equal(revoked, true);
      if (token === "admin-token") return { uid: ADMIN_UID };
      if (token === "user-token") return { uid: "not-admin" };
      throw new Error("private auth error");
    } } },
    "@/lib/odds/server/syncOdds": { async syncOdds(season: number, week: number) {
      synced++;
      assert.equal(season, 2026); assert.equal(week, 2);
      if (fail) throw new Error("private firestore error with token");
      return { success: true, gamesWritten: 16, propsWritten: 742 };
    } },
    "next/cache": { revalidatePath(path: string) { assert.equal(path, "/odds/nfl/2026/week-2"); revalidated++; } },
  });
  return { POST, synced: () => synced, revalidated: () => revalidated };
}
function request(token = "admin-token", body: unknown = { season: 2026, week: 2 }) {
  return new Request("http://localhost/api/admin/odds/sync", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: JSON.stringify(body) });
}
test("missing, invalid and revoked tokens are rejected before syncing", async () => {
  const context = setup();
  for (const token of ["", "invalid", "revoked"]) assert.equal((await context.POST(request(token))).status, 401);
  assert.equal(context.synced(), 0);
});
test("authenticated non-admin cannot forge admin identity in the body", async () => {
  const context = setup();
  const response = await context.POST(request("user-token", { season: 2026, week: 2, uid: ADMIN_UID }));
  assert.equal(response.status, 403);
  assert.equal(context.synced(), 0);
});
test("server rejects dates, UIDs, malformed bodies, unsupported weeks and seasons", async () => {
  const context = setup();
  for (const body of [null, {}, { season: "2026", week: 2 }, { season: 2026, week: 0 }, { season: 2026, week: 2.5 }, { season: 2027, week: 2 }, { season: 2026, week: 2, uid: ADMIN_UID }, { season: 2026, week: 2, startsAfter: "2000-01-01" }]) {
    assert.equal((await context.POST(request("admin-token", body))).status, 400);
  }
  const invalid = new Request("http://localhost/api/admin/odds/sync", { method: "POST", headers: { Authorization: "Bearer admin-token" }, body: "{" });
  assert.equal((await context.POST(invalid)).status, 400);
  assert.equal((await context.POST(request("admin-token", { text: "x".repeat(1500) }))).status, 413);
  assert.equal(context.synced(), 0);
});
test("admin token triggers one sync and revalidation; storage errors stay private", async () => {
  const context = setup();
  const response = await context.POST(request());
  assert.equal(response.status, 200);
  assert.equal(context.synced(), 1);
  assert.equal(context.revalidated(), 1);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const failure = await setup(true).POST(request());
  assert.equal(failure.status, 500);
  assert.ok(!(await failure.text()).includes("private firestore"));
});
