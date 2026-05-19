// ============================================================
// University Alumni Connect — Core Types
// ============================================================

export type UserRole = 'super_admin' | 'alumni' | 'student'
export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'blocked'
export type TaskStatus = 'pending' | 'open' | 'approved' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'rejected'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type EventType = 'alumni_meetup' | 'seminar' | 'workshop' | 'get_together' | 'career_fair' | 'webinar' | 'other'
export type NotificationType =
  | 'account_approved'
  | 'account_rejected'
  | 'task_uploaded'
  | 'task_assigned'
  | 'task_completed'
  | 'task_submitted'
  | 'task_approved'
  | 'event_created'
  | 'event_reminder'
  | 'thread_reply'
  | 'thread_mention'
  | 'announcement'
  | 'direct_message'
  | 'reply'
export type PostType = 'discussion' | 'question' | 'opportunity' | 'internship' | 'job' | 'announcement'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'

// ============================================================
// User & Profile Types
// ============================================================

export interface User {
  id: string
  firebase_uid: string
  email: string
  full_name: string
  role: UserRole
  account_status: AccountStatus
  profile_picture_url?: string
  phone?: string
  department_id?: string
  registration_number: string
  linkedin_url?: string
  short_bio?: string
  is_email_verified: boolean
  created_at: string
  updated_at: string
  last_seen_at?: string
  department?: Department
}

export interface AlumniProfile {
  id: string
  user_id: string
  batch: string
  passing_year: number
  current_company?: string
  job_title?: string
  skills: string[]
  achievements: Achievement[]
  user?: User
}

export interface StudentProfile {
  id: string
  user_id: string
  semester: number
  cgpa: number
  skills: string[]
  interests: string[]
  github_url?: string
  resume_url?: string
  portfolio_url?: string
  user?: User
}

export interface Achievement {
  id: string
  title: string
  description?: string
  year: number
  url?: string
}

export interface Department {
  id: string
  name: string
  code: string
  faculty?: string
}

// ============================================================
// Task Types
// ============================================================

export interface Task {
  id: string
  title: string
  description: string
  posted_by: string  // alumni user_id
  required_skills: string[]
  recommended_skills?: string[]
  deadline: string
  budget_stipend?: string
  team_size: number
  priority: TaskPriority
  status: TaskStatus
  attachments: Attachment[]
  admin_notes?: string
  created_at: string
  updated_at: string
  alumni?: User
  assignments?: TaskAssignment[]
}

export interface TaskAssignment {
  id: string
  task_id: string
  student_id: string
  assigned_by: string  // admin user_id
  status: 'active' | 'submitted' | 'approved' | 'revision_needed'
  progress_notes?: string
  submission_url?: string
  submission_notes?: string
  assigned_at: string
  submitted_at?: string
  task?: Task
  student?: User
}

// ============================================================
// Community / Forum Types
// ============================================================

export interface Thread {
  id: string
  title: string
  content: string
  author_id: string
  post_type: PostType
  tags: string[]
  is_pinned: boolean
  is_locked: boolean
  view_count: number
  reply_count: number
  upvote_count: number
  created_at: string
  updated_at: string
  author?: User
  replies?: ThreadReply[]
  user_vote?: 'up' | 'down' | null
}

export interface ThreadReply {
  id: string
  thread_id: string
  author_id: string
  content: string
  parent_reply_id?: string  // for nested replies
  upvote_count: number
  is_accepted_answer: boolean
  created_at: string
  updated_at: string
  author?: User
  user_vote?: 'up' | 'down' | null
  nested_replies?: ThreadReply[]
}

export interface ThreadVote {
  id: string
  user_id: string
  thread_id?: string
  reply_id?: string
  vote_type: 'up' | 'down'
}

// ============================================================
// Event Types
// ============================================================

export interface Event {
  id: string
  title: string
  description: string
  event_type: EventType
  location?: string
  is_virtual: boolean
  virtual_link?: string
  online_link?: string  // alias for virtual_link used in some pages
  event_date: string
  end_date?: string
  max_attendees?: number
  cover_image_url?: string
  created_by: string
  tags: string[]
  is_published: boolean
  created_at: string
  updated_at?: string
  rsvp_count?: number
  user_rsvp?: boolean
}

export interface EventRSVP {
  id: string
  event_id: string
  user_id: string
  status: 'attending' | 'maybe' | 'not_attending'
  rsvped_at?: string
  created_at: string
  user?: User
}

// ============================================================
// Notification Types
// ============================================================

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link?: string
  is_read: boolean
  metadata?: Record<string, unknown>
  created_at: string
}

// ============================================================
// Message Types (Direct Chat)
// ============================================================

export interface DirectMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: User
}

export interface Conversation {
  id: string
  participant_1: string
  participant_2: string
  last_message?: string
  last_message_at?: string
  unread_count?: number
  other_user?: User
}

// ============================================================
// Shared / Utility Types
// ============================================================

export interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface FilterOptions {
  role?: UserRole
  department_id?: string
  status?: string
  search?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface DashboardStats {
  total_alumni: number
  total_students: number
  pending_requests: number
  total_tasks: number
  active_tasks: number
  total_events: number
  total_threads: number
  approved_this_month: number
}

// ============================================================
// Form Types (for React Hook Form)
// ============================================================

export interface AlumniSignupForm {
  full_name: string
  email: string
  password: string
  confirm_password: string
  registration_number: string
  department_id: string
  batch: string
  passing_year: string
  current_company?: string
  job_title?: string
  linkedin_url?: string
  phone: string
  skills: string[]
  short_bio?: string
}

export interface StudentSignupForm {
  full_name: string
  email: string
  password: string
  confirm_password: string
  registration_number: string
  department_id: string
  semester: string
  cgpa: string
  skills: string[]
  interests: string[]
  phone: string
  linkedin_url?: string
  github_url?: string
  short_bio?: string
}

export interface LoginForm {
  email: string
  password: string
}

export interface TaskForm {
  title: string
  description: string
  required_skills: string[]
  deadline: string
  budget_stipend?: string
  team_size: number
  priority: TaskPriority
}

export interface ThreadForm {
  title: string
  content: string
  post_type: PostType
  tags: string[]
}

export interface EventForm {
  title: string
  description: string
  event_type: EventType
  location: string
  is_virtual: boolean
  virtual_link?: string
  event_date: string
  end_date?: string
  max_attendees?: number
  tags: string[]
}


// ─── Aliases used by pages ───────────────────────────────────────────────────
export type ThreadFormData = ThreadForm
export type TaskFormData = TaskForm

// ============================================================
// Task Approval Types
// ============================================================

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface TaskApproval {
  id: string
  task_id: string
  admin_id: string
  status: ApprovalStatus
  notes?: string
  created_at: string
  approved_at?: string
  admin?: User
  task?: Task
}

// ============================================================
// Announcement Types
// ============================================================

export type AnnouncementPriority = 'low' | 'medium' | 'high'

export interface Announcement {
  id: string
  admin_id: string
  title: string
  content: string
  priority: AnnouncementPriority
  is_pinned: boolean
  occurs_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
  admin?: User
}

export interface AnnouncementForm {
  title: string
  content: string
  priority: AnnouncementPriority
  is_pinned: boolean
  occurs_at?: string
  expires_at?: string
}
