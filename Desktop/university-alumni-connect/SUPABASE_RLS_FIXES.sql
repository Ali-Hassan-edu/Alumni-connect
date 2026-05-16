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

-- Disable RLS on event_rsvps table
ALTER TABLE event_rsvps DISABLE ROW LEVEL SECURITY;

-- Disable RLS on conversations table
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on direct_messages table
ALTER TABLE direct_messages DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: CREATE SKILL-BASED TASK ASSIGNMENT FUNCTION
-- ============================================================================

-- This function finds matching students for task assignment based on skills
CREATE OR REPLACE FUNCTION find_matching_students(
  p_required_skills TEXT[],
  p_exclude_student_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  student_id UUID,
  full_name TEXT,
  email TEXT,
  matching_skills TEXT[],
  match_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.full_name,
    s.email,
    array_agg(DISTINCT sk.name) FILTER (WHERE sk.name = ANY(p_required_skills)) AS matching_skills,
    ROUND(
      (COUNT(DISTINCT CASE WHEN sk.name = ANY(p_required_skills) THEN sk.id END)::NUMERIC / 
       array_length(p_required_skills, 1)::NUMERIC) * 100,
      2
    ) AS match_percentage
  FROM students s
  LEFT JOIN student_skills ss ON s.id = ss.student_id
  LEFT JOIN skills sk ON ss.skill_id = sk.id
  WHERE 
    (p_exclude_student_id IS NULL OR s.id != p_exclude_student_id)
    AND s.is_active = true
  GROUP BY s.id, s.full_name, s.email
  HAVING COUNT(DISTINCT CASE WHEN sk.name = ANY(p_required_skills) THEN sk.id END) > 0
  ORDER BY match_percentage DESC, s.full_name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_matching_students(TEXT[], UUID, INT) TO authenticated;

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
