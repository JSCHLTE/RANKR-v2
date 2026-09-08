import assert from "node:assert/strict";
import { test } from "node:test";
import { rankBelowPlayer } from "./ranking-reorder";

function moveBelow(order: string[], source: string, target: string) {
  const destination = rankBelowPlayer(order.indexOf(source) + 1, order.indexOf(target) + 1);
  const next = order.filter(id => id !== source);
  next.splice(destination - 1, 0, source);
  return next;
}

test("click moves immediately below the target in either direction", () => {
  assert.deepEqual(moveBelow(["a", "b", "c", "d"], "a", "c"), ["b", "c", "a", "d"]);
  assert.deepEqual(moveBelow(["a", "b", "c", "d"], "d", "a"), ["a", "d", "b", "c"]);
});

test("click handles adjacent rows and the last row", () => {
  assert.deepEqual(moveBelow(["a", "b", "c"], "b", "a"), ["a", "b", "c"]);
  assert.deepEqual(moveBelow(["a", "b", "c"], "a", "b"), ["b", "a", "c"]);
  assert.deepEqual(moveBelow(["a", "b", "c"], "a", "c"), ["b", "c", "a"]);
});

test("filtered destinations use overall ranks, preserving hidden players", () => {
  assert.deepEqual(moveBelow(["qb1", "rb1", "wr1", "te1", "qb2"], "qb2", "qb1"), ["qb1", "qb2", "rb1", "wr1", "te1"]);
  assert.deepEqual(moveBelow(["qb1", "rb1", "wr1", "te1", "qb2"], "qb1", "te1"), ["rb1", "wr1", "te1", "qb1", "qb2"]);
});
