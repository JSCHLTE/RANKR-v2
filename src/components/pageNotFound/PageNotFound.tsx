import Link from "next/link";

export const PageNotFound = () => {

  return (
<div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center mt-[-80px]">
  <img
    src="/lion-green-t.svg"
    alt="Logo"
    className="w-50 h-50"
  />

  <p className="text-lg text-[var(--text-muted)]">
    The page you&apos;re searching for is not available.
  </p>

  <Link
    href="/"
    className="rounded-md bg-[var(--accent)] px-4 py-2 font-medium text-[var(--background)] transition hover:bg-[var(--accent)]/75"
  >
    Return Home
  </Link>
</div>
  );
};