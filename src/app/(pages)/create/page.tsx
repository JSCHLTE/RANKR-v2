"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CustomFormatSection from "./_components/CustomFormatSection";
import { RankingCard } from "@/app/(pages)/rankings/_components/RankingCard";
import { useAuth } from "@/context/AuthContext";
import { RankObj, RankingMeta } from "@/types/rank";

const scoringOptions = [
  { value: "PPR", label: "PPR", description: "1 point per reception" },
  { value: "HALF_PPR", label: "Half PPR", description: "0.5 points per reception" },
  { value: "NO_PPR", label: "No PPR", description: "Receptions don't score points" },
];
const leagueSizes = ["4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24", "32"];
const choiceClass = (selected: boolean) =>
  `rounded-xl border transition-colors ${selected
    ? "border-[var(--accent)] bg-[var(--accent)]/10"
    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]"}`;

function SectionHeading({ number, title, description }: { number: number; title: string; description: string }) {
  return <div className="mb-5 flex items-start gap-3">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[#0e1716]">{number}</span>
    <div>
      <h2 className="text-base font-semibold leading-6 text-[var(--foreground)]">{title}</h2>
      <p className="text-sm text-[var(--text-muted)]">{description}</p>
    </div>
  </div>;
}

export default function CreateRankingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const submitting = useRef(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<{ uid: string; count: number; limit: number }>();
  const currentUsage = usage?.uid === user?.uid ? usage : undefined;
  const atLimit = !!currentUsage && currentUsage.count >= currentUsage.limit;

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    async function loadUsage() {
      try {
        const token = await user!.getIdToken();
        if (controller.signal.aborted) return;
        const response = await fetch("/api/create-ranking", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (!controller.signal.aborted) setUsage({ uid: user!.uid, count: data.count, limit: data.limit });
      } catch { /* Creation enforces the limit if usage cannot load. */ }
    }
    void loadUsage();
    window.addEventListener("focus", loadUsage);
    return () => { controller.abort(); window.removeEventListener("focus", loadUsage); };
  }, [user]);

  const [rankObj, setRankObj] = useState<RankObj>({
    name: "",
    description: "",
    scoring: "",
    format: null,
    leagueSize: "",
    visibility: "PUBLIC",
  });

  const updateField = <K extends keyof RankObj>(key: K, value: RankObj[K]) => {
    setRankObj((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    if (submitting.current) return;
    if (!user) {
      setError("You must be signed in to create a ranking.");
      return;
    }
    submitting.current = true;
    setIsCreating(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/create-ranking", {
        method: "POST",
        body: JSON.stringify({ rankObj }),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) {
        if (result.code === "RANKING_LIMIT_REACHED") setUsage({ uid: user.uid, count: result.count, limit: result.limit });
        throw new Error(result.error || "Unable to create ranking.");
      }
      if (typeof result.rankingId !== "string" || !result.rankingId) throw new Error("The server did not return a ranking ID.");
      router.push(`/rankings/${encodeURIComponent(result.rankingId)}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to create ranking. Please try again.");
      submitting.current = false;
      setIsCreating(false);
    }
  };

  const canSubmit = rankObj.name.trim() !== "";
  const previewRanking: RankingMeta = {
    id: "preview",
    rankingId: "preview",
    rankObj: { ...rankObj, name: rankObj.name.trim() || "Your Ranking Name" },
    author: {
      uid: user?.uid ?? "",
      username: profile?.username || "username",
      displayName: profile?.displayName || "Your Name",
      pfp: profile?.pfp || "",
      rankrPass: profile?.rankrPass,
    },
    likeCount: 0,
    createdAt: "now",
    updatedAt: "—",
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">Create a <span className="text-[var(--accent)]">Ranking</span></h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
            Set your ranking preferences below so others can see the context on your ranking&apos;s card.
          </p>
        </div>
        {currentUsage && <div className="w-full shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm md:w-64">
          <p className="font-semibold text-[var(--foreground)]">{currentUsage.count} of {currentUsage.limit} used</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--border)]">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, currentUsage.count / currentUsage.limit * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">Public and private rankings count toward your limit.</p>
          {atLimit && <p className="mt-2 text-xs">{currentUsage.limit === 2 ? <>You&apos;ve reached your free limit. <Link href="/subscribe" className="text-[var(--accent)] underline">Get RANKR Pass for up to 20 rankings</Link>.</> : "You've reached your RANKR Pass limit. Delete a ranking to create another."}</p>}
        </div>}
      </header>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <SectionHeading number={1} title="Ranking Details" description="Give your ranking a name and optional description." />
            <div className="space-y-4">
              <div>
                <label htmlFor="ranking-name" className="mb-2 block text-sm font-semibold">Ranking Name <span className="text-[var(--accent)]">*</span></label>
                <input id="ranking-name" type="text" placeholder="e.g. My Week 10 PPR Rankings" value={rankObj.name} maxLength={200}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]" />
              </div>
              <div>
                <label htmlFor="ranking-description" className="mb-2 block text-sm font-semibold">Description <span className="font-normal text-[var(--text-muted)]">(optional)</span></label>
                <textarea id="ranking-description" placeholder="e.g. Post-week 10 update targeting handcuffs..." value={rankObj.description} maxLength={5000} rows={3}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <SectionHeading number={2} title="League Settings" description="Choose how this ranking should be scored and what format it's for." />
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-semibold">Scoring <span className="font-normal text-[var(--text-muted)]">(optional)</span></p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {scoringOptions.map((option) => <button key={option.value} type="button" aria-pressed={rankObj.scoring === option.value}
                    onClick={() => updateField("scoring", rankObj.scoring === option.value ? "" : option.value)}
                    className={`${choiceClass(rankObj.scoring === option.value)} min-h-20 cursor-pointer p-3 text-left`}>
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="mt-1 block text-xs text-[var(--text-muted)]">{option.description}</span>
                  </button>)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Format <span className="font-normal text-[var(--text-muted)]">(optional)</span></p>
                <CustomFormatSection format={rankObj.format} updateField={updateField} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <SectionHeading number={3} title="League Size" description="Select the number of teams in your league, if applicable." />
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-12">
              {leagueSizes.map((size) => <button key={size} type="button" aria-pressed={rankObj.leagueSize === size}
                onClick={() => updateField("leagueSize", rankObj.leagueSize === size ? "" : size)}
                className={`${choiceClass(rankObj.leagueSize === size)} flex min-h-11 cursor-pointer items-center justify-center text-sm font-semibold`}>{size}</button>)}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <SectionHeading number={4} title="Visibility" description="Choose who can see your ranking." />
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                { value: "PUBLIC", label: "Public", description: "Anyone can discover and view this ranking" },
                { value: "PRIVATE", label: "Private", description: "Only visible to you" },
              ] as const).map((option) => <button key={option.value} type="button" aria-pressed={rankObj.visibility === option.value}
                onClick={() => updateField("visibility", option.value)}
                className={`${choiceClass(rankObj.visibility === option.value)} min-h-20 cursor-pointer p-4 text-left`}>
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className="mt-1 block text-xs text-[var(--text-muted)]">{option.description}</span>
              </button>)}
            </div>
          </section>

          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <button type="button" disabled={!canSubmit || isCreating || atLimit} onClick={handleCreate}
            className={`w-full rounded-xl py-3.5 text-base font-bold transition-opacity ${canSubmit && !isCreating && !atLimit
              ? "cursor-pointer bg-[var(--accent)] text-[#0e1716] hover:opacity-90"
              : "cursor-not-allowed bg-[var(--border)] text-[var(--text-muted)] opacity-50"}`}>
            {isCreating ? "Creating..." : "Create Ranking"}
          </button>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Preview</h2>
              <p className="text-sm text-[var(--text-muted)]">This is how your ranking card will appear.</p>
            </div>
            <RankingCard ranking={previewRanking} preview />
          </div>
          <div className="mt-4 rounded-2xl border border-violet-500/25 bg-violet-500/10 p-5 text-sm">
            <p className="font-semibold text-violet-400">Tip</p>
            <p className="mt-1 text-[var(--text-muted)]">Clear names and descriptions help others understand your ranking.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
