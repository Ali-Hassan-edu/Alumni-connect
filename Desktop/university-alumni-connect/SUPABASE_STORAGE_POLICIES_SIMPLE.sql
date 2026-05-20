-- ============================================================================
-- SUPABASE STORAGE POLICIES - Profile Pictures (SIMPLE VERSION)
-- Copy and paste each section separately into SQL Editor
-- ============================================================================

-- ============================================================================
-- SECTION 1: DROP EXISTING POLICIES (copy and run first)
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated users to upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read profile pictures" ON storage.objects;

-- ============================================================================
-- SECTION 2: CREATE POLICY 1 - ALLOW AUTHENTICATED UPLOAD (copy and run second)
-- ============================================================================

CREATE POLICY "Allow authenticated users to upload profile pictures"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
);

-- ============================================================================
-- SECTION 3: CREATE POLICY 2 - ALLOW AUTHENTICATED UPDATE (copy and run third)
-- ============================================================================

CREATE POLICY "Allow authenticated users to update profile pictures"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
);

-- ============================================================================
-- SECTION 4: CREATE POLICY 3 - ALLOW AUTHENTICATED DELETE (copy and run fourth)
-- ============================================================================

CREATE POLICY "Allow authenticated users to delete profile pictures"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
);

-- ============================================================================
-- SECTION 5: CREATE POLICY 4 - ALLOW PUBLIC READ (copy and run fifth)
-- ============================================================================

CREATE POLICY "Allow public to read profile pictures"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-pictures');

-- ============================================================================
-- VERIFICATION: Check if policies were created
-- ============================================================================

SELECT 
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%profile%'
ORDER BY policyname;
