"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { UserMenu } from "./UserMenu";
import { useTheme } from "@/context/ThemeProvider";
import ProfilePicture from "../profile/ProfilePicture";
import { isAdmin } from "@/lib/admin-access";
import { logOut } from "@/lib/auth";

const links = [
  { label: "Home", href: "/" },
  { label: "Create", href: "/create" },
  { label: "Rankings", href: "/rankings" },
];

export default function Navbar() {
  const { user, profile, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [userMenu, setUserMenu] = useState(false);
  const dropDownRef = useRef<HTMLDivElement>(null);
  const accountButton = useRef<HTMLButtonElement>(null);
  const mobileButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  const navigation = isAdmin(user?.uid) ? [...links, { label: "Admin", href: "/admin" }] : links;

  const closeMobile = () => drawer.current?.close();
  const openMobile = () => {
    setUserMenu(false);
    drawer.current?.showModal();
    document.documentElement.dataset.mobileMenu = "open";
  };

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!dropDownRef.current?.contains(event.target as Node)) setUserMenu(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && userMenu) {
        setUserMenu(false);
        accountButton.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [userMenu]);

  useEffect(() => {
    drawer.current?.close();
    delete document.documentElement.dataset.mobileMenu;
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const resize = () => { if (media.matches) drawer.current?.close(); };
    media.addEventListener("change", resize);
    return () => {
      media.removeEventListener("change", resize);
      delete document.documentElement.dataset.mobileMenu;
    };
  }, []);

  if (pathname === "/set-username") return null;

  return <>
    <nav aria-label="Main navigation" className="sticky top-0 z-50 w-full border-b border-[var(--border)] px-5 py-4 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[var(--background)]/80 backdrop-blur-md" />
      <div className="mx-auto flex max-w-200 items-center justify-between">
        <Link href="/" aria-label="RANKR home"><img src="/lion-green-long.svg" className="w-32 transition-opacity hover:opacity-80 sm:w-35" draggable="false" alt="RANKR" /></Link>
        <div className="hidden items-center gap-6 md:flex">
          {navigation.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} onClick={() => setUserMenu(false)} className={`text-sm transition-colors ${pathname === link.href ? "font-medium text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--foreground)]"}`}>{link.label}</Link>)}
          {loading ? <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--surface-hover)]" /> : user && profile ?
            <div className="relative" ref={dropDownRef}>
              <button ref={accountButton} type="button" aria-label="Account options" aria-expanded={userMenu} aria-controls="account-options" onClick={() => setUserMenu(value => !value)} className="block cursor-pointer rounded-full ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)] focus-visible:outline-none focus-visible:ring-2">
                <ProfilePicture src={profile.pfp} alt={`${profile.displayName} profile picture`} className="h-10 w-10 transition-opacity hover:opacity-80" />
              </button>
              {userMenu && <UserMenu profile={profile} setUserMenu={setUserMenu} theme={theme} toggleTheme={toggleTheme} />}
            </div> : <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]">Log in</Link>
              <Link href="/signup" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#0E1116] hover:opacity-90">Sign up</Link>
            </div>}
        </div>
        <button ref={mobileButton} type="button" onClick={openMobile} aria-label="Open navigation menu" aria-haspopup="dialog" aria-controls="mobile-navigation" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-colors hover:bg-[var(--surface-hover)] md:hidden">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 7h16M8 12h12M4 17h16" /></svg>
        </button>
      </div>
    </nav>
    <dialog ref={drawer} id="mobile-navigation" aria-labelledby="mobile-navigation-title" className="mobile-drawer" onClick={event => { if (event.target === event.currentTarget && event.clientX < event.currentTarget.getBoundingClientRect().left) closeMobile(); }} onClose={() => { delete document.documentElement.dataset.mobileMenu; mobileButton.current?.focus(); }}>
      <div className="flex min-h-full flex-col p-6">
        <div className="mb-10 flex items-center justify-between">
          <span id="mobile-navigation-title"><img src="/lion-green-long.svg" alt="RANKR" className="w-24" draggable="false" /></span>
          <button autoFocus type="button" onClick={closeMobile} aria-label="Close navigation menu" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] hover:bg-[var(--surface-hover)]"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
        </div>
        <nav aria-label="Mobile navigation" className="flex flex-col gap-2">
          {[...links, { label: "Likes", href: "/likes" }, ...(isAdmin(user?.uid) ? [{ label: "Admin", href: "/admin" }] : [])].map(link => <Link key={link.href} href={link.href} onClick={closeMobile} aria-current={pathname === link.href ? "page" : undefined} className={`group flex items-center gap-4 rounded-2xl px-4 py-4 transition-colors ${pathname === link.href ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "hover:bg-[var(--surface-hover)]"}`}><span className="text-xl font-medium tracking-tight">{link.label}</span></Link>)}
        </nav>
        <div className="mt-auto pt-10">
          <div className="border-t border-[var(--border)] pt-5">
            {loading ? <div className="h-12 animate-pulse rounded-xl bg-[var(--surface-hover)]" /> : user && profile ? <>
              <Link href={`/user/${profile.username}`} onClick={closeMobile} className="mb-4 flex items-center gap-3 rounded-xl p-2 hover:bg-[var(--surface-hover)]"><ProfilePicture src={profile.pfp} alt="" className="h-10 w-10" /><div className="min-w-0"><p className="truncate text-sm font-medium">{profile.displayName}</p><p className="truncate text-xs text-[var(--text-muted)]">@{profile.username}</p></div></Link>
              <button type="button" onClick={async () => { await logOut(); closeMobile(); }} className="mb-2 w-full cursor-pointer rounded-xl px-3 py-3 text-left text-sm text-[var(--danger)] hover:bg-[var(--danger)]/5">Log out</button>
            </> : <div className="mb-4 grid grid-cols-2 gap-3"><Link href="/login" onClick={closeMobile} className="rounded-xl border border-[var(--border)] px-3 py-3 text-center text-sm font-medium">Log in</Link><Link href="/signup" onClick={closeMobile} className="rounded-xl bg-[var(--accent)] px-3 py-3 text-center text-sm font-medium text-[#0E1116]">Sign up</Link></div>}
            <button type="button" onClick={toggleTheme} className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"><span>Appearance</span><span className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--foreground)]">{theme === "dark" ? "Dark" : "Light"}<span aria-hidden="true" className="ml-2">◐</span></span></button>
          </div>
        </div>
      </div>
    </dialog>
  </>;
}


