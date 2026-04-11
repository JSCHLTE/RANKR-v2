// app/api/set-username/route.ts
import { db } from "@/lib/firebase-admin";
import { NextRequest } from "next/server";

const isValidFormat = (username: string) => {
  if (username.length < 3 || username.length > 16) return false;
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) return false;
  return true;
};

export async function POST(req: NextRequest) {
  let username, uid, pfp

  try {
    ({ username, uid, pfp } = await req.json());
  } catch(e: any) {
    return Response.json({ error: e.message }, { status: 400 })
  }

  if (!isValidFormat(username))
    return Response.json({ error: "Invalid format" }, { status: 400 });

  const usernameRef = db.collection("usernames").doc(username.toLowerCase());
  const userRef = db.collection("users").doc(uid);

  try {
    await db.runTransaction(async (t) => {
      const usernameDoc = await t.get(usernameRef);
      const userDoc = await t.get(userRef);

      if (usernameDoc.exists) throw new Error("Username taken");
      if (userDoc.exists) throw new Error("Username already set");

      t.set(usernameRef, { uid });
      t.set(userRef, { username: username.toLowerCase(), displayName: username, pfp, isPaid: false }, { merge: true });
    });

    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 409 });
  }
}