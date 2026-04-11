"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { UserMenu } from "./UserMenu";

const links = [
  { label: "Home", href: "/" },
  { label: "Create", href: "/create" },
  { label: "Rankings", href: "/rankings" },
];

export default function Navbar() {
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const [userMenu, setUserMenu] = useState(false);
  const dropDownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if(!dropDownRef.current) return;

        if(!dropDownRef.current.contains(e.target as Node)) {
            setUserMenu(false);
        }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };

}, [setUserMenu])

  return (
    <nav className="w-full px-6 py-4 border-b border-white/10">
    <div className="flex items-center justify-between max-w-200 mx-auto">
      {/* Logo */}
      <Link href="/">
        <img
          src="lion-green-long.svg"
          className="w-35 hover:opacity-80"
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
                ? "text-white font-medium cursor-default"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {link.label}
          </Link>
        ))}

        {/* PFP or auth buttons */}
        {user && profile ? (
          <div className="relative" ref={dropDownRef}>
            <img
              src={profile.pfp}
              alt={`${profile.displayName} profile picture`}
              className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
              draggable="false"
              onClick={() => setUserMenu(prev => !prev)}
            />
            {userMenu && <UserMenu profile={profile} /> }
          </div>
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