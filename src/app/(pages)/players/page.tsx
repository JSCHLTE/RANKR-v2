"use client";

import { useEffect, useState } from "react";
import { RookieSvg } from "@/components/rookieIcon/RookieSvg";
import { usePlayers } from "@/hooks/usePlayers";


const positionColors: Record<string, string> = {
  QB: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  RB: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  WR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  TE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  K:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  DEF:"bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const Players = () => {
  const { players, loading, error } = usePlayers();

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
      {players.map((player, index) => {
        const pos = player?.fantasy_positions?.[0];
        const posClass = positionColors[pos] ?? "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300";

        return (
          <div
            key={index}
            className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            {/* Player image */}
            <div className="relative shrink-0">
              <img
                src={`https://sleepercdn.com/content/nfl/players/${player.id}.jpg`}
                alt={`${player.fullName}`}
                className="w-17 h-17 rounded-full object-cover object-top bg-gray-200 dark:bg-white/10 ring-2 ring-white dark:ring-gray-900"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://sleepercdn.com/images/v2/icons/player_default.webp";
                }}
              />
            </div>

            {/* Player info */}
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex">
                <span className="flex font-semibold text-gray-900 dark:text-white text-md leading-tight truncate">
                  {player.fullName}
                  {player.yearsExp == 0 ? <img src="rookie.png" alt="Rookie icon" width={20} height={20} className="ml-2" /> : ""}
                </span>
                {/* <RookieSvg color="#ffffff" width="20" height="20" /> */}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {pos && (
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded-[5px] ${posClass}`}>
                    {pos}
                  </span>
                )}
                {player.team ? (
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-[5px] text-gray-600 dark:text-gray-300`} style={{ backgroundColor: `var(--${player.team.toLowerCase()})` }}>
                    {player.team}
                  </span>
                ) :                   <span className="text-sm font-medium px-2 py-0.5 rounded-[5px] bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
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