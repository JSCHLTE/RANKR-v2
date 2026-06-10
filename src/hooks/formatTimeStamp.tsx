import { Timestamp } from "firebase-admin/firestore";

export default function formatTimestamp(ts: Timestamp | undefined): string {
    if (!ts) return "—";
    return ts.toDate().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }