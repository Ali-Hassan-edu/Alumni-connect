-- ============================================================================
-- SUPABASE RLS FIXES - University Alumni Connect
-- Run these commands in Supabase SQL Editor (in order)
-- ============================================================================

-- ============================================================================
-- STEP 1: DISABLE RLS ON TABLES
-- ============================================================================

-- Disable RLS on threads table
ALTER TABLE threads DISABLE ROW LEVEL SECURITY;

-- Disable RLS on thread_replies table
ALTER TABLE thread_replies DISABLE ROW LEVEL SECURITY;

-- Disable RLS on thread_votes table
ALTER TABLE thread_votes DISABLE ROW LEVEL SECURITY;

-- Disable RLS on events table
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Disable RLS on announcements table
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;

-- Disable RLS on event_rsvps table
ALTER TABLE event_rsvps DISABLE ROW LEVEL SECURITY;

-- Disable RLS on conversations table
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on direct_messages table
ALTER TABLE direct_messages DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: CREATE SKILL-BASED TASK ASSIGNMENT FUNCTION
-- ============================================================================

-- Drop old function signature first to avoid return-type conflicts
DROP FUNCTION IF EXISTS find_matching_students(TEXT[], INTEGER);
DROP FUNCTION IF EXISTS find_matching_students(TEXT[], UUID, INT);

-- This function finds matching students for task assignment based on skills
CREATE OR REPLACE FUNCTION find_matching_students(task_skills TEXT[], limit_count INTEGER DEFAULT 10)
RETURNS TABLE(id UUID, full_name TEXT, email TEXT, profile_picture_url TEXT, skills TEXT[], match_percentage NUMERIC) AS $$
BEGIN
  RETURN QUERY
    SELECT u.id, u.full_name, u.email, u.profile_picture_url, sp.skills,
      ROUND(((SELECT COUNT(*) FROM unnest(sp.skills) s WHERE s = ANY(task_skills))::NUMERIC / GREATEST(array_length(task_skills, 1), 1)::NUMERIC) * 100, 1) AS match_percentage
    FROM users u
    JOIN student_profiles sp ON u.id = sp.user_id
    WHERE u.account_status = 'approved' AND u.role = 'student' AND sp.skills && task_skills
    ORDER BY match_percentage DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_matching_students(TEXT[], INTEGER) TO authenticated;

-- ============================================================================
-- VERIFICATION STEPS (Run these to verify RLS is disabled)
-- ============================================================================

-- Check RLS status on all modified tables
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'threads', 
  'thread_replies', 
  'thread_votes', 
  'events', 
  'announcements',
  'event_rsvps', 
  'conversations', 
  'direct_messages'
)
ORDER BY tablename;

-- Verify the function exists and is callable
SELECT 
  proname,
  pg_get_functiondef(pg_proc.oid) as function_definition
FROM pg_proc
WHERE proname = 'find_matching_students';

-- ============================================================================
-- OPTIONAL: Test the find_matching_students function
-- ============================================================================

-- Example usage (uncomment and modify with actual skill names to test):
-- SELECT * FROM find_matching_students(
--   ARRAY['JavaScript', 'React', 'TypeScript'],
--   NULL,
--   5
-- );

-- ============================================================================
-- END OF SQL FIXES
-- ============================================================================
