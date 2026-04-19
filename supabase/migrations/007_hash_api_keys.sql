-- Migration: replace plaintext API keys with SHA-256 hashes
-- Rationale: if the database is read by an attacker, hashed keys cannot be
-- replayed directly. Government entities keep using their original key strings;
-- the app hashes incoming keys before comparing.

-- 1. Add a column to hold the hex-encoded SHA-256 hash of each API key.
--    sha256() returns bytea; encode(..., 'hex') gives us a TEXT we can index.
ALTER TABLE gov_api_keys
  ADD COLUMN IF NOT EXISTS key_hash TEXT;

-- 2. Populate key_hash from the existing plaintext api_key values.
UPDATE gov_api_keys
  SET key_hash = encode(sha256(api_key::bytea), 'hex')
  WHERE key_hash IS NULL;

-- 3. Make key_hash mandatory and unique.
ALTER TABLE gov_api_keys
  ALTER COLUMN key_hash SET NOT NULL;

ALTER TABLE gov_api_keys
  ADD CONSTRAINT IF NOT EXISTS gov_api_keys_key_hash_unique UNIQUE (key_hash);

-- 4. Create an index for fast lookup during authentication.
CREATE INDEX IF NOT EXISTS idx_gov_api_keys_hash
  ON gov_api_keys (key_hash)
  WHERE is_active = TRUE;

-- 5. Drop the plaintext api_key column so it can no longer be leaked.
--    NOTE: After this migration you CANNOT recover the original key values.
--    Ensure government entities have their keys saved before running this.
ALTER TABLE gov_api_keys DROP COLUMN IF EXISTS api_key;
