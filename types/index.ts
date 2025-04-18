export interface IPlayer {
  id: string;
  name: string;
  level: number;
  created_at?: string;
}

export interface IUser {
  id: string;
  name: string;
  level: number;
  created_at: Date;
}

export interface IMatch {
  id: string;
  match_date: Date;
  winner_id: string;
  loser_id: string;
  winner_sets: number;
  loser_sets: number;
  created_at: Date;
}

export interface IMatchWithPlayers extends IMatch {
  winner: IUser;
  loser: IUser;
}

export interface IRanking {
  user: IUser;
  wins: number;
  losses: number;
  winRate: number;
  totalSets: number;
  rank: number;
}

export interface IPlayerStats {
  player_id: string;
  player: {
    id: string;
    name: string;
    level: number;
  };
  wins: number;
  losses: number;
  win_rate: number;
  sets_won: number;
  sets_lost: number;
  current_streak: number;
  recent_matches: string;
  match_count: number;
  created_at: string;
}

export interface IPoolLeagueStats {
  player_id: string;
  player_name: string;
  player_level: number;
  wins: number;
  losses: number;
  sets_won: number;
  sets_lost: number;
  match_count: number;
  win_rate: number;
  created_at: string;
} 