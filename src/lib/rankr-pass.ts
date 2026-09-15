/** Stored in users/{uid}. Only trusted server/admin code should grant or renew passes. */
export interface RankrPass {
  expiresAt: number | null;
}

/** Convert Firestore timestamps to milliseconds before crossing a server/client boundary. */
export function serializeRankrPass(value: unknown): RankrPass {
  if (!value || typeof value !== "object" || !("expiresAt" in value)) return { expiresAt: null };
  const expiry = value.expiresAt;
  let milliseconds: unknown = expiry;
  if (expiry && typeof expiry === "object" && "toMillis" in expiry && typeof expiry.toMillis === "function") {
    try { milliseconds = expiry.toMillis(); } catch { return { expiresAt: null }; }
  }
  return { expiresAt: typeof milliseconds === "number" && Number.isFinite(milliseconds) && milliseconds > 0 ? milliseconds : null };
}

export function hasActiveRankrPass(value: unknown, now = Date.now()): boolean {
  const { expiresAt } = serializeRankrPass(value);
  return expiresAt !== null && expiresAt > now;
}
