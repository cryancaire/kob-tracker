import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
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
  getUserPreferences,
  updateSectionOrder,
  updateCollapsedSections,
} from "../lib/database";
import type { PlayerWithGamePoints, GameWithPlayers, SectionId } from "../types/database";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ui/theme-toggle";

// Generate a simple session ID for the user (in a real app, you'd use proper auth)
const getUserSessionId = (): string => {
  let sessionId = localStorage.getItem('user-session-id');
  if (!sessionId) {
    sessionId = 'user-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('user-session-id', sessionId);
  }
  return sessionId;
};

export function Home() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PlayerWithGamePoints[]>([]);
  const [games, setGames] = useState<GameWithPlayers[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<SectionId, boolean>>({} as Record<SectionId, boolean>);
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>([
    'actions',
    'players-leaderboard',
    'game-history'
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Clean up empty games first
      await deleteEmptyGames();

      const [playersData, gamesData, userPrefs] = await Promise.all([
        getAllPlayersWithGamePoints(),
        getAllGamesWithPlayers(),
        getUserPreferences(getUserSessionId()),
      ]);
      
      setPlayers(playersData);
      setGames(gamesData); // Show all games
      
      // Load user preferences if they exist
      if (userPrefs) {
        // Handle backward compatibility: migrate old section order to new format
        let sectionOrder = userPrefs.section_order;
        if (sectionOrder.includes('game-actions' as SectionId) || sectionOrder.includes('player-actions' as SectionId)) {
          // Migrate old format to new format
          sectionOrder = sectionOrder.filter(id => !['game-actions', 'player-actions'].includes(id));
          if (!sectionOrder.includes('actions')) {
            sectionOrder.unshift('actions' as SectionId);
          }
          // Save the migrated order
          try {
            await updateSectionOrder(sectionOrder, getUserSessionId());
          } catch (err) {
            console.error('Error migrating section order:', err);
          }
        }
        
        setSectionOrder(sectionOrder);
        setCollapsedSections(userPrefs.collapsed_sections || {});
      }
      
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

  const handleDragEnd = async (result: any) => {
    const { destination, source } = result;

    // If dropped outside the list, do nothing
    if (!destination) {
      return;
    }

    // If dropped in the same position, do nothing
    if (destination.index === source.index) {
      return;
    }

    // Reorder the sections
    const newSectionOrder = Array.from(sectionOrder);
    const [reorderedItem] = newSectionOrder.splice(source.index, 1);
    newSectionOrder.splice(destination.index, 0, reorderedItem);

    // Update local state immediately
    setSectionOrder(newSectionOrder);

    // Save to database
    try {
      await updateSectionOrder(newSectionOrder, getUserSessionId());
    } catch (err) {
      console.error('Error saving section order:', err);
      setError('Failed to save section order');
    }
  };

  const handleSectionToggle = async (sectionId: SectionId) => {
    const newCollapsedSections = {
      ...collapsedSections,
      [sectionId]: !collapsedSections[sectionId]
    };
    
    // Update local state immediately
    setCollapsedSections(newCollapsedSections);
    
    // Save to database
    try {
      await updateCollapsedSections(newCollapsedSections, getUserSessionId());
    } catch (err) {
      console.error('Error saving collapsed state:', err);
      setError('Failed to save section state');
    }
  };

  // Helper function to check if a section is expanded (default to true if not set)
  const isSectionExpanded = (sectionId: SectionId): boolean => {
    return !collapsedSections[sectionId]; // false means collapsed, undefined/true means expanded
  };

  const renderSection = (sectionId: SectionId, index: number) => {
    switch (sectionId) {
      case 'actions':
        return (
          <Draggable key={sectionId} draggableId={sectionId} index={index}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                className={`section-container ${snapshot.isDragging ? 'dragging' : ''}`}
              >
                <Card>
                  <CardHeader>
                    <div className="collapsible-header" onClick={() => handleSectionToggle('actions')}>
                      <div className="section-title-with-drag">
                        <div 
                          {...provided.dragHandleProps} 
                          className="drag-handle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⋮⋮
                        </div>
                        <CardTitle>Actions</CardTitle>
                      </div>
                      <div className="header-controls">
                        <div onClick={(e) => e.stopPropagation()}>
                          <ThemeToggle />
                        </div>
                        <span className={`collapse-icon ${isSectionExpanded('actions') ? 'expanded' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  {isSectionExpanded('actions') && (
                    <CardContent className="collapsible-content">
                      <div className="actions-grid">
                        <div className="actions-column">
                          <h3>Game Actions</h3>
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
                        </div>
                        
                        <div className="actions-column">
                          <h3>Player Actions</h3>
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
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}
          </Draggable>
        );

      case 'players-leaderboard':
        return (
          <Draggable key={sectionId} draggableId={sectionId} index={index}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                className={`section-container ${snapshot.isDragging ? 'dragging' : ''}`}
              >
                <Card>
                  <CardHeader>
                    <div className="collapsible-header" onClick={() => handleSectionToggle('players-leaderboard')}>
                      <div className="section-title-with-drag">
                        <div 
                          {...provided.dragHandleProps} 
                          className="drag-handle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⋮⋮
                        </div>
                        <CardTitle>Players Leaderboard</CardTitle>
                      </div>
                      <span className={`collapse-icon ${isSectionExpanded('players-leaderboard') ? 'expanded' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </CardHeader>
                  {isSectionExpanded('players-leaderboard') && (
                    <CardContent className="collapsible-content">
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
                  )}
                </Card>
              </div>
            )}
          </Draggable>
        );

      case 'game-history':
        return (
          <Draggable key={sectionId} draggableId={sectionId} index={index}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                className={`section-container ${snapshot.isDragging ? 'dragging' : ''}`}
              >
                <Card>
                  <CardHeader>
                    <div className="collapsible-header" onClick={() => handleSectionToggle('game-history')}>
                      <div className="section-title-with-drag">
                        <div 
                          {...provided.dragHandleProps} 
                          className="drag-handle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⋮⋮
                        </div>
                        <CardTitle>Game History</CardTitle>
                      </div>
                      <span className={`collapse-icon ${isSectionExpanded('game-history') ? 'expanded' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </CardHeader>
                  {isSectionExpanded('game-history') && (
                    <CardContent className="collapsible-content">
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
                  )}
                </Card>
              </div>
            )}
          </Draggable>
        );

      default:
        return null;
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

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="sections-container"
              >
                {sectionOrder.map((sectionId, index) => renderSection(sectionId, index))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
