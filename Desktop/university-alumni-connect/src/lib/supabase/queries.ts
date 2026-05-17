// src/lib/supabase/queries.ts
import { supabase } from './client'
import type {
  User, AlumniProfile, StudentProfile, Task, TaskAssignment,
  Thread, ThreadReply, Event, EventRSVP, Notification,
  Conversation, DirectMessage, DashboardStats, FilterOptions,
  PaginatedResponse, TaskApproval, Announcement,
} from '@/lib/types'

// ============================================================
// USER QUERIES
// ============================================================

export const userQueries = {
  async getByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*, department:departments(*)')
      .eq('firebase_uid', firebaseUid)
      .single()
    if (error) return null
    return data
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*, department:departments(*)')
      .eq('id', id)
      .single()
    if (error) return null
    return data
  },

  async createUser(userData: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select('*, department:departments(*)')
      .single()
    if (error) throw error
    return data
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('*, department:departments(*)')
      .single()
    if (error) throw error
    return data
  },

  async getAllUsers(filters: FilterOptions = {}): Promise<PaginatedResponse<User>> {
    const { role, department_id, status, search, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = filters
    let query = supabase
      .from('users')
      .select('*, department:departments(*)', { count: 'exact' })

    if (role) query = query.eq('role', role)
    if (department_id) query = query.eq('department_id', department_id)
    if (status) query = query.eq('account_status', status)
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,registration_number.ilike.%${search}%`)

    const from = (page - 1) * limit
    query = query.order(sort_by, { ascending: sort_order === 'asc' }).range(from, from + limit - 1)

    const { data, error, count } = await query
    if (error) throw error
    return { data: data || [], count: count || 0, page, limit, total_pages: Math.ceil((count || 0) / limit) }
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase.from('users').update({ account_status: status }).eq('id', id)
    if (error) throw error
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const [alumni, students, pending, tasks, events, threads] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'alumni').eq('account_status', 'approved'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('account_status', 'approved'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('account_status', 'pending'),
      supabase.from('tasks').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('threads').select('id', { count: 'exact', head: true }),
    ])
    return {
      total_alumni: alumni.count || 0,
      total_students: students.count || 0,
      pending_requests: pending.count || 0,
      total_tasks: tasks.count || 0,
      active_tasks: 0,
      total_events: events.count || 0,
      total_threads: threads.count || 0,
      approved_this_month: 0,
    }
  },

  async getAllRegisteredUsers(currentUserId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*, department:departments(*)')
      .neq('id', currentUserId)
      .eq('account_status', 'approved')
      .order('full_name', { ascending: true })
    if (error) throw error
    return data || []
  },

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*, department:departments(*)')
      .neq('id', currentUserId)
      .eq('account_status', 'approved')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('full_name', { ascending: true })
      .limit(20)
    if (error) throw error
    return data || []
  },

  async findMatchingStudents(skills: string[]): Promise<any[]> {
    const { data, error } = await supabase.rpc('find_matching_students', { task_skills: skills, limit_count: 20 })
    if (error) throw error
    return data || []
  },
}

// ============================================================
// PROFILE QUERIES
// ============================================================

export const profileQueries = {
  async getAlumniProfile(userId: string): Promise<AlumniProfile | null> {
    const { data, error } = await supabase
      .from('alumni_profiles')
      .select('*, user:users(*, department:departments(*))')
      .eq('user_id', userId)
      .single()
    if (error) return null
    return data
  },

  async getStudentProfile(userId: string): Promise<StudentProfile | null> {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*, user:users(*, department:departments(*))')
      .eq('user_id', userId)
      .single()
    if (error) return null
    return data
  },


  async upsertAlumniProfile(data: Partial<AlumniProfile>): Promise<AlumniProfile> {
    const { data: result, error } = await supabase
      .from('alumni_profiles')
      .upsert(data, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    return result
  },

  async upsertStudentProfile(data: Partial<StudentProfile>): Promise<StudentProfile> {
    const { data: result, error } = await supabase
      .from('student_profiles')
      .upsert(data, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    return result
  },
}

// ============================================================
// TASK QUERIES
// ============================================================

export const taskQueries = {
  async getAllTasks(filters: FilterOptions = {}): Promise<PaginatedResponse<Task>> {
    const { status, search, page = 1, limit = 20 } = filters
    let query = supabase
      .from('tasks')
      .select('*, alumni:users!posted_by(id, full_name, profile_picture_url), assignments:task_assignments(*, student:users(id, full_name, profile_picture_url))', { count: 'exact' })

    if (status) query = query.eq('status', status)
    if (search) query = query.ilike('title', `%${search}%`)

    const from = (page - 1) * limit
    query = query.order('created_at', { ascending: false }).range(from, from + limit - 1)

    const { data, error, count } = await query
    if (error) throw error
    return { data: data || [], count: count || 0, page, limit, total_pages: Math.ceil((count || 0) / limit) }
  },

  async getTasksByAlumni(alumniId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, assignments:task_assignments(*, student:users(id, full_name, profile_picture_url))')
      .eq('posted_by', alumniId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getAssignedTasksForStudent(studentId: string): Promise<TaskAssignment[]> {
    const { data, error } = await supabase
      .from('task_assignments')
      .select('*, task:tasks(*, alumni:users!posted_by(id, full_name, profile_picture_url))')
      .eq('student_id', studentId)
      .order('assigned_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase.from('tasks').insert(taskData).select().single()
    if (error) throw error
    return data
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async assignTask(taskId: string, studentId: string, adminId: string): Promise<TaskAssignment> {
    const { data, error } = await supabase
      .from('task_assignments')
      .insert({ task_id: taskId, student_id: studentId, assigned_by: adminId })
      .select()
      .single()
    if (error) throw error
    // Update task status
    await supabase.from('tasks').update({ status: 'assigned' }).eq('id', taskId)
    return data
  },

  async findMatchingStudents(skills: string[]) {
    const { data, error } = await supabase.rpc('find_matching_students', {
      task_skills: skills,
      limit_count: 10,
    })
    if (error) throw error
    return data || []
  },

  async getTasksNeedingApproval(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, alumni:users!posted_by(id, full_name, profile_picture_url, email)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async bulkAssignToStudents(taskId: string, studentIds: string[], adminId: string): Promise<void> {
    const assignments = studentIds.map(studentId => ({
      task_id: taskId,
      student_id: studentId,
      assigned_by: adminId,
    }))
    const { error } = await supabase.from('task_assignments').insert(assignments)
    if (error) throw error
    await supabase.from('tasks').update({ status: 'assigned' }).eq('id', taskId)
  },
}

// ============================================================
// THREAD QUERIES (Community)
// ============================================================

export const threadQueries = {
  async getThreads(filters: FilterOptions & { post_type?: string } = {}): Promise<PaginatedResponse<Thread>> {
    const { search, page = 1, limit = 20, post_type } = filters
    let query = supabase
      .from('threads')
      .select('*, author:users(id, full_name, profile_picture_url, role)', { count: 'exact' })
      .eq('is_pinned', false)

    if (post_type) query = query.eq('post_type', post_type)
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)

    // Pinned threads first
    const { data: pinned } = await supabase
      .from('threads')
      .select('*, author:users(id, full_name, profile_picture_url, role)')
      .eq('is_pinned', true)
      .order('created_at', { ascending: false })

    const from = (page - 1) * limit
    query = query.order('created_at', { ascending: false }).range(from, from + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    const allData = page === 1 ? [...(pinned || []), ...(data || [])] : data || []
    return { data: allData, count: count || 0, page, limit, total_pages: Math.ceil((count || 0) / limit) }
  },

  async getThreadById(id: string): Promise<Thread | null> {
    // Increment view count
    await supabase.rpc('increment', { table_name: 'threads', column_name: 'view_count', row_id: id }).maybeSingle()

    const { data, error } = await supabase
      .from('threads')
      .select('*, author:users(id, full_name, profile_picture_url, role, department:departments(name))')
      .eq('id', id)
      .single()
    if (error) return null
    return data
  },

  async getRepliesForThread(threadId: string): Promise<ThreadReply[]> {
    const { data, error } = await supabase
      .from('thread_replies')
      .select('*, author:users(id, full_name, profile_picture_url, role)')
      .eq('thread_id', threadId)
      .is('parent_reply_id', null)
      .order('is_accepted_answer', { ascending: false })
      .order('upvote_count', { ascending: false })
      .order('created_at', { ascending: true })
    if (error) return []
    return data || []
  },

  async createThread(threadData: Partial<Thread>): Promise<Thread> {
    const { data, error } = await supabase
      .from('threads')
      .insert(threadData)
      .select('*, author:users(id, full_name, profile_picture_url, role)')
      .single()
    if (error) throw error
    return data
  },

  async createReply(replyData: Partial<ThreadReply>): Promise<ThreadReply> {
    const { data, error } = await supabase
      .from('thread_replies')
      .insert(replyData)
      .select('*, author:users(id, full_name, profile_picture_url, role)')
      .single()
    if (error) throw error
    return data
  },

  async voteThread(userId: string, threadId: string, voteType: 'up' | 'down') {
    // Upsert vote
    const { error } = await supabase.from('votes').upsert({
      user_id: userId, thread_id: threadId, vote_type: voteType,
    }, { onConflict: 'user_id,thread_id' })
    if (error) throw error

    // Recalculate upvotes
    const { count: upCount } = await supabase.from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', threadId).eq('vote_type', 'up')
    await supabase.from('threads').update({ upvote_count: upCount || 0 }).eq('id', threadId)
  },
}

// ============================================================
// EVENT QUERIES
// ============================================================

export const eventQueries = {
  async getEvents(upcoming = false): Promise<Event[]> {
    let query = supabase
      .from('events')
      .select('*, rsvp_count:event_rsvps(count)')
      .eq('is_published', true)
    if (upcoming) query = query.gte('event_date', new Date().toISOString())
    query = query.order('event_date', { ascending: true })
    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getEventById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*, rsvps:event_rsvps(*, user:users(id, full_name, profile_picture_url))')
      .eq('id', id)
      .single()
    if (error) return null
    return data
  },

  async createEvent(eventData: Partial<Event>): Promise<Event> {
    const { data, error } = await supabase.from('events').insert(eventData).select().single()
    if (error) throw error
    return data
  },

  async rsvpEvent(eventId: string, userId: string, status: string): Promise<void> {
    const { error } = await supabase.from('event_rsvps').upsert(
      { event_id: eventId, user_id: userId, status },
      { onConflict: 'event_id,user_id' }
    )
    if (error) throw error
  },

  async getUserRsvp(eventId: string, userId: string): Promise<EventRSVP | null> {
    const { data } = await supabase.from('event_rsvps')
      .select('*').eq('event_id', eventId).eq('user_id', userId).single()
    return data
  },
}

// ============================================================
// NOTIFICATION QUERIES
// ============================================================

export const notificationQueries = {
  async getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return data || []
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    return count || 0
  },

  async markAllRead(userId: string): Promise<void> {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
  },

  async createNotification(data: Partial<Notification>): Promise<void> {
    await supabase.from('notifications').insert(data)
  },

  async sendBulkNotification(userIds: string[], notification: Omit<Partial<Notification>, 'user_id'>): Promise<void> {
    const notifications = userIds.map(uid => ({ ...notification, user_id: uid }))
    await supabase.from('notifications').insert(notifications)
  },
}

// ============================================================
// MESSAGE QUERIES
// ============================================================

export const messageQueries = {
  async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order('last_message_at', { ascending: false })
    if (error) return []
    return data || []
  },

  async getMessages(conversationId: string): Promise<DirectMessage[]> {
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*, sender:users(id, full_name, profile_picture_url)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (error) return []
    return data || []
  },

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<DirectMessage> {
    const { data, error } = await supabase
      .from('direct_messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, content })
      .select('*, sender:users(id, full_name, profile_picture_url)')
      .single()
    if (error) throw error
    // Update conversation last message
    await supabase.from('conversations').update({ last_message: content, last_message_at: new Date().toISOString() }).eq('id', conversationId)
    return data
  },

  async getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation> {
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(participant_1.eq.${userId1},participant_2.eq.${userId2}),and(participant_1.eq.${userId2},participant_2.eq.${userId1})`)
      .single()

    if (existing) return existing

    const { data, error } = await supabase
      .from('conversations')
      .insert({ participant_1: userId1, participant_2: userId2 })
      .select()
      .single()
    if (error) throw error
    return data
  },
}

