import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getGameWithPlayersById,
  getAllPlayers,
  updatePlayerInGame,
  updatePlayerPointsInGame,
  endGame,
  updateGame,
} from "../lib/database";
import { useAuth } from "../contexts/AuthContext";
import type { GameWithPlayers, Player } from "../types/database";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { LiveTimer } from "./ui/live-timer";

export function GameView() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [game, setGame] = useState<GameWithPlayers | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGameData = useCallback(async () => {
    if (!gameId) return;

    try {
      setLoading(true);
      const [gameData, playersData] = await Promise.all([
        getGameWithPlayersById(gameId),
        getAllPlayers(),
      ]);

      if (!gameData) {
        setError("Game not found");
        return;
      }

      setGame(gameData);
      setPlayers(playersData);
      setError(null);
    } catch (err) {
      setError("Failed to load game data");
      console.error("Error loading game data:", err);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    if (gameId && !authLoading && user) {
      loadGameData();
    }
  }, [gameId, authLoading, user, loadGameData]);

  const handlePlayerChange = async (
    playerSlot:
      | "team1_player1"
      | "team1_player2"
      | "team2_player1"
      | "team2_player2",
    playerId: string | null
  ) => {
    if (!gameId || !game) return;

    try {
      await updatePlayerInGame(gameId, playerSlot, playerId);

      // Update local state immediately for seamless experience
      const selectedPlayer = playerId
        ? players.find((p) => p.id === playerId)
        : null;
      setGame((prev) =>
        prev
          ? {
              ...prev,
              [playerSlot]: selectedPlayer,
            }
          : null
      );
      setError(null);
    } catch (err) {
      setError("Failed to update player");
      console.error("Error updating player:", err);
    }
  };

  const handleTeamPointsChange = async (
    team: "team1" | "team2",
    pointsToAdd: number
  ) => {
    if (!gameId || !game) return;

    try {
      const player1Slot = `${team}_player1` as
        | "team1_player1"
        | "team2_player1";

      const currentPoints1 = game[`${player1Slot}_points`];
      const newPoints1 = Math.max(0, currentPoints1 + pointsToAdd);

      await updatePlayerPointsInGame(gameId, player1Slot, newPoints1);

      // Update local state immediately for seamless experience
      setGame((prev) =>
        prev
          ? {
              ...prev,
              [`${player1Slot}_points`]: newPoints1,
            }
          : null
      );
      setError(null);
    } catch (err) {
      setError("Failed to update team points");
      console.error("Error updating team points:", err);
    }
  };

  const handleSetTeamPoints = async (
    team: "team1" | "team2",
    points: number
  ) => {
    if (!gameId || !game) return;

    try {
      const player1Slot = `${team}_player1` as
        | "team1_player1"
        | "team2_player1";
      const player2Slot = `${team}_player2` as
        | "team1_player2"
        | "team2_player2";

      await Promise.all([
        updatePlayerPointsInGame(gameId, player1Slot, points),
        updatePlayerPointsInGame(gameId, player2Slot, 0),
      ]);

      // Update local state immediately for seamless experience
      setGame((prev) =>
        prev
          ? {
              ...prev,
              [`${player1Slot}_points`]: points,
              [`${player2Slot}_points`]: 0,
            }
          : null
      );
      setError(null);
    } catch (err) {
      setError("Failed to set team points");
      console.error("Error setting team points:", err);
    }
  };

  const handleEndGame = async () => {
    if (!gameId) return;

    try {
      await endGame(gameId);
      navigate("/");
    } catch (err) {
      setError("Failed to end game");
      console.error("Error ending game:", err);
    }
  };

  const handleSaveAndReturn = () => {
    // For ended games, just navigate back
    navigate("/");
  };

  const handleStartTimer = async () => {
    if (!gameId || !game) return;
    
    try {
      const now = new Date().toISOString();
      await updateGame(gameId, {
        timer_started_at: now,
        timer_paused_at: null,
      });
      
      setGame(prev => prev ? {
        ...prev,
        timer_started_at: now,
        timer_paused_at: null,
      } : null);
    } catch (err) {
      setError("Failed to start timer");
      console.error("Error starting timer:", err);
    }
  };

  const handlePauseTimer = async () => {
    if (!gameId || !game) return;
    
    try {
      const now = new Date().toISOString();
      await updateGame(gameId, {
        timer_paused_at: now,
      });
      
      setGame(prev => prev ? {
        ...prev,
        timer_paused_at: now,
      } : null);
    } catch (err) {
      setError("Failed to pause timer");
      console.error("Error pausing timer:", err);
    }
  };

  const handleResumeTimer = async () => {
    if (!gameId || !game || !game.timer_paused_at) return;
    
    try {
      const now = new Date();
      const pausedAt = new Date(game.timer_paused_at);
      const additionalPausedTime = now.getTime() - pausedAt.getTime();
      const newTotalPausedTime = game.timer_total_paused_time + additionalPausedTime;
      
      await updateGame(gameId, {
        timer_paused_at: null,
        timer_total_paused_time: newTotalPausedTime,
      });
      
      setGame(prev => prev ? {
        ...prev,
        timer_paused_at: null,
        timer_total_paused_time: newTotalPausedTime,
      } : null);
    } catch (err) {
      setError("Failed to resume timer");
      console.error("Error resuming timer:", err);
    }
  };

  const handleResetTimer = async () => {
    if (!gameId || !game) return;
    
    try {
      await updateGame(gameId, {
        timer_started_at: null,
        timer_paused_at: null,
        timer_total_paused_time: 0,
      });
      
      setGame(prev => prev ? {
        ...prev,
        timer_started_at: null,
        timer_paused_at: null,
        timer_total_paused_time: 0,
      } : null);
    } catch (err) {
      setError("Failed to reset timer");
      console.error("Error resetting timer:", err);
    }
  };

  const getAvailablePlayers = (currentPlayerSlot: string) => {
    const assignedPlayerIds = [
      game?.team1_player1?.id,
      game?.team1_player2?.id,
      game?.team2_player1?.id,
      game?.team2_player2?.id,
    ].filter((id) => id !== null);

    const currentPlayerId = game?.[
      `${currentPlayerSlot}` as keyof GameWithPlayers
    ] as Player | null;

    return players.filter(
      (player) =>
        !assignedPlayerIds.includes(player.id) ||
        player.id === currentPlayerId?.id
    );
  };

  if (loading || authLoading) {
    return (
      <div className="loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="loading">
        <div className="loading-content">
          <p className="loading-text">Please sign in to view games...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="app-container">
        <div className="error-banner">
          Game not found
          <Button onClick={() => navigate("/")} className="btn btn-sm">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-container">
        <div className="game-header">
          <div className="game-title-section">
            <h1 className="app-title">
              {game.status === "active" ? "Active Game" : "Edit Game"}
            </h1>
            <div className="game-timer">
              <LiveTimer 
                startTime={game.created_at} 
                endTime={game.ended_at}
                timerStartedAt={game.timer_started_at || null}
                timerPausedAt={game.timer_paused_at || null}
                timerTotalPausedTime={game.timer_total_paused_time || 0}
                className="header-timer"
              />
              {game.status === "active" && (
                <div className="timer-controls">
                  {!(game.timer_started_at) ? (
                    <Button 
                      onClick={handleStartTimer}
                      className="btn btn-sm btn-green"
                    >
                      Start Timer
                    </Button>
                  ) : (game.timer_paused_at) ? (
                    <Button 
                      onClick={handleResumeTimer}
                      className="btn btn-sm btn-green"
                    >
                      Resume Timer
                    </Button>
                  ) : (
                    <Button 
                      onClick={handlePauseTimer}
                      className="btn btn-sm btn-destructive"
                    >
                      Pause Timer
                    </Button>
                  )}
                  <Button 
                    onClick={handleResetTimer}
                    className="btn btn-sm btn-outline"
                  >
                    Reset Timer
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="game-actions">
            <Button onClick={() => navigate("/")} className="btn btn-outline">
              Back to Home
            </Button>
            {game.status === "active" ? (
              <Button onClick={handleEndGame} className="btn btn-destructive">
                End Game
              </Button>
            ) : (
              <Button onClick={handleSaveAndReturn} className="btn btn-green">
                Save Changes
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)} className="error-close">
              ✕
            </button>
          </div>
        )}

        {game.status === "ended" && (
          <div className="info-banner">
            <span>
              📝 Editing ended game - changes will update player leaderboard
              scores
            </span>
          </div>
        )}

        {/* Mobile Scoreboard - only visible on mobile */}
        <div className="mobile-scoreboard">
          <Card className="mobile-scoreboard-card">
            <CardContent className="mobile-scoreboard-content">
              <div className="mobile-scores">
                <div className="mobile-team-score">
                  <div className="mobile-team-name">Team 1</div>
                  <div className="mobile-player-names">
                    <div className="mobile-player-name">
                      {game.team1_player1?.name || "Player 1"}
                    </div>
                    <div className="mobile-player-name">
                      {game.team1_player2?.name || "Player 2"}
                    </div>
                  </div>
                  <div className="mobile-score-value">
                    {game.team1_player1_points + game.team1_player2_points}
                  </div>
                </div>
                <div className="mobile-score-divider">VS</div>
                <div className="mobile-team-score">
                  <div className="mobile-team-name">Team 2</div>
                  <div className="mobile-player-names">
                    <div className="mobile-player-name">
                      {game.team2_player1?.name || "Player 1"}
                    </div>
                    <div className="mobile-player-name">
                      {game.team2_player2?.name || "Player 2"}
                    </div>
                  </div>
                  <div className="mobile-score-value">
                    {game.team2_player1_points + game.team2_player2_points}
                  </div>
                </div>
              </div>
              
              <div className="mobile-controls">
                <div className="mobile-team-controls">
                  <div className="mobile-team-label">Team 1</div>
                  <div className="mobile-control-buttons">
                    <Button
                      onClick={() => handleTeamPointsChange("team1", -1)}
                      className="btn btn-sm btn-destructive"
                      disabled={
                        game?.team1_player1_points === 0
                      }
                    >
                      -1
                    </Button>
                    <Button
                      onClick={() => handleTeamPointsChange("team1", 1)}
                      className="btn btn-sm btn-green"
                    >
                      +1
                    </Button>
                    <Button
                      onClick={() => handleSetTeamPoints("team1", 15)}
                      className="btn btn-sm btn-green-dark"
                    >
                      15
                    </Button>
                    <Button
                      onClick={() => handleSetTeamPoints("team1", 21)}
                      className="btn btn-sm btn-green-dark"
                    >
                      21
                    </Button>
                  </div>
                </div>
                
                <div className="mobile-team-controls">
                  <div className="mobile-team-label">Team 2</div>
                  <div className="mobile-control-buttons">
                    <Button
                      onClick={() => handleTeamPointsChange("team2", -1)}
                      className="btn btn-sm btn-destructive"
                      disabled={
                        game?.team2_player1_points === 0
                      }
                    >
                      -1
                    </Button>
                    <Button
                      onClick={() => handleTeamPointsChange("team2", 1)}
                      className="btn btn-sm btn-green"
                    >
                      +1
                    </Button>
                    <Button
                      onClick={() => handleSetTeamPoints("team2", 15)}
                      className="btn btn-sm btn-green-dark"
                    >
                      15
                    </Button>
                    <Button
                      onClick={() => handleSetTeamPoints("team2", 21)}
                      className="btn btn-sm btn-green-dark"
                    >
                      21
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="teams-container">
          <div className="team-section">
            <Card className="team-card">
              <CardHeader>
                <CardTitle>Team 1</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="team-section-content">
                  <div className="team-players-combined">
                    {(["team1_player1", "team1_player2"] as const).map(
                      (playerSlot, index) => {
                        const player = game[playerSlot];

                        return (
                          <div key={playerSlot} className="player-selector-row">
                            <label className="player-label">Player {index + 1}</label>
                            <select
                              value={player?.id || ""}
                              onChange={(e) =>
                                handlePlayerChange(
                                  playerSlot,
                                  e.target.value || null
                                )
                              }
                              className="player-dropdown"
                            >
                              <option value="">Select Player</option>
                              {getAvailablePlayers(playerSlot).map(
                                (availablePlayer) => (
                                  <option
                                    key={availablePlayer.id}
                                    value={availablePlayer.id}
                                  >
                                    {availablePlayer.name}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        );
                      }
                    )}
                  </div>
                  
                  <div className="team-points-display">
                    <div className="points-value">
                      {game.team1_player1_points + game.team1_player2_points}
                    </div>
                    <div className="points-label">Team Points</div>
                  </div>
                </div>

                <div className="team-controls">
                  <h4>Team Controls</h4>
                  <div className="points-controls">
                    <div className="points-row">
                      <Button
                        onClick={() => handleTeamPointsChange("team1", -1)}
                        className="btn btn-sm btn-destructive"
                        disabled={
                          game?.team1_player1_points === 0
                        }
                      >
                        -1
                      </Button>
                      <Button
                        onClick={() => handleTeamPointsChange("team1", 1)}
                        className="btn btn-sm btn-green"
                      >
                        +1
                      </Button>
                    </div>
                    <div className="points-row">
                      <Button
                        onClick={() => handleSetTeamPoints("team1", 15)}
                        className="btn btn-sm btn-green-dark"
                      >
                        Set to 15
                      </Button>
                      <Button
                        onClick={() => handleSetTeamPoints("team1", 21)}
                        className="btn btn-sm btn-green-dark"
                      >
                        Set to 21
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="vs-divider">VS</div>

          <div className="team-section">
            <Card className="team-card">
              <CardHeader>
                <CardTitle>Team 2</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="team-section-content">
                  <div className="team-players-combined">
                    {(["team2_player1", "team2_player2"] as const).map(
                      (playerSlot, index) => {
                        const player = game[playerSlot];

                        return (
                          <div key={playerSlot} className="player-selector-row">
                            <label className="player-label">Player {index + 1}</label>
                            <select
                              value={player?.id || ""}
                              onChange={(e) =>
                                handlePlayerChange(
                                  playerSlot,
                                  e.target.value || null
                                )
                              }
                              className="player-dropdown"
                            >
                              <option value="">Select Player</option>
                              {getAvailablePlayers(playerSlot).map(
                                (availablePlayer) => (
                                  <option
                                    key={availablePlayer.id}
                                    value={availablePlayer.id}
                                  >
                                    {availablePlayer.name}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        );
                      }
                    )}
                  </div>
                  
                  <div className="team-points-display">
                    <div className="points-value">
                      {game.team2_player1_points + game.team2_player2_points}
                    </div>
                    <div className="points-label">Team Points</div>
                  </div>
                </div>

                <div className="team-controls">
                  <h4>Team Controls</h4>
                  <div className="points-controls">
                    <div className="points-row">
                      <Button
                        onClick={() => handleTeamPointsChange("team2", -1)}
                        className="btn btn-sm btn-destructive"
                        disabled={
                          game?.team2_player1_points === 0
                        }
                      >
                        -1
                      </Button>
                      <Button
                        onClick={() => handleTeamPointsChange("team2", 1)}
                        className="btn btn-sm btn-green"
                      >
                        +1
                      </Button>
                    </div>
                    <div className="points-row">
                      <Button
                        onClick={() => handleSetTeamPoints("team2", 15)}
                        className="btn btn-sm btn-green-dark"
                      >
                        Set to 15
                      </Button>
                      <Button
                        onClick={() => handleSetTeamPoints("team2", 21)}
                        className="btn btn-sm btn-green-dark"
                      >
                        Set to 21
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
