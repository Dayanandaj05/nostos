-- Add captain_name and captain_phone to teams table
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS captain_name TEXT,
ADD COLUMN IF NOT EXISTS captain_phone TEXT;
