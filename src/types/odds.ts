import type { Sportsbook } from "@/lib/odds/sportsbooks";

export type BookMap<T> = Partial<Record<Sportsbook, T | null>>;
export interface TotalMarket { line?: number | null; overOdds?: number | null; underOdds?: number | null }
export interface SpreadMarket { awayLine?: number | null; homeLine?: number | null; awayOdds?: number | null; homeOdds?: number | null }
export interface MoneylineMarket { awayOdds?: number | null; homeOdds?: number | null }
export interface GameMarkets { spread?: SpreadMarket | null; total?: TotalMarket | null; moneyline?: MoneylineMarket | null }
export interface OddsTeam { teamId: string; name: string; abbr: string }
export interface GameSummary { eventId: string; slug: string; away: OddsTeam; home: OddsTeam; startTime: string; sportsbooks: BookMap<GameMarkets> }
export interface WeekOdds { season: number; week: number; updatedAt: string; isMock: boolean; games: GameSummary[] }
export interface PlayerProp { playerId: string; playerName: string; team: string; category: string; market: string; displayName: string; sportsbooks: BookMap<TotalMarket> }
export interface GameOdds extends Omit<GameSummary, "sportsbooks"> { season: number; week: number; updatedAt: string; isMock: boolean; gameOdds: BookMap<GameMarkets>; playerProps: PlayerProp[] }
export interface OddsPreferences { mode: "consensus" | "sportsbook"; sportsbook: Sportsbook; includedBooks: Sportsbook[] }
