"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/admin-access";
import { SPORTSBOOK_IDS, SPORTSBOOKS } from "@/lib/odds/sportsbooks";

export function AdminOddsSync({ season, week, onUpdated }: { season: number; week: number; onUpdated?: () => void }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);
  if (loading || !user || !isAdmin(user.uid)) return null;

  async function sync() {
    if (!user || inFlight.current) return;
    inFlight.current = true; setBusy(true); setFeedback(null);
    let errorMessage = "Unable to update odds. Check your connection and sign in again if needed.";
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/odds/sync", { method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ season, week }),
      });
      const result: unknown = await response.json();
      if (!result || typeof result !== "object") throw new Error();
      if (!response.ok) {
        if ("error" in result && typeof result.error === "string") errorMessage = result.error;
        throw new Error();
      }
      if (!("success" in result) || result.success !== true || !("gamesWritten" in result) || typeof result.gamesWritten !== "number" || !("propsWritten" in result) || typeof result.propsWritten !== "number") {
        errorMessage = "The sync response was incomplete. Refresh to check the latest data.";
        throw new Error();
      }
      const unavailableIds: unknown[] = "unavailableSportsbooks" in result && Array.isArray(result.unavailableSportsbooks) ? result.unavailableSportsbooks : [];
      const unavailable = SPORTSBOOK_IDS.filter(book => unavailableIds.includes(book)).map(book => SPORTSBOOKS[book].name);
      const notice = unavailable.length ? ` · Not included in your plan: ${unavailable.join(", ")}` : "";
      setFeedback({ text: `Odds updated successfully · ${result.gamesWritten} games · ${result.propsWritten} player props${notice}`, error: false });
      if (onUpdated) onUpdated();
      else router.refresh();
    } catch {
      setFeedback({ text: errorMessage, error: true });
    } finally { inFlight.current = false; setBusy(false); }
  }
  return <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
    {feedback && <p role={feedback.error ? "alert" : "status"} className={`text-xs ${feedback.error ? "text-[var(--danger)]" : "text-[var(--text-muted)]"}`}>{feedback.text}</p>}
    <button type="button" disabled={busy} onClick={sync} className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--surface-hover)] disabled:cursor-wait disabled:opacity-60">{busy ? "Updating odds..." : "Pull Updated Odds"}</button>
  </div>;
}
