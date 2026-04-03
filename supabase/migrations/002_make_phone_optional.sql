-- Make phone optional since we're switching to email/password auth
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE users ALTER COLUMN phone SET DEFAULT NULL;
