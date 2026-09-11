import { readTemplate } from "@/lib/template-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json((await readTemplate()).players, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Unable to load players. Please retry." }, { status: 503 });
  }
}
