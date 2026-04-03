-- Enable PostGIS for geospatial support
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================
-- STATES
-- =============================================
CREATE TABLE states (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL
);

-- =============================================
-- LOCAL GOVERNMENT AREAS
-- =============================================
CREATE TABLE lgas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  state_id INTEGER REFERENCES states(id) ON DELETE CASCADE
);

-- =============================================
-- USERS
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  lga_id INTEGER REFERENCES lgas(id),
  community VARCHAR(255),
  is_diaspora BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CATEGORIES
-- =============================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  icon VARCHAR(10),
  government_body VARCHAR(255)
);

INSERT INTO categories (name, slug, icon, government_body) VALUES
  ('Roads & Infrastructure', 'infrastructure', '🛣️', 'Ministry of Works / LGA Works Department'),
  ('Water Supply', 'water', '💧', 'State Water Corporation'),
  ('Electricity', 'electricity', '⚡', 'Electricity Distribution Company / Ministry of Power'),
  ('Public Health', 'public_health', '🏥', 'Ministry of Health / LGA Health Department'),
  ('Security', 'security', '🔒', 'Nigeria Police Force / State Security Services'),
  ('Education', 'education', '🏫', 'Ministry of Education'),
  ('Environment', 'environment', '🌍', 'Ministry of Environment'),
  ('Other', 'other', '❓', 'Relevant Government Authority');

-- =============================================
-- ISSUES
-- =============================================
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  lga_id INTEGER REFERENCES lgas(id),
  community VARCHAR(255),
  location GEOMETRY(POINT, 4326),
  address TEXT,
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'high_priority', 'in_review', 'resolved', 'verified')),
  report_count INTEGER DEFAULT 1,
  threshold INTEGER DEFAULT 50,
  escalated_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- REPORTS (Individual reports linked to issues)
-- =============================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(issue_id, user_id)
);

-- =============================================
-- EVIDENCE (Photos / documents)
-- =============================================
CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type VARCHAR(50) CHECK (type IN ('image', 'document')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- RESOLUTION CONFIRMATIONS
-- =============================================
CREATE TABLE resolution_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_resolved BOOLEAN NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(issue_id, user_id)
);

-- =============================================
-- GOVERNMENT USERS
-- =============================================
CREATE TABLE government_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  department VARCHAR(255),
  lga_id INTEGER REFERENCES lgas(id),
  state_id INTEGER REFERENCES states(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ISSUE UPDATES (Government responses)
-- =============================================
CREATE TABLE issue_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  government_user_id UUID REFERENCES government_users(id),
  update_type VARCHAR(50)
    CHECK (update_type IN ('acknowledged', 'in_progress', 'resolved', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- WATCHLIST (Diaspora)
-- =============================================
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lga_id INTEGER REFERENCES lgas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lga_id)
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_issues_lga ON issues(lga_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_category ON issues(category_id);
CREATE INDEX idx_issues_location ON issues USING GIST(location);
CREATE INDEX idx_reports_issue ON reports(issue_id);
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_users_lga ON users(lga_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_watchlist_user ON watchlist(user_id);

-- =============================================
-- FUNCTION: Auto-escalate issue when threshold met
-- =============================================
CREATE OR REPLACE FUNCTION check_issue_threshold()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.report_count >= NEW.threshold AND OLD.status = 'pending' THEN
    NEW.status := 'high_priority';
    NEW.escalated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_issue_threshold
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION check_issue_threshold();

-- =============================================
-- FUNCTION: Increment report_count when report added
-- =============================================
CREATE OR REPLACE FUNCTION increment_issue_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE issues
  SET report_count = report_count + 1,
      updated_at = NOW()
  WHERE id = NEW.issue_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_report_count
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION increment_issue_report_count();

-- =============================================
-- FUNCTION: Check resolution confirmation threshold (50%)
-- =============================================
CREATE OR REPLACE FUNCTION check_resolution_confirmations()
RETURNS TRIGGER AS $$
DECLARE
  total_reporters INTEGER;
  confirmed_count INTEGER;
  denied_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_reporters
  FROM reports WHERE issue_id = NEW.issue_id;

  SELECT COUNT(*) INTO confirmed_count
  FROM resolution_confirmations
  WHERE issue_id = NEW.issue_id AND is_resolved = TRUE;

  SELECT COUNT(*) INTO denied_count
  FROM resolution_confirmations
  WHERE issue_id = NEW.issue_id AND is_resolved = FALSE;

  -- Confirmed: 50%+ say it's fixed
  IF confirmed_count >= CEIL(total_reporters * 0.5) THEN
    UPDATE issues SET status = 'verified', verified_at = NOW()
    WHERE id = NEW.issue_id;
  -- Denied: majority say it's NOT fixed → back to high_priority
  ELSIF denied_count > (total_reporters * 0.5) THEN
    UPDATE issues SET status = 'high_priority', resolved_at = NULL
    WHERE id = NEW.issue_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_resolution
  AFTER INSERT OR UPDATE ON resolution_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION check_resolution_confirmations();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolution_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Users: can read all, can only update their own record
CREATE POLICY "Users are publicly readable" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own record" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own record" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Issues: publicly readable, authenticated users can create
CREATE POLICY "Issues are publicly readable" ON issues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create issues" ON issues FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Reports: authenticated users can create, one per issue per user (enforced by UNIQUE)
CREATE POLICY "Reports are publicly readable" ON reports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reports" ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Evidence: publicly readable, report owner can insert
CREATE POLICY "Evidence is publicly readable" ON evidence FOR SELECT USING (true);
CREATE POLICY "Report owner can add evidence" ON evidence FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM reports WHERE id = report_id)
  );

-- Resolution confirmations: authenticated users only
CREATE POLICY "Resolution confirmations readable" ON resolution_confirmations FOR SELECT USING (true);
CREATE POLICY "Users can confirm resolution" ON resolution_confirmations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own confirmation" ON resolution_confirmations FOR UPDATE
  USING (auth.uid() = user_id);

-- Notifications: users can only see their own
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can mark own notifications read" ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Watchlist: users manage their own
CREATE POLICY "Users see own watchlist" ON watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to watchlist" ON watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from watchlist" ON watchlist FOR DELETE USING (auth.uid() = user_id);
