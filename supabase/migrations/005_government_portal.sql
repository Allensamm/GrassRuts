-- Link government_users to Supabase auth
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_gov_users_auth ON government_users(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Enable RLS on government_users
ALTER TABLE government_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gov users can read own record" ON government_users
  FOR SELECT USING (auth_user_id = auth.uid());

-- Enable RLS on issue_updates
ALTER TABLE issue_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Issue updates publicly readable" ON issue_updates FOR SELECT USING (true);
CREATE POLICY "Gov users can insert updates" ON issue_updates FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM government_users
    WHERE auth_user_id = auth.uid() AND is_active = TRUE
  ));

-- Gov users can update issue status
CREATE POLICY "Gov users can update issues" ON issues FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM government_users
    WHERE auth_user_id = auth.uid() AND is_active = TRUE
  ));
