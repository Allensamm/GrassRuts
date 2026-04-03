-- Drop the portal-specific migration (no longer needed)
-- Government access is now via API keys only

-- API keys table for government entities
CREATE TABLE gov_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT UNIQUE NOT NULL,  -- store as plain text (use UUID or random string)
  entity_name TEXT NOT NULL,     -- e.g. "FCT Ministry of Works"
  department TEXT,
  lga_id INTEGER REFERENCES lgas(id),
  state_id INTEGER REFERENCES states(id),
  permissions TEXT[] DEFAULT ARRAY['read'],  -- 'read', 'write'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only service role can manage API keys (no public RLS)
ALTER TABLE gov_api_keys ENABLE ROW LEVEL SECURITY;
