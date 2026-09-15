import assert from "node:assert/strict";
import { test } from "node:test";
import { hasActiveRankrPass, serializeRankrPass } from "./rankr-pass";

test("passes end exactly at expiry and renewal extends access", () => {
  assert.equal(hasActiveRankrPass({ expiresAt: 2000 }, 1999), true);
  assert.equal(hasActiveRankrPass({ expiresAt: 2000 }, 2000), false);
  assert.equal(hasActiveRankrPass({ expiresAt: 2000 }, 2001), false);
  assert.equal(hasActiveRankrPass({ expiresAt: 3000 }, 2001), true);
});

test("missing, revoked and invalid passes never grant access", () => {
  for (const value of [undefined, null, {}, { expiresAt: null }, { expiresAt: NaN }, { expiresAt: Infinity }, { expiresAt: "2099-01-01" }, { expiresAt: -1 }, { expiresAt: { toMillis() { throw Error(); } } }]) {
    assert.equal(hasActiveRankrPass(value, 1000), false);
    assert.deepEqual(serializeRankrPass(value), { expiresAt: null });
  }
});

test("Firestore timestamps serialize to a safe client payload", () => {
  const raw = { expiresAt: { toMillis: () => 2000 }, billingCustomerId: "private" };
  assert.deepEqual(serializeRankrPass(raw), { expiresAt: 2000 });
  assert.equal(hasActiveRankrPass(raw, 1000), true);
});
