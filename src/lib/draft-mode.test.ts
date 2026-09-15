import assert from "node:assert/strict";
import { test } from "node:test";
import { draftStorageKey, emptyDraft, readDraft, togglePick } from "./draft-mode";

test("draft storage is isolated by account and ranking", () => {
  assert.notEqual(draftStorageKey("alice", "r1"), draftStorageKey("bob", "r1"));
  assert.notEqual(draftStorageKey("alice", "r1"), draftStorageKey("alice", "r2"));
  assert.notEqual(draftStorageKey("a:b", "c"), draftStorageKey("a", "b:c"));
});
test("marking switches ownership, repeats undo, and leaves the previous draft unchanged", () => {
  const initial = { ...emptyDraft(), active: true };
  const mine = togglePick(initial, "1", "mine");
  assert.deepEqual(initial.picks, {});
  assert.equal(mine.picks["1"], "mine");
  const other = togglePick(mine, "1", "other");
  assert.equal(other.picks["1"], "other");
  assert.deepEqual(togglePick(other, "1", "other").picks, {});
  assert.equal(togglePick(mine, "2", "mine").picks["1"], "mine");
});
test("refresh restores mode and picks, ignoring removed players and malformed values", () => {
  const saved = { active: true, picks: { "1": "mine", "2": "other", "3": "bad", "removed": "mine" } };
  assert.deepEqual(readDraft(JSON.stringify(saved), ["1", "2", "3"]), { active: true, picks: { "1": "mine", "2": "other" } });
  for (const raw of [null, "bad json", "null", "[]", '{"picks":[]}']) assert.deepEqual(readDraft(raw, ["1"]), emptyDraft());
  assert.equal(readDraft('{"active":"true","picks":{}}', []).active, false);
});
