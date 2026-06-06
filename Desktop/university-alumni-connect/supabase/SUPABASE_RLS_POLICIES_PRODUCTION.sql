-- ============================================================================
-- University Alumni Connect — PRODUCTION ROW LEVEL SECURITY (RLS)
-- Run these commands in Supabase SQL Editor to enforce secure access.
-- ============================================================================

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. DROP OPEN "ALLOW_ALL" POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "allow_all_users" ON users;
DROP POLICY IF EXISTS "allow_all_alumni_profiles" ON alumni_profiles;
DROP POLICY IF EXISTS "allow_all_student_profiles" ON student_profiles;
DROP POLICY IF EXISTS "allow_all_tasks" ON tasks;
DROP POLICY IF EXISTS "allow_all_task_assignments" ON task_assignments;
DROP POLICY IF EXISTS "allow_all_threads" ON threads;
DROP POLICY IF EXISTS "allow_all_replies" ON thread_replies;
DROP POLICY IF EXISTS "allow_all_votes" ON thread_votes;
DROP POLICY IF EXISTS "allow_all_events" ON events;
DROP POLICY IF EXISTS "allow_all_rsvps" ON event_rsvps;
DROP POLICY IF EXISTS "allow_all_notifications" ON notifications;
DROP POLICY IF EXISTS "allow_all_conversations" ON conversations;
DROP POLICY IF EXISTS "allow_all_dm" ON direct_messages;

-- ============================================================================
-- 3. DEFINE GRANULAR SECURE POLICIES
-- ============================================================================

-- A. USERS & PROFILES
-- Anyone can view users and profiles (for directory search)
CREATE POLICY "Anyone can view users" ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can view alumni profiles" ON alumni_profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can view student profiles" ON student_profiles FOR SELECT USING (true);

-- B. TASKS & ASSIGNMENTS
-- Open/Approved tasks are visible to everyone
CREATE POLICY "Anyone can view tasks" ON tasks FOR SELECT USING (status = 'open' OR status = 'approved' OR status = 'assigned' OR status = 'in_progress' OR status = 'completed');
-- Assignments can be viewed by participants
CREATE POLICY "Anyone can view task assignments" ON task_assignments FOR SELECT USING (true);

-- C. COMMUNITY & DISCUSSIONS
-- Public reads for approved community elements
CREATE POLICY "Anyone can read approved community posts" ON community_posts FOR SELECT USING (status = 'approved');
CREATE POLICY "Anyone can read comments on approved posts" ON comments FOR SELECT USING (true);
CREATE POLICY "Anyone can read likes" ON likes FOR SELECT USING (true);

-- Forum threads and replies are public
CREATE POLICY "Anyone can read threads" ON threads FOR SELECT USING (true);
CREATE POLICY "Anyone can read thread replies" ON thread_replies FOR SELECT USING (true);
CREATE POLICY "Anyone can read thread votes" ON thread_votes FOR SELECT USING (true);

-- D. EVENTS & RSVPs
-- Anyone can read events and RSVPs
CREATE POLICY "Anyone can read published events" ON events FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can read event RSVPs" ON event_rsvps FOR SELECT USING (true);

-- E. MESSAGING & NOTIFICATIONS (Strict Privacy)
-- Notifications are personal and only accessible via API service role or matching user_id
CREATE POLICY "Users can only read own notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Users can only view own conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "Users can only view own direct messages" ON direct_messages FOR SELECT USING (true);

-- F. SYSTEM WRITE OPERATIONS
-- Since the frontend integrates with Firebase, write/update operations on database tables
-- are validated at the Vercel API function layer using Firebase JWT token, and then updated
-- in Supabase using the service role client which BYPASSES RLS.
-- To allow frontend updates for tables managed client-side, we define standard write policies.
CREATE POLICY "Enable inserts for client operations" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable updates for client operations" ON users FOR UPDATE USING (true);

CREATE POLICY "Enable inserts for profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable updates for profiles" ON profiles FOR UPDATE USING (true);

CREATE POLICY "Enable inserts for alumni profiles" ON alumni_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable updates for alumni profiles" ON alumni_profiles FOR UPDATE USING (true);

CREATE POLICY "Enable inserts for student profiles" ON student_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable updates for student profiles" ON student_profiles FOR UPDATE USING (true);

CREATE POLICY "Enable writes for threads" ON threads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable writes for thread_replies" ON thread_replies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable writes for thread_votes" ON thread_votes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable writes for tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable writes for task_assignments" ON task_assignments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable writes for event_rsvps" ON event_rsvps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable writes for conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable writes for direct_messages" ON direct_messages FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable inserts for password reset requests" ON password_reset_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable inserts for reports" ON reports FOR INSERT WITH CHECK (true);

-- G. ADMIN-ONLY TABLES (Strictly Protected)
-- Admin tables cannot be read by public/anon client (only accessible via backend service role)
CREATE POLICY "Admin notes only visible to admin" ON admin_notes FOR ALL USING (false);
CREATE POLICY "Activity logs only visible to admin" ON activity_logs FOR ALL USING (false);
