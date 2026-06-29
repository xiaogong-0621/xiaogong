import { apiClient } from './client'
import type { DashboardStats, Room, RoomRequest, Feedback, Song, SongDetail, User, PaginatedResult, SystemSettings, OperationLog } from '@/types'
import type { SongStats } from '@/types'

export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>('/api/dashboard/stats'),
  getLatestRooms: () => apiClient.get('/api/dashboard/latest-rooms'),
  getTopSongs: () => apiClient.get<Song[]>('/api/dashboard/top-songs'),
}

export const roomsApi = {
  getList: (params: { status?: string; search?: string; page?: number; pageSize?: number }) =>
    apiClient.get<PaginatedResult<Room>>('/api/rooms', { params }),
  getById: (id: number) => apiClient.get<Room>(`/api/rooms/${id}`),
  closeRoom: (id: number) => apiClient.post(`/api/rooms/${id}/close`),
  getRoomUsers: (id: number) => apiClient.get<{ id: number; username: string; displayName: string; avatarUrl: string }[]>(`/api/room/${id}/users`),
}

export const roomRequestsApi = {
  getList: (params: { status?: string; page?: number; pageSize?: number }) =>
    apiClient.get<PaginatedResult<RoomRequest>>('/api/roomrequests', { params }),
  approve: (id: number) => apiClient.post(`/api/roomrequests/${id}/approve`),
  reject: (id: number) => apiClient.post(`/api/roomrequests/${id}/reject`),
  getPendingCount: () => apiClient.get<{ count: number }>('/api/roomrequests/pending-count'),
}

export const feedbacksApi = {
  getList: (params: { status?: string; search?: string; page?: number; pageSize?: number }) =>
    apiClient.get<PaginatedResult<Feedback>>('/api/feedbacks', { params }),
  markProcessed: (id: number) => apiClient.post(`/api/feedbacks/${id}/process`),
  getPendingCount: () => apiClient.get<{ count: number }>('/api/feedbacks/pending-count'),
}

export const songsApi = {
  getList: (params: { search?: string; genre?: string; status?: string; page?: number; pageSize?: number }) =>
    apiClient.get<PaginatedResult<Song>>('/api/songs', { params }),
  getStats: () => apiClient.get<SongStats>('/api/songs/stats'),
  getById: (id: number) => apiClient.get<Song>(`/api/songs/${id}`),
  getDetail: (id: number) => apiClient.get<SongDetail>(`/api/songs/${id}/detail`),
  create: (data: Partial<Song>) => apiClient.post('/api/songs', data),
  update: (id: number, data: Partial<Song>) => apiClient.put(`/api/songs/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/songs/${id}`),
  getGenres: () => apiClient.get<string[]>('/api/songs/genres'),
}

export const uploadApi = {
  avatar: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<{ url: string; fileName: string }>('/api/upload/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  cover: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<{ url: string; fileName: string }>('/api/upload/cover', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  music: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<{ url: string; fileName: string }>('/api/upload/music', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  lrc: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<{ url: string; fileName: string }>('/api/upload/lrc', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const accountsApi = {
  getList: (params: { search?: string; status?: string; page?: number; pageSize?: number }) =>
    apiClient.get<PaginatedResult<User>>('/api/accounts', { params }),
  getById: (id: number) => apiClient.get<User>(`/api/accounts/${id}`),
  create: (data: { username: string; password: string; displayName: string; phone?: string; avatarUrl?: string }) =>
    apiClient.post('/api/accounts', data),
  update: (id: number, data: { displayName?: string; phone?: string }) =>
    apiClient.put(`/api/accounts/${id}`, data),
  toggleStatus: (id: number) =>
    apiClient.put(`/api/accounts/${id}/toggle-status`),
  disable: (id: number) =>
    apiClient.post(`/api/accounts/${id}/disable`),
  delete: (id: number) =>
    apiClient.delete(`/api/accounts/${id}`),
  changePassword: (id: number, newPassword: string) =>
    apiClient.put(`/api/accounts/${id}/password`, { newPassword }),
}

export const settingsApi = {
  get: () => apiClient.get<SystemSettings>('/api/settings'),
  update: (data: Partial<SystemSettings>) => apiClient.put('/api/settings', data),
  getAdminAccount: () => apiClient.get<{ username: string }>('/api/settings/admin-account'),
  updateAdminUsername: (data: { newUsername: string; password: string }) =>
    apiClient.post('/api/settings/admin-account/username', data),
  updateAdminPassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    apiClient.post('/api/settings/admin-account/password', data),
}

export const operationLogsApi = {
  getList: (params: { operationType?: string; username?: string; fromDate?: string; toDate?: string; page?: number; pageSize?: number }) =>
    apiClient.get<PaginatedResult<OperationLog>>('/api/operationlogs', { params }),
}

export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post<{ token: string; user: User }>('/api/auth/login', { username, password }),
  logout: () => apiClient.post('/api/auth/logout'),
  getMe: () => apiClient.get<User>('/api/auth/me'),
  verifyPassword: (password: string) =>
    apiClient.post('/api/auth/verify-password', { password }),
}
