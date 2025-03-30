export interface IPlayer {
  id: string;
  name: string;
  level: number;
  created_at?: string;
}

export interface IMatch {
  id: string;
  winner_id: string;
  loser_id: string;
  winner_sets?: number;
  loser_sets?: number;
  match_date?: string;
  created_at?: string;
  winner?: IPlayer;
  loser?: IPlayer;
}

export interface IPlayerStats {
  id: string;
  name: string;
  level: number;
  wins: number;
  losses: number;
  winRate: number;
  winStreak?: number;
  maxWinStreak?: number;
} 