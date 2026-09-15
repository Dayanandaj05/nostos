-- Create God Messages Table
CREATE TABLE god_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient polling by team
CREATE INDEX idx_god_messages_team_id ON god_messages(team_id);
