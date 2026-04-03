-- Add plain lat/lng columns for map display
-- (The geometry column exists for PostGIS spatial queries; these are for easy JS access)
ALTER TABLE issues ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
