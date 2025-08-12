-- Migration to add authentication support
-- Run this in your Supabase SQL editor

-- Add user_id column to games table
ALTER TABLE games ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to players table  
ALTER TABLE players ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to user_preferences table and remove user_session_id
ALTER TABLE user_preferences ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_preferences DROP COLUMN user_session_id;
DROP INDEX IF EXISTS user_preferences_user_session_id_key;
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_id_unique UNIQUE(user_id);

-- Update RLS policies for games table
DROP POLICY IF EXISTS "Allow all operations on games" ON games;

-- Create new RLS policies for games
CREATE POLICY "Users can view their own games" ON games
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own games" ON games
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own games" ON games
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own games" ON games
FOR DELETE USING (auth.uid() = user_id);

-- Update RLS policies for players table
DROP POLICY IF EXISTS "Allow all operations on players" ON players;

-- Create new RLS policies for players
CREATE POLICY "Users can view their own players" ON players
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own players" ON players
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own players" ON players
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own players" ON players
FOR DELETE USING (auth.uid() = user_id);

-- Update RLS policies for user_preferences table
DROP POLICY IF EXISTS "Allow all operations on user_preferences" ON user_preferences;

-- Create new RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_preferences
FOR DELETE USING (auth.uid() = user_id);