<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { roomApi, type Notification } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { ElMessage } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()
const notificationStore = useNotificationStore()
const joining = ref(false)

// 使用 store 的数据
const notifications = notificationStore.notifications
const loading = notificationStore.loading
const unreadCount = notificationStore.unreadCount

async function markAsRead(id: number) {
  await notificationStore.markAsRead(id)
}

async function markAllAsRead() {
  await notificationStore.markAllAsRead()
}

// 从通知内容中提取房间码
function extractRoomCode(content: string): string | null {
  const match = content.match(/房间码[为：:]\s*([A-Z0-9]{6})/)
  return match ? match[1] : null
}

async function handleJoinRoom(notification: Notification) {
  if (joining.value) return

  // 从通知内容中提取房间码
  const roomCode = extractRoomCode(notification.content)
  if (!roomCode) {
    ElMessage.error('无法获取房间码')
    return
  }

  joining.value = true
  try {
    // 标记为已读
    if (!notification.isRead) {
      await notificationStore.markAsRead(notification.id)
    }

    // 加入房间
    const { data } = await roomApi.joinByCode(roomCode)
    auth.setCurrentRoomId(data.roomId)
    ElMessage.success('已加入房间')
    router.push('/room')
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '加入房间失败')
  } finally {
    joining.value = false
  }
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return d.toLocaleDateString('zh-CN')
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'system_notice': return 'notifications'
    case 'room_approved': return 'check_circle'
    case 'room_rejected': return 'cancel'
    default: return 'info'
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case 'system_notice': return 'text-primary'
    case 'room_approved': return 'text-green-500'
    case 'room_rejected': return 'text-error'
    default: return 'text-on-surface-variant'
  }
}

onMounted(() => {
  // 加载通知列表（store 已在 TopNavBar 中启动轮询）
  notificationStore.fetchNotifications()
})
</script>

<template>
  <div class="min-h-screen relative">
    <!-- Top bar -->
    <div class="relative z-10 max-w-2xl mx-auto px-5 flex items-center justify-between py-4">
      <div class="flex items-center gap-3">
        <button
          @click="router.back()"
          class="w-10 h-10 rounded-xl bg-surface-container-lowest/70 backdrop-blur-lg border border-outline-variant/10 shadow-ambient-sm flex items-center justify-center hover:bg-surface-container hover:scale-105 transition-all"
        >
          <span class="material-symbols-outlined text-lg text-on-surface">arrow_back</span>
        </button>
        <span class="text-lg font-bold text-on-surface font-headline">消息通知</span>
        <span v-if="unreadCount > 0" class="px-2 py-0.5 bg-primary text-on-primary text-xs font-bold rounded-full">
          {{ unreadCount }}
        </span>
      </div>
      <button
        v-if="unreadCount > 0"
        @click="markAllAsRead"
        class="text-sm text-primary font-medium hover:underline"
      >
        全部已读
      </button>
    </div>

    <div class="relative z-10 max-w-2xl mx-auto px-5 pb-16">
      <!-- Loading -->
      <div v-if="loading && notifications.length === 0" class="flex justify-center py-16">
        <span class="material-symbols-outlined animate-spin text-primary">progress_activity</span>
      </div>

      <!-- Notification list -->
      <div v-else-if="notifications.length > 0" class="flex flex-col gap-3">
        <div
          v-for="item in notifications"
          :key="item.id"
          @click="!item.isRead && markAsRead(item.id)"
          class="bg-surface-container-lowest/60 backdrop-blur-xl rounded-2xl p-4 shadow-ambient-sm border border-outline-variant/10 transition-all cursor-pointer hover:bg-surface-container-low"
          :class="{ 'ring-2 ring-primary/20': !item.isRead }"
        >
          <div class="flex items-start gap-3">
            <!-- Icon -->
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="item.isRead ? 'bg-surface-container-high' : 'bg-primary/10'"
            >
              <span
                class="material-symbols-outlined text-xl"
                :class="item.isRead ? 'text-on-surface-variant' : getNotificationColor(item.type)"
              >
                {{ getNotificationIcon(item.type) }}
              </span>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-on-surface font-headline" :class="{ 'text-primary': !item.isRead }">
                  {{ item.title }}
                </h3>
                <span v-if="!item.isRead" class="w-2 h-2 rounded-full bg-primary shrink-0"></span>
              </div>
              <p class="text-sm text-on-surface-variant mt-1">{{ item.content }}</p>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-xs text-outline">{{ formatTime(item.createdAt) }}</span>
                <span v-if="item.type === 'system_notice'" class="text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                  系统通知
                </span>
                <span v-else-if="item.type === 'room_approved'" class="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                  申请通过
                </span>
                <span v-else-if="item.type === 'room_rejected'" class="text-xs px-2 py-0.5 rounded-full bg-error/10 text-error">
                  申请拒绝
                </span>
              </div>
              <!-- 加入房间按钮 -->
              <button
                v-if="item.type === 'room_approved' && item.relatedId"
                @click.stop="handleJoinRoom(item)"
                :disabled="joining"
                class="mt-3 px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span v-if="joining" class="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                {{ joining ? '加入中...' : '加入房间' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="flex flex-col items-center justify-center py-32">
        <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <span class="material-symbols-outlined text-4xl text-primary">notifications_off</span>
        </div>
        <p class="text-lg font-bold text-on-surface font-headline mb-1">暂无通知</p>
        <p class="text-sm text-outline">有新消息时会在这里提醒你</p>
      </div>
    </div>
  </div>
</template>
