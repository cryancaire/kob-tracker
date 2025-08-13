export interface Player {
  id: string;
  name: string;
  points: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PlayerWithGamePoints extends Player {
  game_points: number;
  total_points: number;
}

export interface NewPlayer {
  name: string;
  points?: number;
}

export interface UpdatePlayer {
  name?: string;
  points?: number;
}

export type GameStatus = 'active' | 'ended';

export interface Game {
  id: string;
  team1_player1_id: string | null;
  team1_player1_points: number;
  team1_player2_id: string | null;
  team1_player2_points: number;
  team2_player1_id: string | null;
  team2_player1_points: number;
  team2_player2_id: string | null;
  team2_player2_points: number;
  status: GameStatus;
  user_id: string;
  created_at: string;
  updated_at: string;
  ended_at: string | null;
  timer_started_at: string | null;
  timer_paused_at: string | null;
  timer_total_paused_time: number;
  switch_sides_interval: number | null;
}

export interface NewGame {
  team1_player1_id?: string | null;
  team1_player1_points?: number;
  team1_player2_id?: string | null;
  team1_player2_points?: number;
  team2_player1_id?: string | null;
  team2_player1_points?: number;
  team2_player2_id?: string | null;
  team2_player2_points?: number;
  status?: GameStatus;
}

export interface UpdateGame {
  team1_player1_id?: string | null;
  team1_player1_points?: number;
  team1_player2_id?: string | null;
  team1_player2_points?: number;
  team2_player1_id?: string | null;
  team2_player1_points?: number;
  team2_player2_id?: string | null;
  team2_player2_points?: number;
  status?: GameStatus;
  ended_at?: string | null;
  timer_started_at?: string | null;
  timer_paused_at?: string | null;
  timer_total_paused_time?: number;
  switch_sides_interval?: number | null;
}

export interface GameWithPlayers {
  id: string;
  team1_player1: Player | null;
  team1_player1_points: number;
  team1_player2: Player | null;
  team1_player2_points: number;
  team2_player1: Player | null;
  team2_player1_points: number;
  team2_player2: Player | null;
  team2_player2_points: number;
  status: GameStatus;
  created_at: string;
  updated_at: string;
  ended_at: string | null;
  timer_started_at: string | null;
  timer_paused_at: string | null;
  timer_total_paused_time: number;
  switch_sides_interval: number | null;
}

export type SectionId = 'actions' | 'players-leaderboard' | 'game-history';

export interface UserPreferences {
  id: string;
  user_id: string;
  section_order: SectionId[];
  collapsed_sections: Record<SectionId, boolean>;
  created_at: string;
  updated_at: string;
}

export interface NewUserPreferences {
  section_order?: SectionId[];
  collapsed_sections?: Record<SectionId, boolean>;
}

export interface UpdateUserPreferences {
  section_order?: SectionId[];
  collapsed_sections?: Record<SectionId, boolean>;
}