-- ============================================================
-- University Alumni Connect — COMPLETE SCHEMA (Fixed & Final)
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── ENUMS ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'alumni', 'student');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('pending', 'approved', 'rejected', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('open', 'approved', 'assigned', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE event_type AS ENUM ('alumni_meetup','seminar','workshop','get_together','career_fair','webinar','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE post_type AS ENUM ('discussion','question','opportunity','internship','job','announcement');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vote_type AS ENUM ('up', 'down');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── DEPARTMENTS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  faculty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── USERS ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  account_status account_status DEFAULT 'pending',
  profile_picture_url TEXT,
  phone TEXT,
  department_id UUID REFERENCES departments(id),
  registration_number TEXT UNIQUE NOT NULL,
  linkedin_url TEXT,
  short_bio TEXT,
  is_email_verified BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);

-- ── ALUMNI PROFILES ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alumni_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  batch TEXT NOT NULL,
  passing_year INTEGER NOT NULL,
  current_company TEXT,
  job_title TEXT,
  skills TEXT[] DEFAULT '{}',
  achievements JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── STUDENT PROFILES ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
  cgpa DECIMAL(3,2) CHECK (cgpa BETWEEN 0.0 AND 4.0),
  skills TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  github_url TEXT,
  resume_url TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TASKS ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  posted_by UUID REFERENCES users(id) ON DELETE CASCADE,
  required_skills TEXT[] DEFAULT '{}',
  deadline TIMESTAMPTZ NOT NULL,
  budget_stipend TEXT,
  team_size INTEGER DEFAULT 1,
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'open',
  attachments JSONB DEFAULT '[]',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_posted_by ON tasks(posted_by);
CREATE INDEX IF NOT EXISTS idx_tasks_skills ON tasks USING gin(required_skills);

-- ── TASK ASSIGNMENTS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','submitted','approved','revision_needed')),
  progress_notes TEXT,
  submission_url TEXT,
  submission_notes TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  UNIQUE(task_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_task ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON task_assignments(student_id);

-- ── COMMUNITY THREADS ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_type post_type DEFAULT 'discussion',
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  upvote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threads_author ON threads(author_id);
CREATE INDEX IF NOT EXISTS idx_threads_type ON threads(post_type);
CREATE INDEX IF NOT EXISTS idx_threads_created ON threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_tags ON threads USING gin(tags);

-- ── THREAD REPLIES ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS thread_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES thread_replies(id),
  upvote_count INTEGER DEFAULT 0,
  is_accepted_answer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_replies_thread ON thread_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_replies_author ON thread_replies(author_id);

-- ── THREAD VOTES ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS thread_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  direction vote_type NOT NULL DEFAULT 'up',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, thread_id)
);

-- ── EVENTS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_type event_type DEFAULT 'other',
  location TEXT,
  is_virtual BOOLEAN DEFAULT FALSE,
  virtual_link TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  max_attendees INTEGER,
  cover_image_url TEXT,
  created_by UUID REFERENCES users(id),
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(is_published);

-- ── EVENT RSVPs ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'attending' CHECK (status IN ('attending','maybe','not_attending')),
  rsvped_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user ON event_rsvps(user_id);

-- ── NOTIFICATIONS ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ── CONVERSATIONS & DIRECT MESSAGES ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conv ON direct_messages(conversation_id);

-- ── ACTIVITY LOG ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── FUNCTIONS ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_alumni_profiles_updated_at BEFORE UPDATE ON alumni_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON student_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION auto_increment_reply_count()
RETURNS TRIGGER AS $$
BEGIN UPDATE threads SET reply_count = reply_count + 1 WHERE id = NEW.thread_id; RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER on_reply_created AFTER INSERT ON thread_replies FOR EACH ROW EXECUTE FUNCTION auto_increment_reply_count();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION increment_reply_count(thread_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE threads SET reply_count = reply_count + 1 WHERE id = thread_id;
$$;

CREATE OR REPLACE FUNCTION increment_thread_votes(thread_id UUID, amount INTEGER)
RETURNS void LANGUAGE sql AS $$
  UPDATE threads SET upvote_count = upvote_count + amount WHERE id = thread_id;
$$;

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

-- ── ROW LEVEL SECURITY ─────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
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

DROP POLICY IF EXISTS "allow_all_users" ON users;
CREATE POLICY "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_alumni_profiles" ON alumni_profiles;
CREATE POLICY "allow_all_alumni_profiles" ON alumni_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_student_profiles" ON student_profiles;
CREATE POLICY "allow_all_student_profiles" ON student_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_tasks" ON tasks;
CREATE POLICY "allow_all_tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_task_assignments" ON task_assignments;
CREATE POLICY "allow_all_task_assignments" ON task_assignments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_threads" ON threads;
CREATE POLICY "allow_all_threads" ON threads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_replies" ON thread_replies;
CREATE POLICY "allow_all_replies" ON thread_replies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_votes" ON thread_votes;
CREATE POLICY "allow_all_votes" ON thread_votes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_events" ON events;
CREATE POLICY "allow_all_events" ON events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_rsvps" ON event_rsvps;
CREATE POLICY "allow_all_rsvps" ON event_rsvps FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_notifications" ON notifications;
CREATE POLICY "allow_all_notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_conversations" ON conversations;
CREATE POLICY "allow_all_conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_dm" ON direct_messages;
CREATE POLICY "allow_all_dm" ON direct_messages FOR ALL USING (true) WITH CHECK (true);

-- ── REALTIME ───────────────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE threads;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;