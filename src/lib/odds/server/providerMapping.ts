import type { Sportsbook } from "../sportsbooks";

// Verified: https://sportsgameodds.com/docs/data-types/bookmakers (2026-09-14).
export const PROVIDER_BOOKS = {
  draftkings: "draftkings", fanduel: "fanduel", betmgm: "betmgm",
  caesars: "caesars", espnbet: "espnbet",
} as const satisfies Record<string, Sportsbook>;

// Full-game O/U markets only. https://sportsgameodds.com/docs/data-types/stats
export const PROP_MARKETS = {
  passing_yards: { category: "passing", market: "passing_yards", displayName: "Passing Yards" },
  passing_attempts: { category: "passing", market: "passing_attempts", displayName: "Passing Attempts" },
  passing_completions: { category: "passing", market: "passing_completions", displayName: "Passing Completions" },
  passing_interceptions: { category: "passing", market: "passing_interceptions", displayName: "Interceptions Thrown" },
  rushing_yards: { category: "rushing", market: "rushing_yards", displayName: "Rushing Yards" },
  rushing_attempts: { category: "rushing", market: "rushing_attempts", displayName: "Rushing Attempts" },
  receiving_yards: { category: "receiving", market: "receiving_yards", displayName: "Receiving Yards" },
  receiving_receptions: { category: "receiving", market: "receptions", displayName: "Receptions" },
  passing_touchdowns: { category: "touchdowns", market: "passing_touchdowns", displayName: "Passing Touchdowns" },
  rushing_touchdowns: { category: "touchdowns", market: "rushing_touchdowns", displayName: "Rushing Touchdowns" },
  receiving_touchdowns: { category: "touchdowns", market: "receiving_touchdowns", displayName: "Receiving Touchdowns" },
  touchdowns: { category: "touchdowns", market: "touchdowns", displayName: "Total Touchdowns" },
} as const;

export const YES_NO_PROP_MARKETS = {
  touchdowns: { category: "touchdowns", market: "anytime_touchdown", displayName: "Anytime TD", betType: "yn" },
  firstTouchdown: { category: "touchdowns", market: "first_touchdown", displayName: "First TD", betType: "yn" },
} as const;

export const REQUESTED_ODDS = [
  "points-home-game-ml-home", "points-away-game-ml-away",
  "points-home-game-sp-home", "points-away-game-sp-away",
  "points-all-game-ou-over", "points-all-game-ou-under",
  ...Object.keys(PROP_MARKETS).flatMap(stat => ["over", "under"].map(side => `${stat}-PLAYER_ID-game-ou-${side}`)),
  ...Object.keys(YES_NO_PROP_MARKETS).flatMap(stat => ["yes", "no"].map(side => `${stat}-PLAYER_ID-game-yn-${side}`)),
];
