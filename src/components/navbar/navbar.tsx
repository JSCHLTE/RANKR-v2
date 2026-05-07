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
  { label: "Players", href: "/players" }
];

export default function Navbar() {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const [userMenu, setUserMenu] = useState(false);
  const dropDownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setUserMenu(false);
  }, [user]);

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
    <nav className="w-full px-6 py-4 border-b border-[var(--white)]/10">
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
                ? "text-[var(--accent)] font-medium cursor-default"
                : "text-[var(--white)]/50 hover:text-[var(--white)]/80"
            }`}
          >
            {link.label}
          </Link>
        ))}

        {/* PFP or auth buttons */}

        {loading ? (
  <div className="w-10 h-10 rounded-full bg-[var(--white)]/20 animate-pulse" />
) : user && profile ? (
  <div className="relative" ref={dropDownRef}>
    <img
      src={profile.pfp}
      alt={`${profile.displayName} profile picture`}
      className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
      draggable="false"
      onClick={() => setUserMenu(prev => !prev)}
    />
    {userMenu && <UserMenu profile={profile} setUserMenu={setUserMenu} />}
  </div>
) : (
  <div className="flex items-center gap-3">
    <Link href="/login" className={`text-md transition-colors ${
              pathname === "/login"
                ? "text-[var(--accent)] font-medium cursor-default"
                : "text-[var(--white)]/50 hover:text-[var(--white)]/80"
            }`}>
      Log in
    </Link>
    <Link href="/signup" className="text-md px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--background)] font-medium hover:opacity-90 transition-opacity">
      Sign up
    </Link>
  </div>
)}
      </div>
      </div>
    </nav>
  );
}