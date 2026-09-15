"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { hasActiveRankrPass, type RankrPass } from "@/lib/rankr-pass";

export default function RankrPassBadge({ pass, size = 22 }: { pass?: RankrPass; size?: number }) {
  const [now, setNow] = useState<number | null>(null);
  const expiresAt = pass?.expiresAt;
  useEffect(() => {
    const update = () => setNow(Date.now());
    const initial = window.setTimeout(update, 0);
    // Cap long timeouts to avoid the browser's ~24-day timeout overflow.
    const timer = window.setInterval(update, 30_000);
    const expiry = expiresAt ? window.setTimeout(update, Math.max(0, Math.min(expiresAt - Date.now(), 2_147_483_647))) : undefined;
    window.addEventListener("focus", update);
    return () => { clearTimeout(initial); clearTimeout(expiry); clearInterval(timer); window.removeEventListener("focus", update); };
  }, [expiresAt]);
  if (now === null || !hasActiveRankrPass(pass, now)) return null;
  return <Image src="/lion-green-t.svg" width={size} height={size} alt="RANKR Pass" title="RANKR Pass" style={{ width: size, height: size }} className="inline-block shrink-0 align-middle" />;
}
