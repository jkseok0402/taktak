export interface IPlayer {
  id: string;
  name: string;
  level: number;
  created_at?: string;
}

export interface IMatch {
  id: string;
  match_date: string;
  winner_id: string;
  loser_id: string;
  winner_sets: number;
  loser_sets: number;
  winner: string | { id: string; name: string; level: number };
  loser: string | { id: string; name: string; level: number };
  created_at: string;
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