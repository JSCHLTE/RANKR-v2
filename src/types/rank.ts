export interface ScoringFormat {
    QB: number;
    WR: number;
    RB: number;
    TE: number;
    FLEX: number;
    SFLEX: number;
    K: number;
    DEF: number;
  };

export interface RankObj {
    name: string,
    onlyRookies: boolean,
    positionGroup: string,
    customPositions: string[],
    scoring: string,
    format: ScoringFormat | null,
    leagueType: string,
    leagueSize: string,
    rankType: string,
    mode: string,
    description: string,
    visibility: string
  }