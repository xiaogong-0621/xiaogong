export interface User {
  id: number
  username: string
  displayName: string
  phone?: string
  email?: string
  avatarUrl?: string
  status: 'active' | 'disabled'
  isOnline: boolean
  roomCode?: string
  createdAt: string
}

export interface Room {
  id: number
  roomCode: string
  status: 'active' | 'idle_closing' | 'closed'
  createdByUserId: number
  currentUsers: number
  idleCloseAt?: string
  createdAt: string
  closedAt?: string
}

export interface RoomRequest {
  id: number
  userId: number
  status: 'pending' | 'approved' | 'rejected'
  roomId?: number
  createdAt: string
  processedAt?: string
  processedBy?: number
  // Joined fields
  username?: string
  displayName?: string
  roomCode?: string
}

export interface Feedback {
  id: number
  userId: number
  feedbackType: 'request_song' | 'report_error' | 'other'
  songName?: string
  artist?: string
  description?: string
  status: 'pending' | 'processed'
  createdAt: string
  processedAt?: string
  // Joined fields
  username?: string
  displayName?: string
}

export interface Song {
  id: number
  title: string
  artist: string
  genre: string
  language: string | null
  duration: number
  fileSize: number | null
  coverUrl: string | null
  mediaUrl: string | null
  lrcUrl: string | null
  originalFileName: string | null
  playCount: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface SongDetail {
  id: number
  title: string
  artist: string
  genre: string
  language: string | null
  duration: number
  fileSize: number | null
  coverUrl: string | null
  mediaUrl: string | null
  lrcUrl: string | null
  originalFileName: string | null
  playCount: number
  status: string
  createdAt: string
  updatedAt: string
  favoriteCount: number
  ranking: number
  rating: number
  commentCount: number
}

export interface DashboardStats {
  activeRooms: number
  onlineUsers: number
  todayRooms: number
  totalUsers: number
}

export interface SongStats {
  totalSongs: number
  weeklyNew: number
  todayPlays: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface SystemSettings {
  platformName: string
  contactInfo: string
  logRetentionDays: number
  sensitiveOpVerification: boolean
  verifyDisableUser: boolean
  verifyCloseRoom: boolean
  verifyModifySettings: boolean
  verifyModifyAdmin: boolean
}

export interface OperationLog {
  id: number
  username: string
  operationType: string
  objectType: string
  objectId: string | null
  details: string | null
  createdAt: string
}
