# Supabase Storage Setup for Profile Pictures

## Step 1: Create the Storage Bucket

**Via Supabase Dashboard:**

1. Go to your Supabase project dashboard
2. Click **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Name it: `profile-pictures`
5. Choose **Public** (to allow public reads)
6. Click **Create bucket**

---

## Step 2: Add Storage Policies

After creating the bucket, add Row Level Security (RLS) policies:

### Policy 1: Allow Authenticated Users to Upload to Their Own Folder

```sql
CREATE POLICY "Allow authenticated users to upload their own profile pictures"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 2: Allow Authenticated Users to Update Their Own Files

```sql
CREATE POLICY "Allow authenticated users to update their own profile pictures"
ON storage.objects
FOR UPDATE
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
USING (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 3: Allow Authenticated Users to Delete Their Own Files

```sql
CREATE POLICY "Allow authenticated users to delete their own profile pictures"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 4: Allow Public Read Access

```sql
CREATE POLICY "Allow public to read profile pictures"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-pictures');
```

---

## Step 3: Manual Setup (No SQL Needed)

If you prefer to set policies via the dashboard:

1. In **Storage** → **Buckets** → **profile-pictures**
2. Click the **Policies** tab
3. Click **New Policy** and add:
   - **For INSERT**: `Authenticated users can upload to their own folder`
   - **For UPDATE**: `Authenticated users can update their own files`
   - **For DELETE**: `Authenticated users can delete their own files`
   - **For SELECT**: `Everyone can read`

---

## File Path Structure

Files will be uploaded to: `profile-pictures/{user_id}/{timestamp}.{ext}`

Example: `profile-pictures/550e8400-e29b-41d4-a716-446655440000/1779213904234.jpg`

Public URL: `https://{project-id}.supabase.co/storage/v1/object/public/profile-pictures/{user_id}/{filename}`

---

## Testing

After setup, test upload in your app:
- Go to any user's profile
- Edit profile
- Upload a photo (max 5MB, PNG/JPG)
- Verify it appears in both dashboard and profile

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Upload fails with 403 | User must be authenticated; check token |
| File not visible | Check public URL format; verify bucket is public |
| Can't update/delete | Ensure file path matches user ID in policy |

