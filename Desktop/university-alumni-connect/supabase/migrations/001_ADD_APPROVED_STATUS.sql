-- Migration: Add 'approved' task status and enhance find_matching_students RPC
-- This file contains the incremental changes needed to support the task assignment feature

-- Update task_status enum to include 'approved' status
-- Note: In PostgreSQL, you need to create a new type and update dependent columns
-- For Supabase, run these statements in order

ALTER TYPE task_status ADD VALUE 'approved' AFTER 'open';

-- Update find_matching_students RPC to return match_percentage and additional user info
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
