import { supabase } from './supabase';
import type { Player, NewPlayer, UpdatePlayer, Game, NewGame, UpdateGame, GameWithPlayers, PlayerWithGamePoints } from '../types/database';

export async function getAllPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('points', { ascending: false });

  if (error) {
    console.error('Error fetching players:', error);
    throw error;
  }

  return data || [];
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching player:', error);
    throw error;
  }

  return data;
}

export async function createPlayer(player: NewPlayer): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert([player])
    .select()
    .single();

  if (error) {
    console.error('Error creating player:', error);
    throw error;
  }

  return data;
}

export async function updatePlayer(id: string, updates: UpdatePlayer): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating player:', error);
    throw error;
  }

  return data;
}

export async function deletePlayer(id: string): Promise<void> {
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
}

export async function deleteAllPlayers(): Promise<void> {
  const { error } = await supabase
    .from('players')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

  if (error) {
    console.error('Error deleting all players:', error);
    throw error;
  }
}

export async function addPointsToPlayer(id: string, pointsToAdd: number): Promise<Player> {
  const player = await getPlayerById(id);
  if (!player) {
    throw new Error('Player not found');
  }

  return updatePlayer(id, { points: player.points + pointsToAdd });
}

// Game functions
export async function getAllGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching games:', error);
    throw error;
  }

  return data || [];
}

export async function getAllGamesWithPlayers(): Promise<GameWithPlayers[]> {
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      team1_player1:players!games_team1_player1_id_fkey(id, name, points),
      team1_player2:players!games_team1_player2_id_fkey(id, name, points),
      team2_player1:players!games_team2_player1_id_fkey(id, name, points),
      team2_player2:players!games_team2_player2_id_fkey(id, name, points)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching games with players:', error);
    throw error;
  }

  return (data || []).map((game: any) => ({
    id: game.id,
    team1_player1: game.team1_player1,
    team1_player1_points: game.team1_player1_points,
    team1_player2: game.team1_player2,
    team1_player2_points: game.team1_player2_points,
    team2_player1: game.team2_player1,
    team2_player1_points: game.team2_player1_points,
    team2_player2: game.team2_player2,
    team2_player2_points: game.team2_player2_points,
    status: game.status,
    created_at: game.created_at,
    updated_at: game.updated_at,
    ended_at: game.ended_at,
  }));
}

export async function getGameWithPlayersById(id: string): Promise<GameWithPlayers | null> {
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      team1_player1:players!games_team1_player1_id_fkey(id, name, points),
      team1_player2:players!games_team1_player2_id_fkey(id, name, points),
      team2_player1:players!games_team2_player1_id_fkey(id, name, points),
      team2_player2:players!games_team2_player2_id_fkey(id, name, points)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching game with players:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    team1_player1: data.team1_player1,
    team1_player1_points: data.team1_player1_points,
    team1_player2: data.team1_player2,
    team1_player2_points: data.team1_player2_points,
    team2_player1: data.team2_player1,
    team2_player1_points: data.team2_player1_points,
    team2_player2: data.team2_player2,
    team2_player2_points: data.team2_player2_points,
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
    ended_at: data.ended_at,
  };
}

export async function getGameById(id: string): Promise<Game | null> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching game:', error);
    throw error;
  }

  return data;
}

export async function createGame(game: NewGame): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .insert([game])
    .select()
    .single();

  if (error) {
    console.error('Error creating game:', error);
    throw error;
  }

  return data;
}

export async function updateGame(id: string, updates: UpdateGame): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating game:', error);
    throw error;
  }

  return data;
}

export async function deleteGame(id: string): Promise<void> {
  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting game:', error);
    throw error;
  }
}

export async function deleteAllGames(): Promise<void> {
  const { error } = await supabase
    .from('games')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

  if (error) {
    console.error('Error deleting all games:', error);
    throw error;
  }
}

export async function deleteEmptyGames(): Promise<void> {
  const { error } = await supabase
    .from('games')
    .delete()
    .is('team1_player1_id', null)
    .is('team1_player2_id', null)
    .is('team2_player1_id', null)
    .is('team2_player2_id', null);

  if (error) {
    console.error('Error deleting empty games:', error);
    throw error;
  }
}

export async function isGameEmpty(gameId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('games')
    .select('team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id')
    .eq('id', gameId)
    .single();

  if (error) {
    console.error('Error checking if game is empty:', error);
    return false;
  }

  return !data.team1_player1_id && !data.team1_player2_id && 
         !data.team2_player1_id && !data.team2_player2_id;
}

export async function deleteGameIfEmpty(gameId: string): Promise<void> {
  const isEmpty = await isGameEmpty(gameId);
  if (isEmpty) {
    await deleteGame(gameId);
  }
}

export async function createNewActiveGame(): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .insert([{ status: 'active' }])
    .select()
    .single();

  if (error) {
    console.error('Error creating new active game:', error);
    throw error;
  }

  return data;
}

export async function endGame(id: string): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .update({ 
      status: 'ended', 
      ended_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error ending game:', error);
    throw error;
  }

  return data;
}

export async function updatePlayerInGame(gameId: string, playerSlot: 'team1_player1' | 'team1_player2' | 'team2_player1' | 'team2_player2', playerId: string | null): Promise<Game> {
  const update = {
    [`${playerSlot}_id`]: playerId
  };

  const { data, error } = await supabase
    .from('games')
    .update(update)
    .eq('id', gameId)
    .select()
    .single();

  if (error) {
    console.error('Error updating player in game:', error);
    throw error;
  }

  return data;
}

export async function updatePlayerPointsInGame(gameId: string, playerSlot: 'team1_player1' | 'team1_player2' | 'team2_player1' | 'team2_player2', points: number): Promise<Game> {
  const update = {
    [`${playerSlot}_points`]: points
  };

  const { data, error } = await supabase
    .from('games')
    .update(update)
    .eq('id', gameId)
    .select()
    .single();

  if (error) {
    console.error('Error updating player points in game:', error);
    throw error;
  }

  return data;
}

export async function calculatePlayerGamePoints(playerId: string): Promise<number> {
  const { data, error } = await supabase
    .from('games')
    .select('team1_player1_id, team1_player1_points, team1_player2_id, team1_player2_points, team2_player1_id, team2_player1_points, team2_player2_id, team2_player2_points')
    .eq('status', 'ended');

  if (error) {
    console.error('Error fetching ended games:', error);
    throw error;
  }

  let totalPoints = 0;
  
  for (const game of data || []) {
    if (game.team1_player1_id === playerId) {
      totalPoints += game.team1_player1_points;
    }
    if (game.team1_player2_id === playerId) {
      totalPoints += game.team1_player2_points;
    }
    if (game.team2_player1_id === playerId) {
      totalPoints += game.team2_player1_points;
    }
    if (game.team2_player2_id === playerId) {
      totalPoints += game.team2_player2_points;
    }
  }

  return totalPoints;
}

export async function getAllPlayersWithGamePoints(): Promise<PlayerWithGamePoints[]> {
  const players = await getAllPlayers();
  
  const playersWithGamePoints = await Promise.all(
    players.map(async (player) => {
      const gamePoints = await calculatePlayerGamePoints(player.id);
      return {
        ...player,
        game_points: gamePoints,
        total_points: player.points + gamePoints,
      };
    })
  );

  // Sort by game points descending
  return playersWithGamePoints.sort((a, b) => b.game_points - a.game_points);
}