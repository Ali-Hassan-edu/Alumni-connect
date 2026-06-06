-- ============================================================
-- TASK APPROVAL & ANNOUNCEMENT SYSTEM SETUP
-- Execute this in Supabase SQL Editor
-- ============================================================

-- 1. Create task_approvals table
CREATE TABLE IF NOT EXISTS task_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(task_id)
);

-- 2. Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_pinned BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_task_approvals_status ON task_approvals(status);
CREATE INDEX IF NOT EXISTS idx_task_approvals_admin ON task_approvals(admin_id);
CREATE INDEX IF NOT EXISTS idx_announcements_admin ON announcements(admin_id);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned);

-- 3b. Add recommended skills to tasks (for admin suggestions)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS recommended_skills TEXT[];

-- 4. Enable RLS (if not already enabled)
ALTER TABLE task_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for task_approvals
-- Admin can view all approvals
CREATE POLICY "admin_view_approvals" ON task_approvals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Alumni can view their own task approvals
CREATE POLICY "alumni_view_own_approvals" ON task_approvals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN tasks t ON t.posted_by = u.id
      WHERE u.id = auth.uid()
      AND t.id = task_approvals.task_id
    )
  );

-- Admin can insert/update approvals
CREATE POLICY "admin_manage_approvals" ON task_approvals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- 6. RLS Policies for announcements
-- Everyone can view announcements
CREATE POLICY "public_view_announcements" ON announcements
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin can manage announcements
CREATE POLICY "admin_manage_announcements" ON announcements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- ============================================================
-- TASK STATUS UPDATES FOR NEW WORKFLOW
-- ============================================================

-- When an alumni creates a task, set status to 'pending' instead of 'open'
-- Update existing tasks if needed (optional):
-- UPDATE tasks SET status = 'pending' WHERE status = 'open' AND posted_by IN (SELECT id FROM users WHERE role = 'alumni');

-- ============================================================
-- NOTES
-- ============================================================
-- After running this script:
-- 1. Alumni tasks will start with status 'pending'
-- 2. Admin must approve before tasks are visible to students
-- 3. Approvals are tracked in task_approvals table
-- 4. Announcements can be created and managed by admins
-- 5. All data is properly RLS-protected
