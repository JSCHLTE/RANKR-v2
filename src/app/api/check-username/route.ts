import { db } from "@/lib/firebase-admin";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const username = req.nextUrl.searchParams.get("username");
    if (!username) return Response.json({ error: "No username" }, { status: 400 });

    const doc = await db.collection("usernames").doc(username.toLowerCase()).get();
    return Response.json({ available: !doc.exists });
  } catch (err) {
    console.error("check-username error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}