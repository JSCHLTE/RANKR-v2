import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTestModule, providerEvent } from "./testHelpers";
import { normalizeSportsGameOdds } from "./normalizeSportsGameOdds";
import type * as Store from "./store";
import type * as Loader from "../loadOdds";

type Data = Record<string, unknown>;
class Stamp {
  constructor(public nanoseconds: number) {}
  toDate() { return new Date("2026-09-14T12:00:00Z"); }
}
function database() {
  const records = new Map<string, Data>();
  let version = 0;
  let failCommit = false;
  let mutations = 0;
  const timestamp = new Stamp(1);
  function ref(path: string) {
    return { path, id: path.split("/").pop()!, collection: (name: string) => query(`${path}/${name}`), get: async () => snapshot(path) };
  }
  function snapshot(path: string) {
    return { id: path.split("/").pop()!, ref: ref(path), exists: records.has(path), data: () => records.get(path), updateTime: new Stamp(version) };
  }
  function query(path: string, field?: string, value?: unknown) {
    return { path, isQuery: true, doc: (id: string) => ref(`${path}/${id}`),
      where: (key: string, op: string, val: unknown) => { assert.equal(op, "=="); return query(path, key, val); },
      select: () => query(path, field, value),
      get: async () => ({ docs: [...records].filter(([key, data]) => key.startsWith(`${path}/`) && key.split("/").length === path.split("/").length + 1 && (!field || data[field] === value)).map(([key]) => snapshot(key)) }),
    };
  }
  const db = { collection: (name: string) => query(name), async runTransaction(callback: (tx: unknown) => Promise<unknown>, options?: { readOnly?: boolean }) {
    const pending: (() => void)[] = [];
    const value = await callback({
      get: async (target: { get: () => Promise<unknown> }) => { assert.equal(pending.length, 0, "all reads precede writes"); return target.get(); },
      set: (target: { path: string }, data: Data) => pending.push(() => records.set(target.path, data)),
      delete: (target: { path: string }) => pending.push(() => records.delete(target.path)),
    });
    if (options?.readOnly) assert.equal(pending.length, 0);
    if (failCommit) throw new Error("Commit failed");
    pending.forEach(write => write());
    if (pending.length) { version++; mutations += pending.length; }
    return value;
  } };
  const mocks = {
    "@/lib/firebase-admin": { db },
    "firebase-admin/firestore": { FieldValue: { serverTimestamp: () => timestamp }, Timestamp: { fromDate: () => timestamp } },
  };
  return { records, store: loadTestModule<typeof Store>("src/lib/odds/server/store.ts", mocks), loader: loadTestModule<typeof Loader>("src/lib/odds/loadOdds.ts", mocks),
    fail: () => { failCommit = true; }, mutations: () => mutations };
}
test("syncs overwrite books and props atomically, remove withdrawn games, and preserve other weeks", async () => {
  const context = database();
  const [first] = normalizeSportsGameOdds([providerEvent()], 2026, 1);
  const second = { ...first, eventId: "second", slug: "det-gb" };
  context.records.set("odds-weeks/2026-week-2", { retained: true });
  context.records.set("odds-games/unrelated", { weekKey: "2026-week-2" });
  await context.store.publishSnapshot(2026, 1, [first, second], null);
  assert.equal(context.records.has("odds-games/second/props/passing-0"), true);
  const revision = await context.store.currentRevision(2026, 1);
  await context.store.publishSnapshot(2026, 1, [{ ...first, gameOdds: { fanduel: { moneyline: { homeOdds: 120 } } }, playerProps: [] }], revision);
  assert.equal(context.records.has("odds-games/second"), false);
  assert.equal(context.records.has("odds-games/second/props/passing-0"), false);
  assert.equal(context.records.has("odds-games/fixture-event-1/props/passing-0"), false);
  const loaded = await context.loader.loadGameOdds("2026", "week-1", "buf-mia");
  assert.equal(loaded?.gameOdds.draftkings, undefined);
  assert.equal(loaded?.gameOdds.fanduel?.moneyline?.homeOdds, 120);
  assert.equal(loaded?.playerProps.length, 0);
  assert.equal(context.records.has("odds-games/unrelated"), true);
  assert.equal(context.records.get("odds-weeks/2026-week-2")?.retained, true);
});
test("idempotent IDs and loader reconstruction preserve existing frontend types", async () => {
  const context = database();
  const games = normalizeSportsGameOdds([providerEvent()], 2026, 1);
  await context.store.publishSnapshot(2026, 1, games, null);
  const count = context.records.size;
  await context.store.publishSnapshot(2026, 1, games, await context.store.currentRevision(2026, 1));
  assert.equal(context.records.size, count);
  const week = await context.loader.loadWeekOdds("2026", "week-1");
  const game = await context.loader.loadGameOdds("2026", "week-1", "buf-mia");
  assert.equal(week?.isMock, false);
  assert.equal(week?.games[0].eventId, game?.eventId);
  assert.equal(game?.playerProps[0].playerName, "Josh Allen");
  assert.equal(JSON.stringify(await context.loader.availableWeeks("2026")), "[1]");
  assert.equal(await context.loader.loadWeekOdds("2026", "week-2"), null);
  assert.equal(await context.loader.loadGameOdds("2026", "week-1", "det-gb"), null);
  assert.equal(await context.loader.loadGameOdds("2026", "week-1", "../escape"), null);
});
test("a failed transaction or stale revision cannot publish partial data", async () => {
  const context = database();
  const games = normalizeSportsGameOdds([providerEvent()], 2026, 1);
  await context.store.publishSnapshot(2026, 1, games, null);
  const before = JSON.stringify([...context.records]);
  await assert.rejects(context.store.publishSnapshot(2026, 1, [], null), /another sync/);
  assert.equal(JSON.stringify([...context.records]), before);
  const revision = await context.store.currentRevision(2026, 1);
  context.fail();
  await assert.rejects(context.store.publishSnapshot(2026, 1, [], revision), /Commit failed/);
  assert.equal(JSON.stringify([...context.records]), before);
});
test("guards other-week IDs, large snapshots, and inconsistent reads", async () => {
  const context = database();
  const games = normalizeSportsGameOdds([providerEvent()], 2026, 1);
  context.records.set(`odds-games/${games[0].eventId}`, { weekKey: "2026-week-2" });
  await assert.rejects(context.store.publishSnapshot(2026, 1, games, null), /another stored week/);
  assert.equal(context.mutations(), 0);
  context.records.clear();
  const tooMany = Array.from({ length: 401 }, (_, index) => ({ ...games[0], eventId: `game-${index}`, playerProps: [] }));
  await assert.rejects(context.store.publishSnapshot(2026, 1, tooMany, null), /safety limit/);
  assert.equal(context.mutations(), 0);
  await context.store.publishSnapshot(2026, 1, games, null);
  context.records.get(`odds-games/${games[0].eventId}/props/passing-0`)!.snapshotId = "incorrect";
  await assert.rejects(context.loader.loadGameOdds("2026", "week-1", "buf-mia"), /inconsistent/);
});
