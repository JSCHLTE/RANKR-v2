"use client";

import { useEffect, useState } from "react";
import { usePlayersData } from "../../../hooks/usePlayersData";

const positionColors: Record<string, string> = {
  QB: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  RB: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  WR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  TE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  K:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  DEF:"bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const Players = () => {
  const { players, loading } = usePlayersData();
  const [allPlayers, setAllPlayers] = useState(players);

  useEffect(() => {
    setAllPlayers(players);
  }, [players]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse">
            <div className="w-14 h-14 rounded-full bg-gray-300 dark:bg-white/10 shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-4 w-36 rounded bg-gray-300 dark:bg-white/10" />
              <div className="flex gap-2">
                <div className="h-5 w-10 rounded-full bg-gray-200 dark:bg-white/10" />
                <div className="h-5 w-14 rounded-full bg-gray-200 dark:bg-white/10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/5">
      {allPlayers.map((player, index) => {
        const pos = player.fantasy_positions?.[0];
        const posClass = positionColors[pos] ?? "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300";

        return (
          <div
            key={index}
            className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            {/* Player image */}
            <div className="relative shrink-0">
              <img
                src={`https://sleepercdn.com/content/nfl/players/${player.player_id}.jpg`}
                alt={`${player.first_name} ${player.last_name}`}
                className="w-12 h-12 rounded-full object-cover object-top bg-gray-200 dark:bg-white/10 ring-2 ring-white dark:ring-gray-900"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://sleepercdn.com/images/v2/icons/player_default.webp";
                }}
              />
            </div>

            {/* Player info */}
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
                {player.first_name} {player.last_name}
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                {pos && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${posClass}`}>
                    {pos}
                  </span>
                )}
                {player.team ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                    {player.team}
                  </span>
                ) :                   <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                FA
              </span> }
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Players;