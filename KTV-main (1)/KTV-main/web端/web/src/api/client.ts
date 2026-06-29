import axios from 'axios'

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // exp is in seconds, Date.now() is in ms
    return payload.exp * 1000 < Date.now()
  } catch {
    return true // can't decode = treat as expired
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    if (isTokenExpired(token)) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      // Cancel the request by returning a rejected promise
      return Promise.reject(new Error('登录已过期，请重新登录'))
    }
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Notify Pinia store (same-tab, synchronous)
      window.dispatchEvent(new Event('auth:expired'))
    }
    return Promise.reject(error)
  }
)
