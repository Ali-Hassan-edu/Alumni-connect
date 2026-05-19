-- ============================================================
-- Add Announcements + Occurrence Date + Profile Picture URL
-- ============================================================

DO $$ BEGIN
  CREATE TYPE announcement_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority announcement_priority NOT NULL DEFAULT 'medium',
  is_pinned BOOLEAN DEFAULT FALSE,
  occurs_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_occurs_at ON announcements(occurs_at);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);

DO $$ BEGIN
  CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "allow_all_announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
