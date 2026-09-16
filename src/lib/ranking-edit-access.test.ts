import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { oldestEditableIds } from "./ranking-edit-access";
import * as passHelpers from "./rankr-pass";

test("oldest two are chosen by creation time with stable ties and deletion promotion", () => {
  const rows = [{ id: "c", createdAt: 300 }, { id: "b", createdAt: 100 }, { id: "a", createdAt: 100 }];
  assert.deepEqual(oldestEditableIds(rows), ["a", "b"]);
  assert.deepEqual(oldestEditableIds(rows.filter(row => row.id !== "a")), ["b", "c"]);
  assert.equal(rows[0].id, "c");
});

test("server policy locks newer rankings only without an active pass", async () => {
  const exports: { rankingEditAccess?: (transaction: unknown, uid: string, rankingId: string) => Promise<{ canEdit: boolean }> } = {};
  const code = ts.transpileModule(readFileSync(new URL("./ranking-edit-access-server.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require(name: string) {
    if (name === "./rankr-pass") return passHelpers;
    if (name === "./ranking-edit-access") return { oldestEditableIds };
    if (name === "@/lib/firebase-admin") return { db: { collection: (collection: string) => ({
      doc: (uid: string) => { assert.equal(uid, "owner"); return { collection }; },
      where: (field: string, operator: string, uid: string) => { assert.equal(field, "author.uid"); assert.equal(operator, "=="); assert.equal(uid, "owner"); return { collection }; },
    }) } };
    throw Error(name);
  } });
  for (const pass of [undefined, { expiresAt: null }, { expiresAt: Date.now() - 1000 }, { expiresAt: Date.now() + 60000 }]) {
    const transaction = { get: async (ref: { collection: string }) => ref.collection === "users" ? { data: () => ({ rankrPass: pass }) } : {
      docs: ["oldest", "second", "newest"].map((id, index) => ({ id, data: () => ({ createdAt: { toMillis: () => index + 1 } }) })),
    } };
    for (const id of ["oldest", "second", "newest"]) {
      const result = await exports.rankingEditAccess!(transaction, "owner", id);
      assert.equal(result.canEdit, id !== "newest" || passHelpers.hasActiveRankrPass(pass));
    }
  }
});
