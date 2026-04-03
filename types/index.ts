export type IssueStatus = 'pending' | 'high_priority' | 'in_review' | 'resolved' | 'verified'

export type IssueCategory =
  | 'infrastructure'
  | 'water'
  | 'electricity'
  | 'public_health'
  | 'security'
  | 'education'
  | 'environment'
  | 'other'

export type GovernmentUpdateType = 'acknowledged' | 'in_progress' | 'resolved' | 'rejected'

export interface State {
  id: number
  name: string
  code: string
}

export interface LGA {
  id: number
  name: string
  state_id: number
  state?: State
}

export interface Category {
  id: number
  name: string
  slug: IssueCategory
  icon: string
  government_body: string
}

export interface User {
  id: string
  phone: string
  email?: string
  full_name: string
  avatar_url?: string
  lga_id?: number
  community?: string
  is_diaspora: boolean
  is_verified: boolean
  created_at: string
  lga?: LGA
}

export interface Issue {
  id: string
  title: string
  description: string
  category_id: number
  lga_id: number
  community?: string
  address?: string
  status: IssueStatus
  report_count: number
  threshold: number
  escalated_at?: string
  resolved_at?: string
  verified_at?: string
  created_by: string
  created_at: string
  updated_at: string
  category?: Category
  lga?: LGA
  creator?: User
}

export interface Report {
  id: string
  issue_id: string
  user_id: string
  description?: string
  created_at: string
}

export interface Evidence {
  id: string
  report_id: string
  url: string
  type: 'image' | 'document'
  created_at: string
}

export interface ResolutionConfirmation {
  id: string
  issue_id: string
  user_id: string
  is_resolved: boolean
  comment?: string
  created_at: string
}

export interface GovernmentUser {
  id: string
  email: string
  full_name: string
  role?: string
  department?: string
  lga_id?: number
  state_id?: number
  is_active: boolean
  created_at: string
  lga?: LGA
  state?: State
}

export interface IssueUpdate {
  id: string
  issue_id: string
  government_user_id: string
  update_type: GovernmentUpdateType
  message?: string
  created_at: string
  government_user?: GovernmentUser
}

export interface Notification {
  id: string
  user_id: string
  type: 'threshold_reached' | 'gov_response' | 'resolution_request' | 'new_issue' | 'watchlist_update'
  title: string
  message: string
  issue_id?: string
  is_read: boolean
  created_at: string
}

export interface Watchlist {
  id: string
  user_id: string
  lga_id: number
  created_at: string
  lga?: LGA
}
