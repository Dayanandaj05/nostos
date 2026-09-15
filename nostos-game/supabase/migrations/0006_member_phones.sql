-- Add member_phones column to teams table
ALTER TABLE teams ADD COLUMN member_phones TEXT[] DEFAULT '{}'::text[];
