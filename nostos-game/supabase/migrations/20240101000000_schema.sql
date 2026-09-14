-- Create Teams Table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ship_name TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    member_names TEXT[] NOT NULL,
    captain_name TEXT,
    captain_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Levels Table
CREATE TABLE levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_number INT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    story_text TEXT NOT NULL,
    puzzle_type TEXT NOT NULL,
    puzzle_data JSONB NOT NULL DEFAULT '{}',
    correct_answer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Progress Table
CREATE TABLE progress (
    team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
    current_level INT NOT NULL DEFAULT 1,
    correct_count INT NOT NULL DEFAULT 0,
    incorrect_count INT NOT NULL DEFAULT 0,
    first_login_at TIMESTAMPTZ,
    last_updated_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Create Submissions Table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    level_id UUID REFERENCES levels(id) ON DELETE CASCADE NOT NULL,
    submitted_answer TEXT NOT NULL,
    was_correct BOOLEAN NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Create Level Variant Assignments Table
CREATE TABLE level_variant_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    level_id UUID REFERENCES levels(id) ON DELETE CASCADE NOT NULL,
    device_token TEXT NOT NULL,
    variant_key TEXT NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(team_id, level_id, device_token)
);

-- Create Admins Table
CREATE TYPE admin_role AS ENUM ('admin', 'volunteer');

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role admin_role NOT NULL DEFAULT 'volunteer'
);

-- Indexes for performance
CREATE INDEX idx_teams_ship_name ON teams(ship_name);
CREATE INDEX idx_submissions_team_id ON submissions(team_id);
CREATE INDEX idx_submissions_level_id ON submissions(level_id);
CREATE INDEX idx_level_variant_assignments_lookup ON level_variant_assignments(team_id, level_id, device_token);
CREATE INDEX idx_progress_current_level ON progress(current_level);
