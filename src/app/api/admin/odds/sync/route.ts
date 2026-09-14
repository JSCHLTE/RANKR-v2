import { auth } from "@/lib/firebase-admin";
import { isAdmin } from "@/lib/admin-access";
import { syncOdds } from "@/lib/odds/server/syncOdds";
import { OddsSyncError } from "@/lib/odds/server/errors";
import { object } from "@/lib/odds/server/validation";
import { weekRange } from "@/lib/odds/server/weekRange";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ") || !header.slice(7).trim()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const decoded = await auth.verifyIdToken(header.slice(7), true);
    if (!isAdmin(decoded.uid)) return Response.json({ error: "Forbidden" }, { status: 403 });
  } catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }
  let body: Record<string, unknown> | null;
  try {
    const text = await request.text();
    if (text.length > 1024) return Response.json({ error: "Request is too large." }, { status: 413 });
    body = object(JSON.parse(text));
  } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (!body || typeof body.season !== "number" || typeof body.week !== "number" || Object.keys(body).some(key => key !== "season" && key !== "week")) {
    return Response.json({ error: "Provide only numeric season and week." }, { status: 400 });
  }
  try {
    weekRange(body.season, body.week);
    const result = await syncOdds(body.season, body.week);
    revalidatePath(`/odds/nfl/${body.season}/week-${body.week}`, "layout");
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof OddsSyncError) return Response.json({ error: error.message }, { status: error.status });
    // No raw SDK/provider error objects: those can include request credentials.
    console.error("Odds sync failed during storage or server processing.");
    return Response.json({ error: "Unable to save odds. Please try again or check the server's Firestore configuration." }, { status: 500 });
  }
}
