  export interface RankFormat {
    QB?: number;
    RB?: number;
    WR?: number;
    TE?: number;
    FLEX?: number;
    SFLEX?: number;
    K?: number;
    DEF?: number;
    DST?: number;
    [key: string]: number | undefined;
  }

  export interface author {
    displayName: string;
    pfp: string,
    uid: string,
    username: string
  }
  
  export interface RankObj {
    name: string;
    description?: string;
    positionGroup: string[];
    visibility: "PUBLIC" | "PRIVATE";
    format: RankFormat | null;
    leagueSize?: string;
    leagueType?: string;
    rankType?: string;
    scoring?: string;
    onlyRookies: boolean;
  }
  
  export interface RankingMeta {
    id: string;
    rankingId: string;
    author: author;
    createdAt: string;
    updatedAt: string;
    rankObj: RankObj;
  }