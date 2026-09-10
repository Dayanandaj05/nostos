-- Add teamwork progression columns to the progress table
ALTER TABLE progress
ADD COLUMN IF NOT EXISTS aid_tokens INT NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS pending_advance BOOLEAN NOT NULL DEFAULT FALSE;
