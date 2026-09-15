import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { hasActiveRankrPass, serializeRankrPass } from "../../../lib/rankr-pass";

function setup(pass?: unknown) {
  const reads: string[] = [];
  const exports: { GET?: (req: Request) => Promise<Response> } = {};
  const code = ts.transpileModule(readFileSync(new URL("./route.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, Response, URL, require(name: string) {
    if (name === "@/lib/rankr-pass") return { hasActiveRankrPass, serializeRankrPass };
    if (name === "@/lib/firebase-admin") return {
      auth: { async verifyIdToken(token: string, revoked: boolean) { assert.equal(revoked, true); if (token !== "valid") throw Error(); return { uid: "viewer" }; } },
      db: { collection(collection: string) { assert.equal(collection, "users"); return { doc(uid: string) { assert.equal(uid, "viewer"); return { async get() { reads.push("profile"); return { data: () => ({ rankrPass: pass }) }; } }; } }; } },
    };
    if (name === "@/lib/odds/loadOdds") return {
      validWeek: (season: string, week: string) => season === "2026" && week === "week-2",
      async loadWeekOdds() { reads.push("week"); return { season: 2026, week: 2, games: [] }; },
      async availableWeeks() { reads.push("weeks"); return [2]; },
      async loadGameOdds() { reads.push("game"); return { playerProps: [{ playerName: "Paid player props" }] }; },
    };
    throw Error(name);
  } });
  return { get: exports.GET!, reads };
}
function request(token = "valid", game = true) {
  return new Request(`http://localhost/api/odds?season=2026&week=week-2${game ? "&game=buf-mia" : ""}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
}

test("anonymous and invalid tokens cannot read any odds", async () => {
  for (const token of ["", "invalid"]) for (const game of [false, true]) {
    const context = setup();
    assert.equal((await context.get(request(token, game))).status, 401);
    assert.deepEqual(context.reads, []);
  }
});
test("signed-in free users receive weekly summaries but no player props", async () => {
  const context = setup();
  const response = await context.get(request("valid", false));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("Vary"), "Authorization");
  assert.equal((await response.text()).includes("playerProps"), false);
  assert.deepEqual(context.reads, ["profile", "week", "weeks"]);
});
test("missing, revoked, expired, and malformed passes are denied before odds reads", async () => {
  for (const pass of [undefined, { expiresAt: null }, { expiresAt: Date.now() - 1 }, { expiresAt: "2099-01-01" }]) {
    const context = setup(pass);
    assert.equal((await context.get(request())).status, 403);
    assert.deepEqual(context.reads, ["profile"]);
  }
});
test("an active Firestore pass permits game data", async () => {
  const context = setup({ expiresAt: { toMillis: () => Date.now() + 60000 } });
  const response = await context.get(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).game.playerProps[0].playerName, "Paid player props");
  assert.deepEqual(context.reads, ["profile", "week", "game"]);
});
