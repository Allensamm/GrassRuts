-- Allow API-based updates without a portal user
ALTER TABLE issue_updates ALTER COLUMN government_user_id DROP NOT NULL;

-- Ensure resolution_confirmations has unique constraint for upsert
ALTER TABLE resolution_confirmations
  ADD CONSTRAINT IF NOT EXISTS resolution_confirmations_issue_user_unique
  UNIQUE (issue_id, user_id);

-- Rate-limit helper: prevent spam reports (one per user per issue already enforced by UNIQUE)
-- Add index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Add index for watchlist queries
CREATE INDEX IF NOT EXISTS idx_watchlist_lga ON watchlist(lga_id);

-- Ensure gov_api_keys table has RLS (no public access)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'gov_api_keys'
  ) THEN
    ALTER TABLE gov_api_keys ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
