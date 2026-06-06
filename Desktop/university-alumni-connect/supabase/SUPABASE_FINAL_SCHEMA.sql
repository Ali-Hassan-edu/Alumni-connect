-- ============================================================================
-- ALUMNI CONNECT — FINAL SUPABASE SCHEMA (consolidated reference)
-- Run migrations in order on a fresh project:
--   1. supabase/migrations/000_FULL_SCHEMA_RUN_THIS.sql
--   2. supabase/migrations/002_ADD_ANNOUNCEMENTS_AND_PROFILE_PICS.sql
--   3. supabase/migrations/003_RBAC_COMMUNITY_PASSWORD.sql
-- Then apply policies:
--   4. SUPABASE_RLS_POLICIES_PRODUCTION.sql
--   5. SUPABASE_STORAGE_POLICIES_RBAC.sql
-- ============================================================================

-- IMPORTANT: community_posts has TWO foreign keys to users:
--   author_id  → users (post author)
--   approved_by → users (moderator)
-- Client/API queries MUST disambiguate embeds, e.g.:
--   author:users!community_posts_author_id_fkey(...)
-- Using bare author:users(...) causes PostgREST error PGRST201.

-- --------------------------------------------------------------------------
-- Core tables (from 000_FULL_SCHEMA_RUN_THIS.sql)
-- --------------------------------------------------------------------------
-- departments, users, alumni_profiles, student_profiles,
-- tasks, task_assignments, threads, thread_replies, thread_votes,
-- events, event_rsvps, notifications, conversations, direct_messages

-- --------------------------------------------------------------------------
-- Community & moderation (from 003_RBAC_COMMUNITY_PASSWORD.sql)
-- --------------------------------------------------------------------------
-- community_posts (author_id, approved_by → users)
-- post_approvals, comments, likes
-- password_reset_requests, admin_notes
-- reports (flagged content queue)
-- activity_logs (signup, moderation, sub-admin, password reset)
-- roles, user_roles, profiles

-- --------------------------------------------------------------------------
-- Storage buckets (SUPABASE_STORAGE_POLICIES_RBAC.sql)
-- --------------------------------------------------------------------------
-- avatars (public read)
-- community-media (public read)
-- resumes (private; uploads via API service role)

-- --------------------------------------------------------------------------
-- Reports table (flag / moderation queue)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'thread', 'comment')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- PostgREST embed cheat sheet
-- --------------------------------------------------------------------------
-- community_posts author:  users!community_posts_author_id_fkey
-- community_posts approver: users!community_posts_approved_by_fkey
-- comments author:         users!comments_author_id_fkey
-- tasks alumni:            users!tasks_posted_by_fkey
-- reports reporter:        users!reports_reporter_id_fkey
-- reports resolver:        users!reports_resolved_by_fkey
-- post_approvals admin:    users!post_approvals_acted_by_fkey
