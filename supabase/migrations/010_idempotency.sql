-- Migration 010: Idempotency keys for offline-queued issue submissions
-- Prevents duplicate issues when the client replays a queued submission.

ALTER TABLE issues
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Unique constraint: one submission per idempotency key
-- NULLS are excluded from uniqueness (only one NULL allowed per standard SQL,
-- but Postgres allows multiple NULLs in a unique index by default).
CREATE UNIQUE INDEX IF NOT EXISTS issues_idempotency_key_uidx
  ON issues (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
