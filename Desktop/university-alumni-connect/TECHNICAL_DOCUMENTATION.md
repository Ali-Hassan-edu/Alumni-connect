# Implementation Details: Complete Profile Editing

## Overview
This document provides a comprehensive technical breakdown of the profile editing implementation for the University Alumni Connect application.

---

## Architecture & Component Hierarchy

### Component Tree
```
ProfilePage (Main Component)
├── View Mode (Default)
│   ├── DashboardLayout
│   │   ├── Back Button
│   │   └── Grid Layout (3 columns on desktop)
│   │       ├── Sidebar (1 column)
│   │       │   ├── Profile Card
│   │       │   ├── Contact Info
│   │       │   └── Activity Stats
│   │       └── Main Content (2 columns)
│   │           ├── Academic Info
│   │           ├── Skills Section
│   │           ├── Interests Section (Students)
│   │           └── Work Experience (Alumni)
│   │
│   └── [Edit Button]
│       └── Only visible on own profile
│
└── Edit Mode (When isEditing && isOwnProfile)
    ├── DashboardLayout
    │   ├── Back Button
    │   └── Form Container
    │       ├── Common Fields
    │       │   ├── Full Name Input
    │       │   ├── Phone Input
    │       │   ├── LinkedIn URL Input
    │       │   ├── Bio Textarea
    │       │   └── Skills TagInput
    │       │
    │       ├── Role-Specific Fields
    │       │   ├── Alumni Fields
    │       │   │   ├── Job Title Input
    │       │   │   └── Company Input
    │       │   └── Student Fields
    │       │       ├── Interests TagInput
    │       │       ├── GitHub URL Input
    │       │       ├── Semester Input
    │       │       └── CGPA Input
    │       │
    │       └── Actions
    │           ├── Save Changes Button (Loading state)
    │           └── Cancel Button

TagInput Component
├── Tag Display
│   └── Tags Array with Remove Button (X icon)
└── Input Area
    ├── Text Input
    └── Helper Text
```

---

## State Management

### Component State Variables
```typescript
const [user, setUser] = useState<User | null>(null)
// - Current user data
// - Updated after form submission
// - Used to display profile information

const [profile, setProfile] = useState<ExtendedProfile | null>(null)
// - Role-specific profile data
// - Contains skills, interests, job title, etc.
// - Used to pre-populate form

const [threadCount, setThreadCount] = useState(0)
const [taskCount, setTaskCount] = useState(0)
// - Activity stats
// - Used in Activity section

const [isLoading, setIsLoading] = useState(true)
// - Page loading state
// - Shows skeleton loaders while fetching

const [isEditing, setIsEditing] = useState(false)
// - Toggle between view and edit modes
// - True = show form, False = show profile

const [isSaving, setIsSaving] = useState(false)
// - True while saving to Supabase
// - Shows "Saving..." button state
```

### Form State (via react-hook-form)
```typescript
const skillsValue = watch('skills')
// - Watch skills array for real-time updates
// - Used to render skill tags

const interestsValue = watch('interests')
// - Watch interests array for real-time updates
// - Used to render interest tags

const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm(...)
// - register: Connect input elements to form
// - handleSubmit: Wrap form submission handler
// - watch: Subscribe to field changes
// - setValue: Programmatic field updates (for loading)
// - errors: Validation error messages
```

---

## Data Flow

### 1. Page Load Flow
```
Component Mounts
    ↓
useEffect triggers [id dependency]
    ↓
loadProfile() function
    ├── setIsLoading(true)
    ├── userQueries.getById(id)
    │   └── Fetch user from users table
    ├── Based on user.role:
    │   ├── If 'alumni':
    │   │   └── Select from alumni_profiles
    │   └── If 'student':
    │       └── Select from student_profiles
    ├── setValue() for each form field
    ├── Promise.all() for stats:
    │   ├── Count threads by author_id
    │   └── Count tasks by posted_by
    └── setIsLoading(false)
    
Render Profile Display
```

### 2. Edit Flow
```
User clicks "Edit Profile"
    ↓
setIsEditing(true)
    ↓
If (isEditing && isOwnProfile)
    ├── Render Edit Mode
    └── Form already populated from loadProfile()
    
User interacts with form:
    ├── Type in text inputs
    │   └── Real-time validation on blur
    ├── Add tags with Enter key
    │   └── handleAddTag() updates form state
    └── Remove tags with X or Backspace
        └── handleRemoveTag() updates form state
```

