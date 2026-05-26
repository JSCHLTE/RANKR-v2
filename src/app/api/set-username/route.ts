import { db, auth } from "@/lib/firebase-admin";
import { NextRequest } from "next/server";

const isValidFormat = (username: string) => {
  if (username.length < 3 || username.length > 16) return false;
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) return false;
  return true;
};

export async function POST(req: NextRequest) {
  let username, pfp

  try {
    ({ username, pfp } = await req.json());
  } catch(e: any) {
    return Response.json({ error: e.message }, { status: 400 })
  }

  if (!isValidFormat(username))
    return Response.json({ error: "Invalid format" }, { status: 400 });

  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split("Bearer ")[1];

  let decodedToken;

  try {
    decodedToken = await auth.verifyIdToken(token);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userUid = decodedToken.uid;

  const usernameRef = db.collection("usernames").doc(username.toLowerCase());
  const userRef = db.collection("users").doc(userUid);

  try {
    await db.runTransaction(async (t) => {
      const usernameDoc = await t.get(usernameRef);
      const userDoc = await t.get(userRef);

      if (usernameDoc.exists) throw new Error("Username taken");
      if (userDoc.exists) throw new Error("Username already set");

      t.set(usernameRef, { userUid });
      t.set(userRef, { username: username.toLowerCase(), displayName: username, pfp }, { merge: true });
    });

    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 409 });
  }
}