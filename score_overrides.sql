-- Create score_overrides table to store manual score adjustments
CREATE TABLE IF NOT EXISTS score_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL CHECK (row_number >= 0 AND row_number <= 25),
  team_number INTEGER NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure only one score override per game/row/team combination
  UNIQUE(game_id, row_number, team_number)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_score_overrides_game_id ON score_overrides(game_id);

-- Enable Row Level Security
ALTER TABLE score_overrides ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your security requirements)
CREATE POLICY "Allow all select on score_overrides"
  ON score_overrides FOR SELECT
  USING (true);

CREATE POLICY "Allow all insert on score_overrides"
  ON score_overrides FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all update on score_overrides"
  ON score_overrides FOR UPDATE
  USING (true);

CREATE POLICY "Allow all delete on score_overrides"
  ON score_overrides FOR DELETE
  USING (true);

-- Enable real-time for this table
ALTER PUBLICATION supabase_realtime ADD TABLE score_overrides;
