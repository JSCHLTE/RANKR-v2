"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

const links = [
  { label: "Home", href: "/" },
  { label: "Create", href: "/create" },
  { label: "Rankings", href: "/rankings" },
];

export default function Navbar() {
  const { user, profile } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="w-full px-6 py-3 border-b border-white/10">
    <div className="flex items-center justify-between max-w-200 mx-auto">
      {/* Logo */}
      <Link href="/">
        <img
          src="lion-green-t.svg"
          className="w-15 h-15"
          draggable="false"
          alt="RANKR"
        />
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-6">

        {/* Links */}
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-md transition-colors ${
              pathname === link.href
                ? "text-white font-medium"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {link.label}
          </Link>
        ))}

        {/* PFP or auth buttons */}
        {user && profile ? (
          <Link href={`/user/${profile.username}`}>
            <img
              src={profile.pfp}
              alt={`${profile.displayName} profile picture`}
              className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
              draggable="false"
            />
          </Link>
        ) : !user ? (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/40 hover:text-white/70 transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="text-sm px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--background)] font-medium hover:opacity-90 transition-opacity">
              Sign up
            </Link>
          </div>
        ) : null}

      </div>
      </div>
    </nav>
  );
}