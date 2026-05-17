# Admin Task Approvals Page - Testing Guide

## How to Access the Page

1. **URL:** `http://localhost:5173/dashboard/admin/task-approvals`
2. **Navigation:** Dashboard → Task Approvals (in sidebar, admin only)
3. **Route Protection:** Must be logged in as super_admin

## What to Test

### 1. Page Load & Initial State
- [ ] Page loads without errors
- [ ] Displays "Task Approvals" header
- [ ] Shows pending approval count
- [ ] Loading skeletons appear briefly
- [ ] Data loads from database

### 2. Empty State
- [ ] When no pending approvals: shows "All caught up!" message
- [ ] CheckCircle icon displays
- [ ] Message is readable

### 3. Approval Cards Display
- [ ] Each approval shows in a card
- [ ] Alumni avatar with initials displays
- [ ] Task title is visible
- [ ] Alumni name and email show
- [ ] Priority badge shows with correct color:
  - 🔴 Red for Urgent
  - 🟠 Orange for High
  - 🟡 Yellow for Medium
  - 🟢 Green for Low

### 4. Task Details in Card
- [ ] Task description preview (truncated)
- [ ] Team size displays correctly
- [ ] Deadline shows formatted date (MMM dd, yyyy)
- [ ] Budget/stipend shows if available
- [ ] Submission time shows as relative time (e.g., "2 hours ago")
- [ ] Required skills display as tags
- [ ] Red warning appears if deadline is past

### 5. Action Buttons
- [ ] "Approve" button is visible and clickable
- [ ] "Reject" button is visible and clickable
- [ ] Buttons are touch-friendly (proper height on mobile)
- [ ] Both buttons work on responsive sizes

### 6. Approve Modal
Click "Approve" button:
- [ ] Modal opens
- [ ] Task summary displays correctly
- [ ] "Approval Notes (Optional)" label shows
- [ ] Notes textarea is present
- [ ] Can type in notes field
- [ ] "Approve Task" button is active
- [ ] "Cancel" button closes modal
- [ ] No validation required for approval

### 7. Reject Modal
Click "Reject" button:
- [ ] Modal opens
- [ ] Task summary displays correctly
- [ ] "Rejection Feedback (Required)" label shows
- [ ] Notes textarea is present
- [ ] "Reject Task" button is disabled initially
- [ ] After typing notes: button becomes enabled
- [ ] "Feedback is important" message appears below textarea
- [ ] Can close with Cancel button

### 8. Deadline Warning
- [ ] If task deadline has passed:
  - Red warning box appears in card: "Deadline has passed"
  - Red warning box appears in modal
  - Message is readable

### 9. Approval Process
Complete an approval:
- [ ] Fill notes (optional)
- [ ] Click "Approve Task"
- [ ] Button shows "Processing..."
- [ ] Modal closes
- [ ] Success toast appears: "Task approved successfully"
- [ ] Card disappears from list
- [ ] Approval count decreases by 1

### 10. Rejection Process
Complete a rejection:
- [ ] Fill rejection notes (required)
- [ ] Click "Reject Task"
- [ ] Button shows "Processing..."
- [ ] Modal closes
- [ ] Success toast appears: "Task rejected successfully"
- [ ] Card disappears from list
- [ ] Approval count decreases by 1

### 11. Error Handling
- [ ] If network error: toast shows "Failed to process approval"
- [ ] Modal remains open for retry
- [ ] Errors are logged to console

### 12. Mobile Responsiveness
On mobile device (or DevTools):
- [ ] Cards stack in 1 column
- [ ] Text is readable at mobile size
- [ ] Buttons are touch-friendly (min-height: 48px)
- [ ] Modal is bottom sheet on mobile
- [ ] Modal is full-screen width with padding
- [ ] Can scroll content if modal is too tall
- [ ] Close button (X) is accessible

### 13. Tablet Responsiveness
On tablet (or DevTools):
- [ ] Cards may show 1-2 columns depending on size
- [ ] Spacing looks balanced
- [ ] All elements are proportional

### 14. Desktop Layout
On desktop (or DevTools):
- [ ] Cards display in 2-column grid
- [ ] Gap between cards is visible
- [ ] Modal is centered with appropriate width
- [ ] All text is clearly readable

### 15. Dark Mode
- [ ] Toggle dark mode (click theme icon)
- [ ] Background colors adjust properly
- [ ] Text remains readable
- [ ] Cards have dark background
- [ ] Modal has dark background
- [ ] Icons are visible in dark mode
- [ ] Borders have appropriate contrast

### 16. Notifications
After approving/rejecting:
- [ ] Alumni receives notification
- [ ] Notification includes task title
- [ ] Rejection notifications include notes
- [ ] Notification has link to task

### 17. Navigation
- [ ] Can navigate to page from sidebar
- [ ] Sidebar item is visible for admin users
- [ ] Route is protected (can't access as non-admin)

### 18. Loading States
- [ ] First load shows 3 skeleton cards
- [ ] After data loads, skeletons disappear
- [ ] Skeleton cards have proper height

### 19. Edge Cases
- [ ] Task with no description still displays card
- [ ] Task with very long title is truncated
- [ ] Task with no skills doesn't show empty skills section
- [ ] Alumni with no email shows gracefully
- [ ] Very old dates show as relative time

## Database Requirements

Ensure your Supabase database has:
1. `task_approvals` table with:
   - id (UUID)
   - task_id (UUID, foreign key to tasks)
   - admin_id (UUID, foreign key to users)
   - status (pending/approved/rejected)
   - notes (text, nullable)
   - created_at (timestamp)
   - approved_at (timestamp, nullable)

2. `tasks` table with:
   - id, title, description, posted_by
   - required_skills, deadline, budget_stipend
   - team_size, priority

3. `users` table with:
   - id, full_name, email, profile_picture_url

## Sample Data for Testing

If database is empty, create test data:

```sql
-- Insert test alumni
INSERT INTO users (id, full_name, email, role, account_status, registration_number)
VALUES ('alumni-1', 'John Doe', 'john@example.com', 'alumni', 'approved', 'ALM001');

-- Insert test task
INSERT INTO tasks (id, title, description, posted_by, required_skills, deadline, budget_stipend, team_size, priority, status)
VALUES (
  'task-1',
  'Website Redesign Project',
  'Need help redesigning our company website with modern UI/UX',
  'alumni-1',
  '["React", "Tailwind", "Figma"]',
  '2024-12-31',
  '₹50,000',
  2,
  'high',
  'pending'
);

-- Insert test approval
INSERT INTO task_approvals (task_id, admin_id, status)
VALUES ('task-1', 'admin-user-id', 'pending');
```

## Performance Testing

- [ ] Page loads in < 2 seconds
- [ ] Approval/rejection completes in < 1 second
- [ ] No console errors or warnings
- [ ] Memory usage is reasonable
- [ ] No unnecessary re-renders

## Accessibility Testing

- [ ] All buttons are keyboard accessible
- [ ] Tab order is logical
- [ ] Modal can be closed with Escape key
- [ ] Color contrast meets WCAG standards
- [ ] Text sizes are appropriate

## Known Limitations

1. Only shows pending approvals (not approved/rejected history)
2. No bulk approval/rejection yet
3. No search or filtering
4. No approval deadline reminders
5. Limited to 1 batch of approvals per session (reload needed for new data)

## Success Criteria

✅ Page displays and functions correctly
✅ All CRUD operations work
✅ Mobile responsive
✅ Dark mode works
✅ Error handling is graceful
✅ Notifications sent to alumni
✅ Route is protected
✅ No TypeScript errors
✅ No console errors
✅ Performance is acceptable
