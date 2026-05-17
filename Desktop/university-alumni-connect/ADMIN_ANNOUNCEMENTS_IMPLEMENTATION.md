# Admin Announcements Page Implementation Documentation

## Overview
The Admin Announcements Page provides super_admin users with a comprehensive interface to manage announcements across the University Alumni Connect platform. It includes full CRUD operations, priority management, pinning, and expiry date support.

## File Location
- **Main Component**: `/src/pages/AdminAnnouncementsPage.tsx`
- **Route**: `/dashboard/admin/announcements`
- **Access**: Super Admin only (role: `super_admin`)

## Features

### 1. Display All Announcements
The page shows all announcements in a card-based layout with:
- **Pinned First**: Announcements with `is_pinned=true` appear at the top
- **Announcement Cards**: Each card displays:
  - Title with line clamping
  - Content preview (line clamped to 3 lines)
  - Priority badge (Low/Medium/High with color coding)
  - Expiry status badge (if expired)
  - Creator information and timestamps
  - Pin status indicator

### 2. Create New Announcements
The form includes the following fields:

#### Required Fields
- **Title** (3-200 characters)
  - Validation: Zod schema with min/max length checks
  - Error messages displayed inline
  
- **Content** (10-5000 characters)
  - Textarea with auto-sizing
  - Validation: Zod schema with min/max length checks
  - Error messages displayed inline

- **Priority** (low/medium/high)
  - Dropdown select
  - Validation: Enum validation via Zod
  - Color-coded options

#### Optional Fields
- **Expires At** (datetime-local input)
  - Converted to ISO string for storage
  - If not provided, announcement never expires
  
- **Pin Toggle** (checkbox)
  - Boolean field
  - Visual indicator (pin icon) when enabled
  - Pinned announcements appear first in the list

### 3. Edit Existing Announcements
- Click the **Edit** button on any announcement card
- Form pre-populates with existing data
- Tab switches to "Create New" (shows "Edit" in button)
- All fields can be modified
- Updated timestamp automatically set by Supabase

### 4. Delete Announcements
- Click the **Delete** button on any announcement card
- Confirmation modal appears with:
  - Warning icon and title
  - Announcement title shown for confirmation
  - Cancel/Confirm buttons
- Deleted announcements removed from list
- Success toast notification

### 5. Pin/Unpin Announcements
- Click the **Pin** or **Unpin** icon on any card
- Instant toggle of pin status
- Pinned announcements move to top of list
- Visual styling (blue background) for pinned items
- Blue highlight border for pinned announcements

### 6. Priority Levels
Three priority levels with distinct styling:
- **Low** (Blue): `bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300`
- **Medium** (Amber): `bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300`
- **High** (Red): `bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300`

### 7. Expiry Dates
- Optional field using datetime-local HTML5 input
- Converts to ISO timestamp for storage
- Shows "Expired" badge on announcements past their expiry time
- Admin view includes expired announcements for reference
- User-facing announcements automatically filtered by announcementQueries

## Component Structure

### Main Components

#### PriorityBadge
Displays colored priority indicators
```tsx
function PriorityBadge({ priority }: { priority: AnnouncementPriority })
```

#### AnnouncementForm
Handles create and edit operations
```tsx
function AnnouncementForm({
  onSubmit,
  onCancel,
  isLoading,
  editingAnnouncement,
})
```
- Uses `react-hook-form` with Zod validation
- Pre-populates when editing
- Loading state during submission

#### AnnouncementCard
Displays individual announcement with actions
```tsx
function AnnouncementCard({
  announcement,
  onEdit,
  onDelete,
  onPin,
})
```
- Responsive layout
- Actions: Edit, Delete, Pin/Unpin
- Expired badge display

#### DeleteConfirmationModal
Confirmation dialog before deletion
```tsx
function DeleteConfirmationModal({
  isOpen,
  announcementTitle,
  onConfirm,
  onCancel,
  isLoading,
})
```

#### AdminAnnouncementsPage
Main page component
```tsx
export function AdminAnnouncementsPage()
```
- Manages page state
- Handles CRUD operations
- Access control and role verification

## State Management

