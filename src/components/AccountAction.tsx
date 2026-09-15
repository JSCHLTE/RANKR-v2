"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// A reusable UI gate. Server-backed features must also verify identity on the server.
export default function AccountAction({ children, onClick, disabled = false, className }: { children: ReactNode; onClick: () => void; disabled?: boolean; className?: string }) {
  const { user, loading } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  return <div><button type="button" disabled={loading || disabled} className={className} onClick={() => {
    if (user) { setShowSignIn(false); onClick(); } else setShowSignIn(true);
  }}>{children}</button>{showSignIn && !user && <p role="status" className="mt-2 text-sm text-[var(--text-muted)]"><Link className="text-[var(--accent)] underline" href="/login">Sign in</Link> or <Link className="text-[var(--accent)] underline" href="/signup">create an account</Link> to use this feature.</p>}</div>;
}
