# Critical Fixes for Event/Thread/Storage Issues

After deployment, three critical issues need to be fixed:

## Issue 1: Event & Thread Creation 404 Errors

The code references incorrect query methods. Already fixed in:
- `src/pages/events/NewEventPage.tsx` - Changed to use `getApprovedUserIdsByRoles()`
- `src/pages/ProfilePage.tsx` - Enhanced error handling for storage uploads

## Issue 2: Profile Picture Upload - StorageApiError

The storage RLS policies need to be configured correctly. Follow these steps:

### Step A: Create Storage Bucket (if not done)

1. Go to **Storage** in Supabase Dashboard
2. Click **Create a new bucket**
3. Name: `profile-pictures`
4. Choose **Public** (check the "Make it public" option)
5. Click **Create bucket**

### Step B: Run Storage Policies SQL

1. Go to **SQL Editor** in Supabase
2. Create a **New Query**
3. Copy the entire contents of `SUPABASE_STORAGE_POLICIES.sql` (from this repo)
4. Run it step by step:
   - First run: `DROP POLICY` statements
   - Second run: `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`
   - Third run: All `CREATE POLICY` statements
5. Verify: Run the verification queries at the bottom

### Step C: Test Upload

After policies are set, test in the app:
1. Go to your **Profile** page
2. Click "Edit Profile"
3. Upload a profile picture (JPG/PNG, max 5MB)
4. Save changes

## Issue 3: Verify RLS on Tables

Make sure all tables have RLS disabled (run in SQL Editor):

```sql
-- Check RLS status
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'threads', 
  'thread_replies', 
  'events', 
  'announcements',
  'conversations', 
  'direct_messages'
)
ORDER BY tablename;
```

All should show `rowsecurity = false`

If any show `true`, run:
```sql
ALTER TABLE [table_name] DISABLE ROW LEVEL SECURITY;
```

## After These Fixes:

1. **Rebuild and Deploy to Vercel**
   ```bash
   npm run build
   git push origin main
   ```

2. **Test in Production:**
   - Sign up and log in
   - Create a new thread
   - Create a new event (as admin)
   - Upload profile picture
   - Verify notifications are sent

3. **Monitor Browser Console**
   - Look for any errors in DevTools > Console
   - Check Network tab for any 404/500 errors
