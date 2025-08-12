import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllPlayersWithGamePoints,
  createPlayer,
  deletePlayer,
  deleteAllPlayers,
  getAllGamesWithPlayers,
  createNewActiveGame,
  deleteGame,
  deleteAllGames,
  deleteEmptyGames,
  endGame,
} from "../lib/database";
import type { PlayerWithGamePoints, GameWithPlayers } from "../types/database";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";

export function Home() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PlayerWithGamePoints[]>([]);
  const [games, setGames] = useState<GameWithPlayers[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Clean up empty games first
      await deleteEmptyGames();

      const [playersData, gamesData] = await Promise.all([
        getAllPlayersWithGamePoints(),
        getAllGamesWithPlayers(),
      ]);
      setPlayers(playersData);
      setGames(gamesData); // Show all games
      setError(null);
    } catch (err) {
      setError("Failed to load data. Please check your Supabase connection.");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    try {
      const newPlayer = await createPlayer({ name: newPlayerName.trim() });
      const newPlayerWithGamePoints: PlayerWithGamePoints = {
        ...newPlayer,
        game_points: 0,
        total_points: newPlayer.points,
      };
      setPlayers((prev) =>
        [...prev, newPlayerWithGamePoints].sort(
          (a, b) => b.game_points - a.game_points
        )
      );
      setNewPlayerName("");
    } catch (err) {
      setError("Failed to add player");
      console.error("Error adding player:", err);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    try {
      await deletePlayer(playerId);
      // Remove player from local state immediately for seamless experience
      setPlayers(prev => prev.filter(player => player.id !== playerId));
      setError(null);
    } catch (err) {
      setError("Failed to delete player");
      console.error("Error deleting player:", err);
    }
  };

  const handleStartNewGame = async () => {
    try {
      const newGame = await createNewActiveGame();
      navigate(`/game/${newGame.id}`);
    } catch (err) {
      setError("Failed to create new game");
      console.error("Error creating new game:", err);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    try {
      await deleteGame(gameId);
      setGames((prev) => prev.filter((g) => g.id !== gameId));
    } catch (err) {
      setError("Failed to delete game");
      console.error("Error deleting game:", err);
    }
  };

  const handleEndGame = async (gameId: string) => {
    try {
      await endGame(gameId);
      // Update the game status to 'ended' immediately for seamless experience
      setGames((prev) => prev.map((game) => 
        game.id === gameId 
          ? { ...game, status: 'ended' as const, ended_at: new Date().toISOString() }
          : game
      ));
      setError(null);
    } catch (err) {
      setError("Failed to end game");
      console.error("Error ending game:", err);
    }
  };

  const handleDeleteAllPlayers = async () => {
    if (
      !confirm(
        "Are you sure you want to delete ALL players? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteAllPlayers();
      // Clear players immediately for seamless experience
      setPlayers([]);
      setError(null);
    } catch (err) {
      setError("Failed to delete all players");
      console.error("Error deleting all players:", err);
    }
  };

  const handleDeleteAllGames = async () => {
    if (
      !confirm(
        "Are you sure you want to delete ALL games? This action cannot be undone and will reset all player scores."
      )
    ) {
      return;
    }

    try {
      await deleteAllGames();
      // Clear games immediately and reset player scores for seamless experience
      setGames([]);
      // Reset all player game points to 0 since all games are deleted
      setPlayers(prev => prev.map(player => ({
        ...player,
        game_points: 0,
        total_points: player.points
      })));
      setError(null);
    } catch (err) {
      setError("Failed to delete all games");
      console.error("Error deleting all games:", err);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-container">
        <h1 className="app-title">KOB Tracker</h1>

        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)} className="error-close">
              ✕
            </button>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Game Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="button-group">
              <Button
                onClick={handleStartNewGame}
                className="btn btn-green btn-large"
              >
                Start New Game
              </Button>
              <Button
                onClick={handleDeleteAllGames}
                variant="destructive"
                className="btn btn-destructive btn-large"
              >
                Delete All Games
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Player Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPlayer} className="form">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
                className="form-input"
              />
              <div className="button-group">
                <Button className="btn btn-green">Add Player</Button>
                <Button
                  type="button"
                  onClick={handleDeleteAllPlayers}
                  variant="destructive"
                  className="btn btn-destructive"
                >
                  Delete All Players
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Players Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {players.length === 0 ? (
              <div className="empty-state">
                No players yet. Add your first player above!
              </div>
            ) : (
              <div className="players-list">
                {players.map((player, index) => (
                  <div key={player.id} className="player-row">
                    <div className="player-info">
                      <div
                        className={`rank-badge rank-${
                          index === 0
                            ? "1"
                            : index === 1
                            ? "2"
                            : index === 2
                            ? "3"
                            : "other"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="player-details">
                        <h3 className="player-name">{player.name}</h3>
                        <p className="player-points">
                          {player.game_points} points
                        </p>
                      </div>
                    </div>

                    <div className="button-group">
                      <Button
                        onClick={() => handleDeletePlayer(player.id)}
                        variant="destructive"
                        size="sm"
                        className="btn btn-sm btn-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Game History</CardTitle>
          </CardHeader>
          <CardContent>
            {games.length === 0 ? (
              <div className="empty-state">
                No games yet. Start your first game above!
              </div>
            ) : (
              <div className="games-list">
                {games.map((game) => (
                  <div key={game.id} className="game-row">
                    <div className="game-info">
                      <div className="game-header-info">
                        <div className="game-date">
                          {new Date(
                            game.ended_at || game.created_at
                          ).toLocaleDateString()}
                        </div>
                        <div className={`game-status ${game.status}`}>
                          {game.status === "active" ? "Active" : "Ended"}
                        </div>
                      </div>
                      <div className="game-players">
                        <div className="team">
                          <div className="team-label">Team 1</div>
                          {game.team1_player1 && (
                            <div className="player-score">
                              <span className="player-name">
                                {game.team1_player1.name}
                              </span>
                              <span className="score">
                                {game.team1_player1_points}
                              </span>
                            </div>
                          )}
                          {game.team1_player2 && (
                            <div className="player-score">
                              <span className="player-name">
                                {game.team1_player2.name}
                              </span>
                              <span className="score">
                                {game.team1_player2_points}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="vs">VS</div>
                        <div className="team">
                          <div className="team-label">Team 2</div>
                          {game.team2_player1 && (
                            <div className="player-score">
                              <span className="player-name">
                                {game.team2_player1.name}
                              </span>
                              <span className="score">
                                {game.team2_player1_points}
                              </span>
                            </div>
                          )}
                          {game.team2_player2 && (
                            <div className="player-score">
                              <span className="player-name">
                                {game.team2_player2.name}
                              </span>
                              <span className="score">
                                {game.team2_player2_points}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="game-actions">
                      {game.status === "active" ? (
                        <>
                          <Button
                            onClick={() => navigate(`/game/${game.id}`)}
                            className="btn btn-sm btn-green"
                          >
                            Return to Game
                          </Button>
                          <Button
                            onClick={() => handleEndGame(game.id)}
                            variant="secondary"
                            size="sm"
                            className="btn btn-sm"
                          >
                            End Game
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => navigate(`/game/${game.id}`)}
                          className="btn btn-sm btn-outline"
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDeleteGame(game.id)}
                        variant="destructive"
                        size="sm"
                        className="btn btn-sm btn-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
