// app/api/set-username/route.ts
import { db } from "@/lib/firebase-admin";
import { NextRequest } from "next/server";

const isValidFormat = (username: string) => {
  if (username.length < 3 || username.length > 20) return false;
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return false;
  return true;
};

export async function POST(req: NextRequest) {
  const { username, uid } = await req.json();

  if (!isValidFormat(username))
    return Response.json({ error: "Invalid format" }, { status: 400 });

  const usernameRef = db.collection("usernames").doc(username);
  const userRef = db.collection("users").doc(uid);

  try {
    await db.runTransaction(async (t) => {
      const usernameDoc = await t.get(usernameRef);
      if (usernameDoc.exists) throw new Error("Username taken");

      t.set(usernameRef, { uid });
      t.set(userRef, { username }, { merge: true });
    });

    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 409 });
  }
}