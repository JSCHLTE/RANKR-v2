export const SPORTSBOOKS = {
  draftkings: { name: "DraftKings", shortName: "DK", logo: "/draftkings.png" },
  fanduel: { name: "FanDuel", shortName: "FD", logo: "/fanduel.png" },
  betmgm: { name: "BetMGM", shortName: "MGM", logo: "/betmgm.png" },
  caesars: { name: "Caesars", shortName: "CZR", logo: "/caesars.png" },
  espnbet: { name: "ESPN BET", shortName: "ESPN", logo: "/espn.png" },
  bet365: { name: "bet365", shortName: "365", logo: "/bet365.png" },
} as const;
export type Sportsbook = keyof typeof SPORTSBOOKS;
export const SPORTSBOOK_IDS = Object.keys(SPORTSBOOKS) as Sportsbook[];
export const PROP_CATEGORIES = { passing: "Passing", rushing: "Rushing", receiving: "Receiving", touchdowns: "Touchdowns" } as const;
