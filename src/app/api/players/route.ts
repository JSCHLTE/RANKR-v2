import { readTemplate } from "@/lib/template-files";
import { withPlayerExperience } from "@/lib/player-experience";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { players } = await readTemplate();
    return Response.json(await withPlayerExperience(players), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Unable to load players. Please retry." }, { status: 503 });
  }
}
