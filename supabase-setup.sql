-- Create players table
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on players" ON players
FOR ALL USING (true) WITH CHECK (true);

-- Create function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON players 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create games table for 2v2 games
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team1_player1_id UUID REFERENCES players(id) ON DELETE SET NULL,
  team1_player1_points INTEGER NOT NULL DEFAULT 0,
  team1_player2_id UUID REFERENCES players(id) ON DELETE SET NULL,
  team1_player2_points INTEGER NOT NULL DEFAULT 0,
  team2_player1_id UUID REFERENCES players(id) ON DELETE SET NULL,
  team2_player1_points INTEGER NOT NULL DEFAULT 0,
  team2_player2_id UUID REFERENCES players(id) ON DELETE SET NULL,
  team2_player2_points INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure all players are different when all are assigned
  CONSTRAINT different_players CHECK (
    (team1_player1_id IS NULL OR team1_player2_id IS NULL OR team1_player1_id != team1_player2_id) AND
    (team1_player1_id IS NULL OR team2_player1_id IS NULL OR team1_player1_id != team2_player1_id) AND
    (team1_player1_id IS NULL OR team2_player2_id IS NULL OR team1_player1_id != team2_player2_id) AND
    (team1_player2_id IS NULL OR team2_player1_id IS NULL OR team1_player2_id != team2_player1_id) AND
    (team1_player2_id IS NULL OR team2_player2_id IS NULL OR team1_player2_id != team2_player2_id) AND
    (team2_player1_id IS NULL OR team2_player2_id IS NULL OR team2_player1_id != team2_player2_id)
  )
);

-- Enable Row Level Security for games
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on games
CREATE POLICY "Allow all operations on games" ON games
FOR ALL USING (true) WITH CHECK (true);

-- Create trigger to automatically update updated_at for games
CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON games 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();