// ============================================================
// TASK APPROVAL QUERIES
// ============================================================

export const approvalQueries = {
  async getPendingTaskApprovals(): Promise<TaskApproval[]> {
    const { data, error } = await supabase
      .from('task_approvals')
      .select('*, task:tasks(*, alumni:users(id, full_name, profile_picture_url, email)), admin:users(id, full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getTaskApprovalHistory(taskId: string): Promise<TaskApproval | null> {
    const { data, error } = await supabase
      .from('task_approvals')
      .select('*, admin:users(id, full_name)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (error) return null
    return data
  },

  async approveTask(taskId: string, adminId: string, notes?: string, taskUpdates?: Partial<Task>): Promise<TaskApproval> {
    const { data, error } = await supabase
      .from('task_approvals')
      .upsert({
        task_id: taskId,
        admin_id: adminId,
        status: 'approved',
        notes,
        approved_at: new Date().toISOString(),
      }, { onConflict: 'task_id' })
      .select()
      .single()
    if (error) throw error

    // Update task status to approved + optional admin updates
    await supabase.from('tasks').update({ status: 'approved', ...(taskUpdates || {}) }).eq('id', taskId)

    return data
  },

  async rejectTask(taskId: string, adminId: string, notes?: string, taskUpdates?: Partial<Task>): Promise<TaskApproval> {
    const { data, error } = await supabase
      .from('task_approvals')
      .upsert({
        task_id: taskId,
        admin_id: adminId,
        status: 'rejected',
        notes,
      }, { onConflict: 'task_id' })
      .select()
      .single()
    if (error) throw error

    // Update task status to rejected + optional admin updates
    await supabase.from('tasks').update({ status: 'rejected', ...(taskUpdates || {}) }).eq('id', taskId)

    return data
  },

  async createTaskApproval(taskId: string, adminId?: string | null): Promise<TaskApproval> {
    const { data, error } = await supabase
      .from('task_approvals')
      .upsert({
        task_id: taskId,
        admin_id: adminId ?? null,
        status: 'pending',
        notes: null,
        approved_at: null,
      }, { onConflict: 'task_id' })
      .select()
      .single()
    if (error) throw error
    return data
  },
}

// ============================================================
// ANNOUNCEMENT QUERIES
// ============================================================

export const announcementQueries = {
  async getAnnouncements(includeExpired = false): Promise<Announcement[]> {
    let query = supabase
      .from('announcements')
      .select('*, admin:users(id, full_name, profile_picture_url)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (!includeExpired) {
      query = query.or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getAnnouncementById(id: string): Promise<Announcement | null> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, admin:users(id, full_name, profile_picture_url)')
      .eq('id', id)
      .single()
    if (error) return null
    return data
  },

  async createAnnouncement(announcement: Partial<Announcement>): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .insert(announcement)
      .select('*, admin:users(id, full_name, profile_picture_url)')
      .single()
    if (error) throw error
    return data
  },

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, admin:users(id, full_name, profile_picture_url)')
      .single()
    if (error) throw error
    return data
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) throw error
  },

  async togglePin(id: string, isPinned: boolean): Promise<Announcement> {
    return this.updateAnnouncement(id, { is_pinned: isPinned })
  },
}
