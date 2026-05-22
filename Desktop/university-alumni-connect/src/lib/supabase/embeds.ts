/** PostgREST embed hints when multiple FKs point at the same table. */

export const COMMUNITY_POST_AUTHOR =
  'author:users!community_posts_author_id_fkey(id, full_name, profile_picture_url, role)'

export const COMMUNITY_POST_AUTHOR_WITH_DEPT =
  'author:users!community_posts_author_id_fkey(id, full_name, profile_picture_url, role, department:departments(name))'

export const COMMUNITY_POST_AUTHOR_EMAIL =
  'author:users!community_posts_author_id_fkey(id, full_name, email, profile_picture_url, role)'

export const COMMENT_AUTHOR =
  'author:users!comments_author_id_fkey(id, full_name, profile_picture_url, role)'

export const TASK_ALUMNI =
  'alumni:users!tasks_posted_by_fkey(id, full_name, profile_picture_url)'
