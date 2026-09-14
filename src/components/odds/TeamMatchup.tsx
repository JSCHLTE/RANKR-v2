"use client";

import Image from "next/image";
import { useState } from "react";
import type { OddsTeam } from "@/types/odds";

function TeamLogo({ team }: { team: OddsTeam }) {
  const [failed, setFailed] = useState(false);
  return <span className="flex h-14 w-14 shrink-0 items-center justify-center" title={team.name}>
    {failed ? <span className="text-lg font-semibold">{team.abbr}</span> : <Image
      unoptimized
      src={`https://sleepercdn.com/images/team_logos/nfl/${team.abbr.toLowerCase()}.png`}
      alt={team.name}
      width={56}
      height={56}
      className="h-14 w-14 object-contain"
      onError={() => setFailed(true)}
    />}
  </span>;
}

export function TeamMatchup({ away, home }: { away: OddsTeam; home: OddsTeam }) {
  return <span className="flex items-center gap-3" aria-label={`${away.name} at ${home.name}`}>
    <TeamLogo key={away.abbr} team={away} />
    <span aria-hidden="true" className="text-xl text-[var(--text-muted)]">@</span>
    <TeamLogo key={home.abbr} team={home} />
  </span>;
}