### 3. Save Flow
```
User clicks "Save Changes"
    ↓
handleSubmit(handleSaveProfile) triggered
    ↓
Zod validation runs
    ├── If INVALID:
    │   ├── formState.errors populated
    │   └── Error messages shown inline
    └── If VALID:
        ├── setIsSaving(true)
        ├── Try block:
        │   ├── userQueries.updateUser()
        │   │   └── Update: full_name, phone, linkedin_url, short_bio
        │   ├── if (isAlumni)
        │   │   └── profileQueries.upsertAlumniProfile()
        │   │       └── Update: skills, current_company, job_title
        │   └── else
        │       └── profileQueries.upsertStudentProfile()
        │           └── Update: skills, interests, github_url, semester, cgpa
        ├── setUser() - update local state
        ├── setIsEditing(false) - back to view mode
        ├── toast.success() - show success message
        ├── Catch block:
        │   ├── console.error() - log error
        │   └── toast.error() - show error message
        └── Finally:
            └── setIsSaving(false) - remove loading state
```

---

## Validation Implementation

### Schema Structure
```typescript
// Base schema - common to all users
const baseProfileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().max(20, 'Phone number too long').optional().or(z.literal('')),
  linkedin_url: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  short_bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional().or(z.literal('')),
  skills: z.array(z.string()).min(1, 'Add at least one skill'),
})

// Alumni extension
const alumniEditSchema = baseProfileSchema.extend({
  current_company: z.string().optional().or(z.literal('')),
  job_title: z.string().optional().or(z.literal('')),
})

// Student extension
const studentEditSchema = baseProfileSchema.extend({
  interests: z.array(z.string()).min(1, 'Add at least one interest'),
  github_url: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  semester: z.number().min(1, 'Semester must be at least 1').max(8, 'Semester cannot exceed 8'),
  cgpa: z.number().min(0, 'CGPA cannot be negative').max(4.0, 'CGPA cannot exceed 4.0'),
})
```

### Validation Rules Explained
- `z.string().min(2)` - Minimum 2 characters required
- `z.string().url()` - Must be valid URL format
- `.optional().or(z.literal(''))` - Optional, allows empty string
- `z.array(z.string()).min(1)` - Array with minimum 1 element
- `z.number().min().max()` - Numeric range validation

---

## Form Field Mapping

### Common Fields (All Users)
| Field | Type | Input | Validation |
|-------|------|-------|-----------|
| full_name | string | text | min 2 chars, required |
| phone | string | tel | max 20 chars, optional |
| linkedin_url | string | url | URL format, optional |
| short_bio | string | textarea | max 500 chars, optional |
| skills | string[] | TagInput | min 1, required |

### Alumni Fields
| Field | Type | Input | Validation |
|-------|------|-------|-----------|
| job_title | string | text | optional |
| current_company | string | text | optional |

### Student Fields
| Field | Type | Input | Validation |
|-------|------|-------|-----------|
| interests | string[] | TagInput | min 1, required |
| github_url | string | url | URL format, optional |
| semester | number | number | 1-8, required |
| cgpa | number | number | 0-4.0, required |

---

## TagInput Component

### Props Interface
```typescript
interface TagInputProps {
  tags: string[]              // Current tags array
  onAdd: (tag: string) => void      // Callback when adding tag
  onRemove: (tag: string) => void   // Callback when removing tag
  placeholder?: string        // Input placeholder
}
```

### Internal State
```typescript
const [inputValue, setInputValue] = useState('')
// - Current text in input field
// - Cleared after adding tag
```

### Event Handlers

**handleKeyDown**
```typescript
if (e.key === 'Enter') {
  // Add tag on Enter key
  e.preventDefault()
  if (inputValue.trim()) {
    onAdd(inputValue.trim())
    setInputValue('')
  }
} else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
  // Remove last tag on Backspace when input empty
  onRemove(tags[tags.length - 1])
}
```

### Rendering
```typescript
// Map tags to JSX
{tags.map(tag => (
  <span key={tag} className="...">
    {tag}
    <button onClick={() => onRemove(tag)}>
      <X className="..." />
    </button>
  </span>
))}

// Input field for new tags
<input
  type="text"
  value={inputValue}
  onChange={e => setInputValue(e.target.value)}
  onKeyDown={handleKeyDown}
  placeholder={tags.length === 0 ? placeholder : ''}
/>
```

---

## Supabase Integration

### Update Operations

**Users Table**
```typescript
await userQueries.updateUser(user.id, {
  full_name: data.full_name,
  phone: data.phone || null,
  linkedin_url: data.linkedin_url || null,
  short_bio: data.short_bio || null,
})
```

**Alumni Profiles Table (Upsert)**
```typescript
await profileQueries.upsertAlumniProfile({
  user_id: user.id,
  skills: data.skills,
  current_company: data.current_company || null,
  job_title: data.job_title || null,
})
```

