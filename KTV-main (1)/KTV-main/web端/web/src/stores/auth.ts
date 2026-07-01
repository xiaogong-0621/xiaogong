import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(
    JSON.parse(localStorage.getItem('user') || 'null')
  )
  const isLoggedIn = ref(!!token.value)
  const currentRoomId = ref<number>(Number(localStorage.getItem('currentRoomId') || '0'))

  function setAuth(newToken: string, newUser: User) {
    token.value = newToken
    user.value = newUser
    isLoggedIn.value = true
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  function setCurrentRoomId(roomId: number) {
    currentRoomId.value = roomId
    localStorage.setItem('currentRoomId', String(roomId))
  }

  function logout() {
    token.value = null
    user.value = null
    isLoggedIn.value = false
    currentRoomId.value = 0
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('currentRoomId')
  }

  function updateUser(data: { displayName?: string; phone?: string; email?: string }) {
    if (user.value) {
      user.value = { ...user.value, ...data }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  // Sync with localStorage changes (for 401 interceptor, other tabs, VSCode)
  window.addEventListener('storage', (e) => {
    if (e.key === 'token' && !e.newValue) {
      token.value = null
      user.value = null
      isLoggedIn.value = false
      currentRoomId.value = 0
    }
  })

  // Also check periodically (for same-tab changes by interceptor)
  setInterval(() => {
    const stored = localStorage.getItem('token')
    if (!stored && isLoggedIn.value) {
      token.value = null
      user.value = null
      isLoggedIn.value = false
    }
  }, 1000)

  return { token, user, isLoggedIn, currentRoomId, setAuth, setCurrentRoomId, logout, updateUser }
})
