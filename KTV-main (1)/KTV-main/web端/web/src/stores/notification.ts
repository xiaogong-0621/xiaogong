import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationsApi, type Notification } from '@/api'

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  let pollTimer: ReturnType<typeof setInterval> | null = null

  // Getters
  const hasUnread = computed(() => unreadCount.value > 0)

  // Actions
  async function fetchNotifications(limit = 50) {
    loading.value = true
    try {
      const { data } = await notificationsApi.getList(limit)
      notifications.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchUnreadCount() {
    try {
      const { data } = await notificationsApi.getUnreadCount()
      unreadCount.value = data.count
    } catch {
      // 静默处理
    }
  }

  async function markAsRead(id: number) {
    try {
      await notificationsApi.markAsRead(id)
      const notification = notifications.value.find(n => n.id === id)
      if (notification && !notification.isRead) {
        notification.isRead = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch {
      // 静默处理
    }
  }

  async function markAllAsRead() {
    try {
      await notificationsApi.markAllAsRead()
      notifications.value.forEach(n => n.isRead = true)
      unreadCount.value = 0
    } catch {
      // 静默处理
    }
  }

  function startPolling(interval = 5000) {
    stopPolling()
    fetchUnreadCount()
    pollTimer = setInterval(() => {
      fetchUnreadCount()
    }, interval)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  function $reset() {
    notifications.value = []
    unreadCount.value = 0
    loading.value = false
    stopPolling()
  }

  return {
    // State
    notifications,
    unreadCount,
    loading,
    // Getters
    hasUnread,
    // Actions
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    startPolling,
    stopPolling,
    $reset,
  }
})
