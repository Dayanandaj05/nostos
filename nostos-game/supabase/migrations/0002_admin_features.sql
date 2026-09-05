-- Migration to add level locks and incident logs

-- Add is_locked to levels
ALTER TABLE levels ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;

-- Create incident_logs table
CREATE TABLE IF NOT EXISTS incident_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    reported_by TEXT NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster retrieval of incident logs
CREATE INDEX IF NOT EXISTS idx_incident_logs_created_at ON incident_logs(created_at DESC);
