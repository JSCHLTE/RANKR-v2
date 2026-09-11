import { auth } from "@/lib/firebase-admin";
import { isAdmin } from "@/lib/admin-access";
import { readTemplate, saveTemplate, TemplateError } from "@/lib/template-files";
import { templateError } from "@/lib/template-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorize(request: Request) {
  const token = request.headers.get("authorization");
  if (!token?.startsWith("Bearer ")) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const user = await auth.verifyIdToken(token.slice(7), true);
    if (!isAdmin(user.uid)) return Response.json({ error: "Admin access required." }, { status: 403 });
  } catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }
}

function failure(error: unknown) {
  if (error instanceof TemplateError) return Response.json({ error: error.message }, { status: error.status });
  console.error("Template operation failed", error);
  return Response.json({ error: "Unable to access template files. The server needs persistent write access to the project directory." }, { status: 500 });
}

export async function GET(request: Request) {
  const denied = await authorize(request);
  if (denied) return denied;
  try { return Response.json(await readTemplate(), { headers: { "Cache-Control": "no-store" } }); } catch (error) { return failure(error); }
}

export async function PUT(request: Request) {
  const denied = await authorize(request);
  if (denied) return denied;
  let body;
  try {
    const text = await request.text();
    if (text.length > 3000000) return Response.json({ error: "Template is too large." }, { status: 413 });
    body = JSON.parse(text);
  } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  const error = templateError(body);
  if (error || typeof body?.revision !== "string") return Response.json({ error: error || "Missing revision." }, { status: 400 });
  try { return Response.json(await saveTemplate(body, body.revision)); } catch (error) { return failure(error); }
}
