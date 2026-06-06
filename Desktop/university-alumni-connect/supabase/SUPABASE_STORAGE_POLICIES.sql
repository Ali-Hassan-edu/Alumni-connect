-- ============================================================================
-- SUPABASE STORAGE POLICIES - Profile Pictures
-- Run these commands in Supabase SQL Editor (in order)
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP EXISTING POLICIES (if any)
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated users to upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read profile pictures" ON storage.objects;

-- ============================================================================
-- STEP 2: ENABLE RLS ON storage.objects (if not already enabled)
-- ============================================================================

-- Note: This may fail if RLS is already enabled - that's OK, just continue
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: CREATE SIMPLE POLICIES FOR profile-pictures BUCKET
-- ============================================================================

-- Policy 1: Allow authenticated users to upload to profile-pictures
CREATE POLICY "Allow authenticated users to upload profile pictures"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
);

-- Policy 2: Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update profile pictures"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
  AND (auth.uid()::text) = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
  AND (auth.uid()::text) = (storage.foldername(name))[1]
);

-- Policy 3: Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete profile pictures"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
  AND (auth.uid()::text) = (storage.foldername(name))[1]
);

-- Policy 4: Allow anyone to read profile pictures (public read access)
CREATE POLICY "Allow public to read profile pictures"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-pictures');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check RLS status
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');

-- List all policies on storage.objects
SELECT policyname, permissive, roles, qual, with_check FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
