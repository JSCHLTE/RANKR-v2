export interface Player {
  id: string,
  age: number,
  college: string,
  fantasy_positions: string[];
  full_name: string,
  height: string,
  number: number,
  player_id: string,
  position: string,
  search_full_name: string,
  team: string,
  weight: string,
  years_exp: number
};

export interface PlayerLite {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  team: string;
  position: string;
  fantasyPositions: string[];
  yearsExp: number
}

export interface ResolvedPlayer {
  rank: number;
  player: PlayerLite;
}