### Page State
```typescript
- announcements: Announcement[] // All announcements
- isLoading: boolean             // Initial fetch loading
- isSaving: boolean              // Operation in progress
- activeTab: 'view' | 'create'   // Active tab
- editingAnnouncement: Announcement | null // Currently edited
- deleteConfirm: {               // Delete confirmation state
    isOpen: boolean
    id: string
    title: string
  }
```

## API Integration

### Supabase Queries Used
All operations use `announcementQueries` from `/src/lib/supabase/queries`:

1. **getAnnouncements(includeExpired: boolean)**
   - Fetches all announcements
   - `includeExpired=true` for admin view
   - Returns announcements ordered by pin status, then creation date

2. **getAnnouncementById(id: string)**
   - Fetches single announcement (if needed)

3. **createAnnouncement(data: Partial<Announcement>)**
   - Creates new announcement
   - Requires: admin_id, title, content, priority
   - Optional: is_pinned, expires_at

4. **updateAnnouncement(id: string, updates: Partial<Announcement>)**
   - Updates existing announcement
   - Automatically updates `updated_at` timestamp

5. **deleteAnnouncement(id: string)**
   - Deletes announcement by ID

6. **togglePin(id: string, isPinned: boolean)**
   - Toggles pin status
   - Wrapper around updateAnnouncement

## Data Types

### Announcement Type
```typescript
interface Announcement {
  id: string
  admin_id: string
  title: string
  content: string
  priority: AnnouncementPriority
  is_pinned: boolean
  expires_at?: string
  created_at: string
  updated_at: string
  admin?: User
}

type AnnouncementPriority = 'low' | 'medium' | 'high'
```

### AnnouncementForm Type
```typescript
interface AnnouncementForm {
  title: string
  content: string
  priority: AnnouncementPriority
  is_pinned: boolean
  expires_at?: string
}
```

## Validation

### Zod Schema
```typescript
const announcementFormSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(5000, 'Content must be less than 5000 characters'),
  priority: z.enum(['low', 'medium', 'high']),
  is_pinned: z.boolean().default(false),
  expires_at: z.string().optional().or(z.literal('')),
})
```

## Responsive Design

### Breakpoints
- **Mobile** (< 640px)
  - Single column layout
  - Full-width inputs and buttons
  - Stacked form elements
  
- **Tablet** (640px - 1024px)
  - 2-column card grid
  - Inline form elements
  
- **Desktop** (> 1024px)
  - 4-column card grid
  - Optimal spacing

### Touch Targets
- All buttons: minimum 44px × 44px
- Interactive elements: 32px minimum

## Dark Mode Support

### Color Scheme
- **Background**: `bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800`
- **Cards**: `bg-card dark:bg-slate-800`
- **Text**: `text-gray-900 dark:text-white`
- **Borders**: `border-border` (inherits from CSS variables)
- **Inputs**: `bg-background dark:bg-slate-700`

### Dark Mode Classes
All elements use Tailwind's `dark:` prefix for dark mode variants

## Accessibility Features

1. **Semantic HTML**
   - Proper heading hierarchy
   - Label elements for form inputs
   - Button type specifications

2. **Color Contrast**
   - WCAG AA compliance for all text
   - Priority badges have sufficient contrast

3. **Touch Targets**
   - Minimum 44px × 44px for mobile
   - Adequate spacing between interactive elements

4. **Loading States**
   - Spinner icon for operations
   - Disabled buttons during submission
   - Clear visual feedback

5. **Error Handling**
   - Inline error messages for validation
   - Toast notifications for operations
   - Confirmation dialogs for destructive actions

## User Flow

### Creating an Announcement
1. Navigate to `/dashboard/admin/announcements`
2. Click "Create New" tab or button
3. Fill in form fields (title, content, priority)
4. Optionally set expiry date and pin status
5. Click "Create" button
6. Toast success, form clears
7. Auto-switch to "View All" tab
8. New announcement appears in list (pinned if applicable)

### Editing an Announcement
1. In "View All" tab, click Edit button on any card
2. Form pre-populates with existing data
3. Tab switches to "Create New" (button shows "Update")
4. Modify fields as needed
5. Click "Update" button
6. Toast success
7. Return to "View All" tab
8. Updated announcement reflects changes

