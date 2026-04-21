-- Track why an issue was flagged for review
ALTER TABLE issues ADD COLUMN IF NOT EXISTS flagged_reason TEXT DEFAULT NULL;

-- Index for finding flagged issues quickly in admin views
CREATE INDEX IF NOT EXISTS idx_issues_flagged ON issues(status) WHERE status = 'in_review';

-- Track account creation time for suspicious pattern detection (already on auth.users, expose here)
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);
