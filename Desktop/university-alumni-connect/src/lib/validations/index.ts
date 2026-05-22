// src/lib/validations/index.ts
import { z } from 'zod'

// ============================================================
// Auth Schemas
// ============================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirm_password: z.string(),
  registration_number: z.string().min(4, 'Registration number is required'),
  batch: z.string().min(4, 'Batch is required (e.g., 2018)'),
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
  // tags are managed by useState in NewThreadPage, NOT registered in react-hook-form
  // Keeping it optional here so any legacy code that still passes tags doesn't break
  tags: z.array(z.string()).max(5).optional(),
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
export type SignupFormData = z.infer<typeof signupSchema>
export type TaskFormData = z.infer<typeof taskSchema>
export type ThreadFormData = z.infer<typeof threadSchema>
export type EventFormData = z.infer<typeof eventSchema>