### Deleting an Announcement
1. In "View All" tab, click Delete button on any card
2. Confirmation modal appears
3. Review announcement title
4. Click "Delete" to confirm or "Cancel"
5. Announcement removed from list
6. Toast success notification

### Pinning/Unpinning
1. In "View All" tab, click pin/unpin icon on any card
2. Pin status toggles instantly
3. Pinned announcements move to top
4. Toast notification

## Error Handling

### Toast Notifications
- **Success**: "Announcement created!", "Announcement updated!", etc.
- **Error**: "Failed to load announcements", "Failed to save announcement", etc.
- **Access Denied**: "Access denied. Admin only."

### UI State Management
- Loading spinner during fetch
- Disabled buttons during submission
- Error messages in form validation
- Fallback UI for empty state

## Performance Considerations

1. **Lazy Loading**: Page component lazy-loaded in App.tsx
2. **Form Optimization**: react-hook-form for efficient re-renders
3. **Date Formatting**: date-fns for efficient date operations
4. **Conditional Rendering**: Components render only when needed
5. **Image Optimization**: User avatars use native `loading="lazy"`

## Security Features

1. **Role-Based Access Control**: Route protected with `super_admin` role
2. **Client-Side Validation**: Zod schema validation
3. **Server-Side Protection**: RLS policies in Supabase database
4. **Confirmation Dialogs**: Prevents accidental deletions
5. **Auth Check**: Verifies user role on page load

## Integration Points

### With Supabase
- Uses `announcementQueries` from `/src/lib/supabase/queries`
- Automatic timestamp management
- RLS policies enforce admin-only access

### With Auth System
- Uses `useAuthStore` for user information
- Checks `dbUser?.role === 'super_admin'`
- Auto-redirect if not authorized

### With Styling
- Tailwind CSS for all styling
- Uses CSS variables for theming
- Dark mode support via document class

### With Navigation
- Added to DashboardLayout `NAV_ITEMS`
- Route in App.tsx with ProtectedRoute
- Accessible from admin sidebar

## Future Enhancements

1. **Bulk Operations**
   - Multi-select announcements
   - Bulk delete, bulk pin/unpin

2. **Filtering & Sorting**
   - Filter by priority, status, author
   - Sort by date, priority, name

3. **Search**
   - Full-text search of announcements
   - Search by title or content

4. **Templates**
   - Save announcement templates
   - Reuse common announcements

5. **Scheduling**
   - Schedule announcements for future publish
   - Schedule auto-expiry

6. **Analytics**
   - Track announcement views
   - Show engagement metrics

7. **Rich Text Editor**
   - WYSIWYG editor for content
   - Support for formatting and media

## Troubleshooting

### Page Won't Load
- Check user is logged in as super_admin
- Verify route is `/dashboard/admin/announcements`
- Check browser console for errors

### Form Won't Submit
- Verify all required fields are filled
- Check field lengths meet validation requirements
- Look for validation error messages on form

### Announcements Not Updating
- Verify Supabase connection
- Check RLS policies allow admin operations
- Review browser console for network errors

### Dark Mode Not Working
- Check `localStorage` for `theme` key
- Verify document has `dark` class
- Check Tailwind dark mode configuration

## Testing

See `ADMIN_ANNOUNCEMENTS_TEST_PLAN.md` for comprehensive testing guide.

## Dependencies

### Required Packages
- `react`: UI framework
- `react-router-dom`: Routing
- `react-hook-form`: Form management
- `zod`: Schema validation
- `@hookform/resolvers`: Hook form validation integration
- `@supabase/supabase-js`: Database client
- `lucide-react`: Icons
- `date-fns`: Date formatting
- `react-hot-toast`: Notifications
- `tailwindcss`: Styling

## Related Files

1. `/src/App.tsx` - Route definition
2. `/src/components/layout/DashboardLayout.tsx` - Navigation
3. `/src/lib/supabase/queries.ts` - announcementQueries
4. `/src/lib/types/index.ts` - Type definitions
5. `/src/lib/stores/authStore.ts` - Auth state

## License
As per University Alumni Connect project license
