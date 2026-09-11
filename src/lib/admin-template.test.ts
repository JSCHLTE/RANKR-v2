import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import * as crypto from "node:crypto";
import vm from "node:vm";
import ts from "typescript";
import * as access from "./admin-access";
import * as validation from "./template-data";

const template = {
  players: [{ player_id: "a", first_name: "First", last_name: "Player", fantasy_positions: ["QB"] }, { player_id: "b", first_name: "Second", last_name: "Player", fantasy_positions: ["RB"] }],
  ranks: [{ player_id: "a", rank: 1 }, { player_id: "b", rank: 2 }],
};

function moduleAt(filename: string, dependencies: Record<string, unknown>, cwd = process.cwd()) {
  const exports: Record<string, unknown> = {};
  const code = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, Response, setTimeout, console: { error: () => {} }, process: { cwd: () => cwd }, require: (name: string) => {
    if (!(name in dependencies)) throw new Error(`Unexpected import ${name}`);
    return dependencies[name];
  } });
  return exports;
}

test("only the configured UID is an admin", () => {
  assert.equal(access.isAdmin(access.ADMIN_UID), true);
  for (const uid of [null, undefined, "admin", "other-user"]) assert.equal(access.isAdmin(uid), false);
});

test("the repository template is accepted by the editor validator", () => {
  assert.equal(validation.templateError({
    players: JSON.parse(readFileSync("public/data/players_lite.json", "utf8")),
    ranks: JSON.parse(readFileSync("public/data/player_rankings.json", "utf8")),
  }), null);
});

test("template validation rejects unknown players, duplicate ranks and malformed metadata", () => {
  assert.equal(validation.templateError(template), null);
  for (const invalid of [null, {}, { ...template, players: [template.players[0], template.players[0]] },
    { ...template, ranks: [{ player_id: "unknown", rank: 1 }] },
    { ...template, ranks: [{ player_id: "a", rank: 1 }, { player_id: "b", rank: 1 }] },
    { ...template, players: [{ ...template.players[0], fantasy_positions: ["BAD"] }] }]) assert.ok(validation.templateError(invalid));
});

test("GET and PUT enforce verified UID before touching files", async () => {
  let reads = 0; let writes = 0;
  class TemplateError extends Error {}
  const loaded = moduleAt("src/app/api/admin/template/route.ts", {
    "@/lib/firebase-admin": { auth: { verifyIdToken: async (token: string, revoked: boolean) => {
      assert.equal(revoked, true);
      if (token === "bad") throw new Error("Invalid token");
      return { uid: token };
    } } },
    "@/lib/admin-access": access,
    "@/lib/template-data": validation,
    "@/lib/template-files": { TemplateError, readTemplate: async () => { reads++; return template; }, saveTemplate: async () => { writes++; return { revision: "saved" }; } },
  });
  for (const method of ["GET", "PUT"]) {
    const handler = loaded[method] as (req: Request) => Promise<Response>;
    for (const [token, status] of [["", 401], ["bad", 401], ["other-user", 403]] as const) {
      assert.equal((await handler(new Request("http://localhost/api/admin/template", { method, headers: token ? { authorization: `Bearer ${token}` } : {}, ...(method === "PUT" ? { body: JSON.stringify({ ...template, revision: "old", uid: access.ADMIN_UID }) } : {}) }))).status, status);
    }
    assert.equal(reads + writes, 0);
  }
  const put = loaded.PUT as (req: Request) => Promise<Response>;
  assert.equal((await put(new Request("http://localhost", { method: "PUT", headers: { authorization: `Bearer ${access.ADMIN_UID}` }, body: JSON.stringify({ ...template, revision: "old" }) }))).status, 200);
  assert.equal(writes, 1);
});

test("file saves preserve backups, reject stale revisions, and feed fresh template reads", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "rankr-template-test-"));
  try {
    const directory = path.join(root, "public", "data");
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, "players_lite.json"), JSON.stringify(template.players));
    await fs.writeFile(path.join(directory, "player_rankings.json"), JSON.stringify(template.ranks));
    const loaded = moduleAt("src/lib/template-files.ts", { "node:fs": { promises: fs }, "node:path": path, "node:crypto": crypto, "./template-data": validation }, root);
    const read = loaded.readTemplate as () => Promise<validation.TemplateSnapshot>;
    const save = loaded.saveTemplate as (data: validation.TemplateData, revision: string) => Promise<{ revision: string }>;
    const initial = await read();
    const changed = { ...template, ranks: [{ player_id: "b", rank: 1 }] };
    await save(changed, initial.revision);
    const current = await read();
    assert.deepEqual(JSON.parse(JSON.stringify(current.ranks)), changed.ranks);
    assert.equal(current.players.length, 2);
    await assert.rejects(save(template, initial.revision), /changed since/);
    await assert.rejects(save({ players: [template.players[1]], ranks: changed.ranks }, current.revision), /cannot be deleted/);
    const backups = await fs.readdir(path.join(root, ".template-backups"));
    assert.equal(backups.length, 1);
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(root, ".template-backups", backups[0], "player_rankings.json"), "utf8")), template.ranks);
  } finally {
    if (path.dirname(root) === path.resolve(os.tmpdir()) && path.basename(root).startsWith("rankr-template-test-")) await fs.rm(root, { recursive: true, force: true });
  }
});
