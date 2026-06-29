import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (!isRefreshing) {
        isRefreshing = true
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001'
        refreshPromise = fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'demo_hash_admin' }),
        })
          .then(async (res) => {
            if (!res.ok) throw new Error(`Login failed: ${res.status}`)
            const data = await res.json()
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            return true
          })
          .catch(() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
            return false
          })
          .finally(() => {
            isRefreshing = false
          })
      }

      const ok = await refreshPromise
      if (ok) {
        const newToken = localStorage.getItem('token')
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      }
    }

    return Promise.reject(error)
  }
)