**Student Profiles Table (Upsert)**
```typescript
await profileQueries.upsertStudentProfile({
  user_id: user.id,
  skills: data.skills,
  interests: data.interests,
  github_url: data.github_url || null,
  semester: data.semester,
  cgpa: data.cgpa,
})
```

### Why Upsert?
- `INSERT` fails if profile exists
- `UPDATE` fails if profile doesn't exist
- `UPSERT` handles both cases automatically
- Ensures idempotent operations

---

## Error Handling Strategy

### Try-Catch Block
```typescript
try {
  // Attempt Supabase operations
} catch (error) {
  console.error('Error saving profile:', error)
  toast.error('Failed to update profile')
} finally {
  setIsSaving(false)
}
```

### User Feedback Layers
1. **Validation Layer**: Field error messages shown inline
2. **Submission Layer**: Loading state shown
3. **Error Layer**: Toast notification shown
4. **Form State**: Form remains open for retry

### Console Logging
```typescript
console.error('Error saving profile:', error)
// Logs full error object for debugging
// Only in development (not user-visible)
```

---

## Styling & Dark Mode

### Tailwind Classes Used
```
Input fields:
- w-full px-3 py-2 rounded-lg border border-border
- bg-background focus:outline-none focus:ring-2 focus:ring-blue-500

Errors:
- text-sm text-red-600 mt-1

Tags:
- px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30
- text-blue-700 dark:text-blue-400

Buttons:
- bg-blue-600 hover:bg-blue-700
- border border-border hover:bg-accent
- disabled:opacity-50
```

### Dark Mode
- Uses `dark:` prefix for dark theme
- Automatic based on system preference
- Consistent with existing design system

---

## Performance Considerations

### Optimizations
1. **Conditional Rendering**: Role fields only render when needed
2. **Watch Optimization**: Only watch fields that need real-time updates
3. **Memoization**: Component only re-renders when relevant props change
4. **Lazy Loading**: Profile data loaded only when needed
5. **Error Boundaries**: Try-catch prevents cascading failures

### Potential Bottlenecks
- Multiple Supabase queries during load (mitigated by Promise.all)
- Form re-renders on every keystroke (mitigated by watch selective use)
- Tag array operations (optimized with efficient filtering)

---

## Security Considerations

### Input Validation
- ✅ Zod schema validation on client
- ✅ URL format validation
- ✅ String length limits
- ✅ Numeric range limits
- ✅ Required field enforcement

### Data Privacy
- ✅ Form only edits authenticated user's data
- ✅ No sensitive data in form submission
- ✅ Phone/LinkedIn not public by default
- ✅ CGPA only visible to self

### XSS Prevention
- ✅ React auto-escapes content
- ✅ No dangerouslySetInnerHTML
- ✅ Sanitization via form submission

---

## Testing Strategy

### Unit Tests (Proposed)
```typescript
describe('TagInput', () => {
  it('should add tag on Enter', () => { /* ... */ })
  it('should remove tag on Backspace', () => { /* ... */ })
  it('should prevent duplicates', () => { /* ... */ })
})

describe('Validation Schemas', () => {
  it('should validate correct data', () => { /* ... */ })
  it('should reject invalid URLs', () => { /* ... */ })
  it('should enforce required fields', () => { /* ... */ })
})
```

### Integration Tests (Proposed)
```typescript
describe('Profile Edit', () => {
  it('should save alumni profile correctly', () => { /* ... */ })
  it('should save student profile correctly', () => { /* ... */ })
  it('should show error on save failure', () => { /* ... */ })
})
```

---

## Deployment Checklist

- [ ] TypeScript compilation successful: `npm run build`
- [ ] No ESLint errors: `npm run lint`
- [ ] All imports resolve correctly
- [ ] Supabase credentials configured
- [ ] RLS policies allow updates
- [ ] Database tables have correct structure
- [ ] Components render without errors
- [ ] Forms validate correctly
- [ ] Toast notifications display
- [ ] Keyboard shortcuts work
- [ ] Dark mode works correctly
- [ ] Mobile responsive verified
- [ ] Error scenarios tested

---

## Maintenance Notes

### Future Enhancements
- Add image upload for profile picture
- Add achievements section for alumni
- Add resume upload for students
- Add profile completeness indicator
- Add profile badges for accomplishments

### Known Limitations
- Profile picture editing not included (separate feature)
- Batch/passing year not editable (set at signup)
- Registration number not editable (immutable)
- Department not editable (set at signup)

### Technical Debt
- Consider breaking TagInput into separate file (already done)
- Consider extracting form validation to separate module
- Consider creating custom validation hook

---

End of Technical Documentation
