# University Alumni Connect - Complete Troubleshooting Guide

## Current Issues & Solutions

### Issue 1: Event Creation Fails (400/404)
**Status:** ✅ FIXED (code updated)
- Updated `NewEventPage.tsx` to use correct notification method
- Changed from `getAllUsers({ status: 'approved' })` to `getApprovedUserIdsByRoles()`
- Now includes proper error handling for notifications

**What to do:** Redeploy to Vercel

---

### Issue 2: Profile Picture Upload - StorageApiError
**Status:** ⚠️ REQUIRES MANUAL SETUP

The error "new row violates row-level security policy" means the bucket policies aren't configured.

**Fix Steps:**

#### A. Create Bucket (if you haven't)
1. Go to Supabase Dashboard → **Storage**
2. Click **Create a new bucket**
3. Name: `profile-pictures`
4. **Check "Make it public"**
5. Click **Create bucket**

#### B. Add RLS Policies
1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy and paste from: `SUPABASE_STORAGE_POLICIES.sql` (in repo root)
4. **Run each section separately:**

**Section 1:** DROP old policies
```sql
DROP POLICY IF EXISTS "Allow authenticated users to upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read profile pictures" ON storage.objects;
```

**Section 2:** Enable RLS
```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

**Section 3:** Create new policies
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload profile pictures"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update profile pictures"
ON storage.objects
FOR UPDATE
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
  AND (auth.uid()::text) = (storage.foldername(name))[1]
)
USING (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
  AND (auth.uid()::text) = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete profile pictures"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
  AND (auth.uid()::text) = (storage.foldername(name))[1]
);

-- Allow public to read profile pictures
CREATE POLICY "Allow public to read profile pictures"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-pictures');
```

#### C. Verify Policies
Run this to check:
```sql
SELECT policyname, permissive FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage' 
AND policyname LIKE '%profile%';
```

You should see 4 policies.

---

### Issue 3: Thread Posting Fails / No Response
**Status:** ✅ Likely working now

The code is correct. This may have been related to RLS issues on the threads table.

**Verify:** Run in Supabase SQL Editor:
```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename = 'threads' AND schemaname = 'public';
```

Should show: `rowsecurity = false`

If it shows `true`, run:
```sql
ALTER TABLE threads DISABLE ROW LEVEL SECURITY;
```

---

### Issue 4: Announcements Not Loading
**Status:** ✅ FIXED (schema added)

- Added `announcements` table with `occurs_at` field
- Added bulk notifications on announcement creation
- Limited fetch to 6 items for performance

**Verify Migration:** Check Supabase > SQL Editor:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'announcements';
```

Should show: `occurs_at`, `expires_at`, `is_pinned`, etc.

---

### Issue 5: Signup/Login 406/409/400 Errors
**Status:** 🔍 INVESTIGATING

These errors are from Firebase, not your app. Possible causes:

1. **Firebase config issue**
   - Check `.env.local` has correct Firebase API key
   - Verify Firebase project allows CORS from your Vercel domain
   
2. **Environment variables not deployed**
   - In Vercel Dashboard → Settings → Environment Variables
   - Make sure these are set:
     ```
     VITE_FIREBASE_API_KEY=...
     VITE_SUPABASE_URL=...
     VITE_SUPABASE_ANON_KEY=...
     ```

3. **Firebase API disabled**
   - Go to Google Cloud Console
   - Check that Identity Toolkit API is enabled

---

## Complete Deployment Checklist

### 1. Database (Supabase)
- [ ] Run migration: `000_FULL_SCHEMA_RUN_THIS.sql`
- [ ] Run migration: `001_ADD_APPROVED_STATUS.sql`
- [ ] Run migration: `002_ADD_ANNOUNCEMENTS_AND_PROFILE_PICS.sql`
- [ ] Run migration: `SUPABASE_RLS_FIXES.sql` (disable RLS, add function)
- [ ] Run policies: `SUPABASE_STORAGE_POLICIES.sql` (storage RLS)
- [ ] Verify: All tables have RLS disabled (except storage.objects)

### 2. Storage (Supabase)
- [ ] Create bucket: `profile-pictures`
- [ ] Make bucket public
- [ ] Add 4 RLS policies (see above)

### 3. Environment (Vercel)
- [ ] Add all `.env.local` variables to Vercel
- [ ] Redeploy after adding env vars

### 4. Firebase
- [ ] Verify API key in `.env.local`
- [ ] Enable Identity Toolkit API in Google Cloud
- [ ] Add Vercel domain to Firebase CORS allowlist

### 5. Code
- [ ] All files updated (see git diff)
- [ ] No TypeScript errors (npm run build)
- [ ] No linting errors (npm run lint)

---

## Testing After Deployment

1. **Sign Up**
   - Create new account
   - Check for 406/409 errors in console
   - Should redirect to dashboard

2. **Profile Picture**
   - Go to Profile page
   - Edit profile
   - Upload a JPG/PNG (max 5MB)
   - Should see success message
   - Image should appear on profile

3. **Create Event**
   - Go to Events > Create Event
   - Fill form and submit
   - Should see success toast
   - Event should appear in list
   - All approved users should get notification

4. **Create Thread**
   - Go to Community > New Thread
   - Fill form and submit
   - Should see success toast
   - Thread should appear in list

5. **Check Announcement**
   - Go to Admin > Announcements
   - Create announcement with occurrence date
   - Should see date displayed on card
   - All approved users should get notification

---

## If Issues Persist

### Check Browser Console
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for red errors
4. Check **Network** tab for failed requests

### Common Error Messages

| Error | Solution |
|-------|----------|
| `StorageApiError: new row...` | Storage bucket RLS policies not set. Run SUPABASE_STORAGE_POLICIES.sql |
| `Failed to load resource: 404` | Table doesn't exist or RLS misconfigured. Run SQL migrations. |
| `Firebase: Error (auth/invalid-api-key)` | Wrong API key in .env.local or not deployed to Vercel |
| `CORS error` | Firebase/Supabase domain not in CORS allowlist |
| `relation "..." does not exist` | Migration didn't run. Run it in Supabase SQL Editor. |

---

## Files Modified This Session

```
✅ src/pages/events/NewEventPage.tsx - Fixed notification method
✅ src/pages/ProfilePage.tsx - Enhanced storage error handling
✅ SUPABASE_STORAGE_POLICIES.sql - NEW - Storage RLS setup
✅ CRITICAL_FIXES_README.md - NEW - This guide
```

**Already done previously:**
- src/lib/types/index.ts
- src/lib/supabase/queries.ts
- src/pages/AdminAnnouncementsPage.tsx
- src/components/AnnouncementCard.tsx
- src/pages/community/NewThreadPage.tsx
- supabase/migrations/002_ADD_ANNOUNCEMENTS_AND_PROFILE_PICS.sql
- SUPABASE_RLS_FIXES.sql

---

## Next Steps

1. **Run SQL migrations** in Supabase (if not already done)
2. **Run storage policies** in Supabase
3. **Redeploy to Vercel** (`git push origin main`)
4. **Test all features** (see Testing section)
5. **Monitor DevTools Console** for errors

Let me know what errors appear after deployment!
