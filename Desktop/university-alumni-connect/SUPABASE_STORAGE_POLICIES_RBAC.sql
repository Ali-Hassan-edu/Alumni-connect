-- ============================================================================
-- SUPABASE STORAGE BUCKETS + POLICIES (avatars, resumes, community-media)
-- Use with serverless uploads (service role). Public read for avatars + community.
-- ============================================================================

-- Create buckets (run once)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('community-media', 'community-media', true),
  ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (if not already enabled)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; -- (Commented out: usually already enabled by Supabase, and throws 42501 permission error if run here)

-- Public read for avatars
CREATE POLICY "public read avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Public read for community media
CREATE POLICY "public read community media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'community-media');

-- No INSERT/UPDATE/DELETE policies here.
-- Uploads are performed via serverless endpoints using the service role key.
