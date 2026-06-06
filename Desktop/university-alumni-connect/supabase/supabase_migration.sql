-- ============================================================
-- Migration: Add department, session, phone fields + update
-- registration_number to be nullable (for alumni)
-- ============================================================

-- 1. Make registration_number nullable (alumni may not have one)
ALTER TABLE users
  ALTER COLUMN registration_number DROP NOT NULL;

-- 2. Add phone column to users if not exists
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. Ensure departments table has a code column (for MCS, BSCS, BSSE, BSTN)
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS code TEXT;

-- Insert the 4 required departments if they don't already exist
INSERT INTO departments (name, code)
VALUES
  ('Master of Computer Science', 'MCS'),
  ('Bachelor of Computer Science', 'BSCS'),
  ('Bachelor of Software Engineering', 'BSSE'),
  ('Bachelor of Telecommunication & Networking', 'BSTN')
ON CONFLICT (code) DO NOTHING;

-- 4. Add session column to profiles table (replaces batch for session range like "2018-2022")
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS session TEXT;

-- 5. Update profiles.batch to also accept session strings if you want to keep backward compat
-- (batch column is kept; session is the new "2018-2022" style field)

-- 6. Add phone to profiles if not present
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Done
