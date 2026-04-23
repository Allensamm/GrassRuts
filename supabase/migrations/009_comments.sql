-- Comments on issues
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 2 AND 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast comment loading per issue
CREATE INDEX IF NOT EXISTS idx_comments_issue ON comments(issue_id, created_at);

-- RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are publicly readable" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Add is_active column to government_users if missing
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS state_id INTEGER REFERENCES states(id);
