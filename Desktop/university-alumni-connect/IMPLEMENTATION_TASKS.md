# Alumni-Connect Implementation Tasks

## Phase 1: Critical Security & Safety Fixes
- [x] Fix Row Level Security (RLS) policies for all major tables
- [x] Create a React Error Boundary component and wrap the app
- [x] Add secure size & type checks to upload endpoints

## Phase 2: Missing Admin Features
- [x] Implement Sub-Admin Management UI (Super Admin can view, create, and demote sub-admins) in Admin Dashboard
- [x] Add Report/Flag post database schema and moderation queue UI (`/dashboard/admin/reports`)
- [x] Support Super Admin content deletion UI for posts and threads

## Phase 3: Community System Completion
- [x] Implement Community Post Detail Page (full post, comments, like, share dropdown, flag)
- [x] Add Moderation History tab in `AdminPostModerationPage`
- [x] Wire up pending post creation from Community page (`/community/new` → API)

## Phase 4: Landing Page & UX Polish
- [x] Add "Community" to Navbar for public browsing
- [x] Implement Load More button for community preview on Landing Page
- [x] Add scroll entrance animations (CSS `scroll-reveal`)
- [x] Inject proper SEO meta tags dynamically
- [x] Add success animation / custom Snackbar on successful signup

## Phase 5: Notification Triggers
- [x] Hook up notification insertion inside community post approval/rejection services
- [x] Hook up notification insertion when a student's password reset is resolved by admin
- [x] Hook up notifications for new comments and likes on community posts

## Phase 6: Storage & Activity Logging
- [x] Implement Storage policies for `resumes` and `community-media` buckets (`SUPABASE_STORAGE_POLICIES_RBAC.sql`)
- [x] Log key system actions into `activity_logs` (signup, password reset request, post moderation, sub-admin created/demoted)

## Console fix (PGRST201)
- [x] Disambiguate `community_posts` → `users` joins using `!community_posts_author_id_fkey` in queries and API routes
