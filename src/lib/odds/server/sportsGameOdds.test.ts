import { SPORTSBOOK_IDS } from "../sportsbooks";
import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTestModule } from "./testHelpers";
import type { fetchNFLEvents } from "./sportsGameOdds";

function client(key = "test-only-placeholder") {
  return loadTestModule<{ fetchNFLEvents: typeof fetchNFLEvents }>("src/lib/odds/server/sportsGameOdds.ts", {}, { process: { env: { SPORTSGAMEODDS_API_KEY: key } } }).fetchNFLEvents;
}
test("requests NFL/date/market filters, authenticates in headers, and follows cursors", async () => {
  let calls = 0;
  const result = await client()(2026, 1, async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "https://api.sportsgameodds.com");
    assert.equal(url.searchParams.get("leagueID"), "NFL");
    assert.equal(url.searchParams.get("startsAfter"), "2026-09-09T04:00:00.000Z");
    assert.equal(url.searchParams.get("includeAltLines"), "false");
    assert.ok(url.searchParams.get("oddID")?.includes("passing_yards-PLAYER_ID-game-ou-over"));
    assert.equal(url.searchParams.has("oddsAvailable"), false);
    assert.equal(url.searchParams.has("apiKey"), false);
    assert.equal(new Headers(init?.headers).get("x-api-key"), "test-only-placeholder");
    assert.equal(init?.redirect, "error");
    if (calls++) { assert.equal(url.searchParams.get("cursor"), "page-two"); return Response.json({ success: true, data: [2] }); }
    return Response.json({ success: true, data: [1], nextCursor: "page-two" });
  });
  assert.equal(JSON.stringify(result), "[1,2]");
  assert.equal(calls, 2);
});
test("missing key, bad responses, rate limits and failed pagination reject safely", async () => {
  await assert.rejects(client("")(2026, 1), /not configured/);
  for (const status of [401, 403, 429, 500]) {
    await assert.rejects(client()(2026, 1, async () => new Response("sensitive upstream body", { status })), error => !String(error).includes("sensitive"));
  }
  for (const body of [{ success: true, data: {} }, { success: false, data: [] }, { success: true, data: [], nextCursor: 2 }]) {
    await assert.rejects(client()(2026, 1, async () => Response.json(body)), /malformed/);
  }
  await assert.rejects(client()(2026, 1, async () => new Response("not json")), /malformed/);
  await assert.rejects(client()(2026, 1, async () => { throw new Error("token must not escape"); }), /Unable to reach/);
  await assert.rejects(client()(2026, 1, async () => Response.json({ success: true, data: [], nextCursor: "repeated" })), /pagination/);
  let calls = 0;
  await assert.rejects(client()(2026, 1, async () => calls++ ? new Response("failure", { status: 500 }) : Response.json({ success: true, data: [1], nextCursor: "two" })), /could not return/);
});

test("plan-restricted books are excluded and the remaining books still paginate", async () => {
  const excluded: string[] = [];
  let calls = 0;
  const events = await client()(2026, 1, async input => {
    const url = new URL(String(input));
    if (calls++ === 0) {
      assert.ok(url.searchParams.get("bookmakerID")?.includes("caesars"));
      return Response.json({ success: false, error: "The bookmakerID caesars is unavailable at your current subscription tier. Upgrade to unlock" }, { status: 400 });
    }
    assert.ok(!url.searchParams.get("bookmakerID")?.includes("caesars"));
    assert.ok(url.searchParams.get("bookmakerID")?.includes("draftkings"));
    return Response.json(calls === 2 ? { success: true, data: [1], nextCursor: "two" } : { success: true, data: [2] });
  }, book => excluded.push(book));
  assert.deepEqual(excluded, ["caesars"]);
  assert.equal(JSON.stringify(events), "[1,2]");
  assert.equal(calls, 3);
});

test("book exclusions are bounded and never remove the filter entirely", async () => {
  let calls = 0;
  await assert.rejects(client()(2026, 1, async input => {
    calls++;
    const books = new URL(String(input)).searchParams.get("bookmakerID");
    assert.ok(books);
    return Response.json({ success: false, error: `The bookmakerID ${books.split(",")[0]} is unavailable at your current subscription tier. Upgrade to unlock` }, { status: 400 });
  }), /None of the supported sportsbooks/);
  assert.equal(calls, SPORTSBOOK_IDS.length);
});

test("unknown validation errors stay sanitized and mid-pagination restrictions fail closed", async () => {
  await assert.rejects(client()(2026, 1, async () => Response.json({ error: "private upstream data" }, { status: 400 })), /HTTP 400/);
  let calls = 0;
  await assert.rejects(client()(2026, 1, async () => calls++ === 0
    ? Response.json({ success: true, data: [1], nextCursor: "two" })
    : Response.json({ error: "The bookmakerID caesars is unavailable at your current subscription tier. Upgrade to unlock" }, { status: 400 })), /consistent snapshot/);
  assert.equal(calls, 2);
});

test("an empty successful page finishes without retrying", async () => {
  let calls = 0;
  const events = await client()(2026, 1, async () => { calls++; return Response.json({ success: true, data: [] }); });
  assert.equal(events.length, 0);
  assert.equal(calls, 1);
});
