// src/lib/validations/index.ts
import { z } from 'zod'

// ============================================================
// Auth Schemas
// ============================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const alumniSignupSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirm_password: z.string(),
  registration_number: z.string().min(4, 'Registration number is required'),
  department_id: z.string().min(1, 'Please select a department'),
  batch: z.string().min(4, 'Batch is required (e.g., 2018)'),
  passing_year: z.string().regex(/^\d{4}$/, 'Enter a valid year (e.g., 2022)'),
  current_company: z.string().optional(),
  job_title: z.string().optional(),
  linkedin_url: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  phone: z.string().min(10, 'Enter a valid phone number'),
  skills: z.array(z.string()).min(1, 'Add at least one skill'),
  short_bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

export const studentSignupSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirm_password: z.string(),
  registration_number: z.string().min(4, 'Registration number is required'),
  department_id: z.string().min(1, 'Please select a department'),
  semester: z.string().refine(v => Number(v) >= 1 && Number(v) <= 8, 'Semester must be 1–8'),
  cgpa: z.string().refine(v => Number(v) >= 0 && Number(v) <= 4.0, 'CGPA must be between 0.0 and 4.0'),
  skills: z.array(z.string()).min(1, 'Add at least one skill'),
  interests: z.array(z.string()).min(1, 'Add at least one interest'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  linkedin_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  github_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  short_bio: z.string().max(500).optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

// ============================================================
// Task Schemas
// ============================================================

export const taskSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  required_skills: z.array(z.string()).min(1, 'Add at least one required skill'),
  deadline: z.string().min(1, 'Deadline is required'),
  budget_stipend: z.string().optional(),
  team_size: z.number().min(1).max(10),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
})

// ============================================================
// Thread Schemas
// ============================================================

export const threadSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  content: z.string().min(30, 'Content must be at least 30 characters'),
  post_type: z.enum(['discussion', 'question', 'opportunity', 'internship', 'job', 'announcement']),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed'),
})

export const replySchema = z.object({
  content: z.string().min(10, 'Reply must be at least 10 characters'),
})

// ============================================================
// Event Schemas
// ============================================================

export const eventSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description required'),
  event_type: z.string().min(1, 'Please select an event type'),
  location: z.string().optional(),
  is_virtual: z.boolean(),
  virtual_link: z.string().url('Invalid URL').optional().or(z.literal('')),
  event_date: z.string().min(1, 'Date is required'),
  end_date: z.string().optional(),
  max_attendees: z.number().positive().optional(),
  tags: z.array(z.string()),
})

// ============================================================
// Profile Update Schemas
// ============================================================

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(10).optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  short_bio: z.string().max(500).optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type AlumniSignupFormData = z.infer<typeof alumniSignupSchema>
export type StudentSignupFormData = z.infer<typeof studentSignupSchema>
export type TaskFormData = z.infer<typeof taskSchema>
export type ThreadFormData = z.infer<typeof threadSchema>
export type EventFormData = z.infer<typeof eventSchema>
