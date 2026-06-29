<template>
  <div class="p-8 flex flex-col gap-8">
    <!-- Page Header -->
    <div class="flex flex-col gap-6">
      <h2 class="text-3xl font-display font-bold text-on-surface">房间监控</h2>
      <!-- Tab Switcher -->
      <div class="flex gap-2 bg-surface-container-lowest p-2 rounded-xl ring-1 ring-outline-variant/15 w-fit">
        <button
          class="px-6 py-2.5 rounded-lg font-medium text-sm transition-all"
          :class="activeTab === 'rooms'
            ? 'bg-primary text-on-primary shadow-[0_4px_12px_rgba(0,99,153,0.15)]'
            : 'text-on-surface-variant hover:bg-surface-container-low'"
          @click="activeTab = 'rooms'"
        >
          活跃房间
        </button>
        <button
          class="px-6 py-2.5 rounded-lg font-medium text-sm transition-all relative"
          :class="activeTab === 'requests'
            ? 'bg-primary text-on-primary shadow-[0_4px_12px_rgba(0,99,153,0.15)]'
            : 'text-on-surface-variant hover:bg-surface-container-low'"
          @click="activeTab = 'requests'"
        >
          待审批
          <span
            v-if="pendingCount > 0"
            class="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >{{ pendingCount > 99 ? '99+' : pendingCount }}</span>
        </button>
      </div>
    </div>

    <!-- Active Rooms Tab -->
    <div v-if="activeTab === 'rooms'">
      <!-- Filters -->
      <div class="flex items-center justify-between bg-surface-container-lowest p-2 rounded-xl ring-1 ring-outline-variant/15 mb-6">
        <div class="flex gap-2">
          <button
            v-for="tab in statusTabs"
            :key="tab.value"
            class="px-6 py-2.5 rounded-lg font-medium text-sm transition-all"
            :class="activeStatus === tab.value
              ? 'bg-primary text-on-primary shadow-[0_4px_12px_rgba(0,99,153,0.15)]'
              : 'text-on-surface-variant hover:bg-surface-container-low'"
            @click="activeStatus = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-sm">search</span>
          <input
            v-model="searchQuery"
            class="pl-9 pr-4 py-2.5 bg-surface-container-high border-none rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary w-64"
            placeholder="搜索房间码..."
            type="text"
          />
        </div>
      </div>

      <!-- Rooms Table -->
      <div class="bg-surface-container-lowest rounded-xl p-6 ring-1 ring-outline-variant/15 shadow-[0_8px_32px_rgba(25,28,30,0.03)]">
        <div class="w-full">
          <div class="grid grid-cols-5 gap-4 py-4 text-sm font-semibold text-on-surface-variant uppercase tracking-wider px-4">
            <div>房间码</div>
            <div>当前人数</div>
            <div>状态</div>
            <div>创建时间</div>
            <div class="text-right">操作</div>
          </div>
          <div
            v-for="room in rooms"
            :key="room.id"
            class="grid grid-cols-5 gap-4 py-5 items-center px-4 rounded-lg hover:bg-surface-container-low transition-colors"
          >
            <div class="font-display font-bold text-base text-on-surface font-mono">{{ room.roomCode }}</div>
            <div class="text-sm text-on-surface-variant">{{ room.currentUsers }} 人</div>
            <div>
              <span
                class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold"
                :class="roomStatusClass(room)"
              >
                {{ formatRoomStatus(room) }}
              </span>
            </div>
            <div class="text-sm text-on-surface-variant">{{ formatDate(room.createdAt) }}</div>
            <div class="flex justify-end gap-2">
              <button
                @click="viewRoomUsers(room.id)"
                class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                查看用户
              </button>
              <button
                @click="closeRoom(room.id)"
                class="px-3 py-1.5 rounded-lg bg-error/10 text-error text-xs font-semibold hover:bg-error/20 transition-colors"
              >
                关闭房间
              </button>
            </div>
          </div>
        </div>

        <div v-if="rooms.length === 0" class="text-center py-16">
          <span class="material-symbols-outlined text-5xl text-surface-container-highest">meeting_room</span>
          <p class="text-on-surface-variant mt-4">暂无活跃房间</p>
        </div>

        <!-- Pagination -->
        <div v-if="roomTotal > 0" class="flex justify-between items-center mt-8 pt-4 border-t-0 text-sm text-on-surface-variant">
          <p>显示 {{ rooms.length }} 条，共 {{ roomTotal }} 条</p>
          <div class="flex gap-1">
            <button
              class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-low text-on-surface-variant disabled:opacity-50"
              :disabled="currentPage <= 1"
              @click="currentPage--"
            >
              <span class="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button
              v-for="page in totalPages"
              :key="page"
              class="w-8 h-8 rounded-lg flex items-center justify-center font-medium transition-colors"
              :class="page === currentPage
                ? 'bg-primary text-on-primary'
                : 'hover:bg-surface-container-low text-on-surface-variant'"
              @click="currentPage = page"
            >{{ page }}</button>
            <button
              class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-low text-on-surface-variant disabled:opacity-50"
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
            >
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pending Requests Tab -->
    <div v-if="activeTab === 'requests'">
      <div class="bg-surface-container-lowest rounded-xl p-6 ring-1 ring-outline-variant/15 shadow-[0_8px_32px_rgba(25,28,30,0.03)]">
        <div class="w-full">
          <div class="grid grid-cols-4 gap-4 py-4 text-sm font-semibold text-on-surface-variant uppercase tracking-wider px-4">
            <div>申请用户</div>
            <div>申请时间</div>
            <div>状态</div>
            <div class="text-right">操作</div>
          </div>
          <div
            v-for="req in requests"
            :key="req.id"
            class="grid grid-cols-4 gap-4 py-5 items-center px-4 rounded-lg hover:bg-surface-container-low transition-colors"
          >
            <div class="font-medium text-on-surface">{{ req.displayName || req.username || '--' }}</div>
            <div class="text-sm text-on-surface-variant">{{ formatDate(req.createdAt) }}</div>
            <div>
              <span
                class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold"
                :class="req.status === 'pending' ? 'bg-warning/10 text-warning' : req.status === 'approved' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'"
              >
                {{ formatRequestStatus(req.status) }}
              </span>
            </div>
            <div class="flex justify-end gap-2">
              <template v-if="req.status === 'pending'">
                <button
                  @click="approveRequest(req.id)"
                  class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                >
                  通过
                </button>
                <button
                  @click="rejectRequest(req.id)"
                  class="px-3 py-1.5 rounded-lg bg-error/10 text-error text-xs font-semibold hover:bg-error/20 transition-colors"
                >
                  拒绝
                </button>
              </template>
              <span v-else class="text-xs text-on-surface-variant/50">
                {{ req.roomCode ? `房间码: ${req.roomCode}` : '--' }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="requests.length === 0" class="text-center py-16">
          <span class="material-symbols-outlined text-5xl text-surface-container-highest">inbox</span>
          <p class="text-on-surface-variant mt-4">暂无待审批申请</p>
        </div>
      </div>
    </div>

    <!-- Room Users Dialog -->
    <div v-if="showUsersDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showUsersDialog = false">
      <div class="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
        <h3 class="text-xl font-display font-bold text-on-surface">房间用户</h3>
        <div v-if="roomUsers.length === 0" class="text-center py-8 text-on-surface-variant">
          暂无用户
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="u in roomUsers"
            :key="u.id"
            class="flex items-center gap-3 p-3 rounded-lg bg-surface-container-high"
          >
            <div class="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs uppercase">
              {{ u.displayName.charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="font-medium text-on-surface text-sm">{{ u.displayName }}</p>
              <p class="text-xs text-on-surface-variant">{{ u.username }}</p>
            </div>
          </div>
        </div>
        <div class="flex justify-end">
          <button @click="showUsersDialog = false" class="px-6 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">关闭</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toastMsg" class="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-error text-on-error px-6 py-3 rounded-xl shadow-lg text-sm font-medium">
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { roomsApi, roomRequestsApi } from '@/api'
import type { Room, RoomRequest } from '@/types'
import { useToast } from '@/composables/useToast'

// Toast
const { toastMsg, showToast } = useToast()

// Tab state
const activeTab = ref<'rooms' | 'requests'>('rooms')

// Rooms state
const rooms = ref<Room[]>([])
const roomTotal = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const activeStatus = ref('')
const searchQuery = ref('')

// Requests state
const requests = ref<RoomRequest[]>([])
const pendingCount = ref(0)

// Room users dialog state
const showUsersDialog = ref(false)
const roomUsers = ref<{ id: number; username: string; displayName: string; avatarUrl: string }[]>([])

// Countdown state
const countdowns = ref<Record<number, number>>({})
let tickTimer: ReturnType<typeof setInterval> | null = null

function updateCountdowns() {
  const now = Date.now()
  const next: Record<number, number> = {}
  for (const room of rooms.value) {
    if (room.idleCloseAt) {
      const remaining = Math.max(0, Math.ceil((new Date(room.idleCloseAt).getTime() - now) / 1000))
      next[room.id] = remaining
      if (remaining <= 0 && countdowns.value[room.id] > 0) {
        roomsApi.closeRoom(room.id).then(() => fetchRooms()).catch(() => {})
      }
    }
  }
  countdowns.value = next
}

async function viewRoomUsers(roomId: number) {
  try {
    const { data } = await roomsApi.getRoomUsers(roomId)
    roomUsers.value = data
    showUsersDialog.value = true
  } catch (err: any) {
    console.error('获取房间用户失败:', err)
    const msg = err.code === 'ECONNABORTED'
      ? '请求超时，请检查后端服务是否正常'
      : err.response?.data?.message || err.message || '获取房间用户失败'
    showToast(msg)
  }
}

const statusTabs = [
  { label: '全部', value: '' },
  { label: '进行中', value: 'active' },
  { label: '空闲待关闭', value: 'idle_closing' },
]

const totalPages = computed(() => Math.max(1, Math.ceil(roomTotal.value / pageSize.value)))

function roomStatusClass(room: Room) {
  if (room.currentUsers > 0) return 'bg-primary/10 text-primary'
  if (room.idleCloseAt) return 'bg-warning/10 text-warning'
  return 'bg-surface-container-high text-on-surface-variant'
}

function formatRoomStatus(room: Room) {
  if (room.currentUsers > 0) return '进行中'
  if (room.idleCloseAt) {
    const remaining = countdowns.value[room.id]
    if (remaining !== undefined && remaining > 0) return `自动关闭 ${remaining}s`
    return '关闭中...'
  }
  return '空闲'
}

function formatRequestStatus(status: string) {
  switch (status) {
    case 'pending': return '待审批'
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    default: return status
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function fetchRooms() {
  const res = await roomsApi.getList({
    status: activeStatus.value || undefined,
    search: searchQuery.value || undefined,
    page: currentPage.value,
    pageSize: pageSize.value,
  })
  rooms.value = res.data.items
  roomTotal.value = res.data.total
  updateCountdowns()
}

async function fetchRequests() {
  const res = await roomRequestsApi.getList({
    status: 'pending',
    page: 1,
    pageSize: 50,
  })
  requests.value = res.data.items
}

async function fetchPendingCount() {
  const { data } = await roomRequestsApi.getPendingCount()
  pendingCount.value = data.count
}

async function closeRoom(id: number) {
  if (!confirm('确定关闭该房间？房间内所有用户将被退出。')) return
  try {
    await roomsApi.closeRoom(id)
    await fetchRooms()
  } catch (err: any) {
    showToast(err.response?.data?.message || '关闭房间失败')
  }
}

async function approveRequest(id: number) {
  const { data } = await roomRequestsApi.approve(id)
  showToast(`已通过，房间码: ${data.roomCode}`)
  await fetchRequests()
  await fetchPendingCount()
}

async function rejectRequest(id: number) {
  if (!confirm('确定拒绝该申请？')) return
  await roomRequestsApi.reject(id)
  await fetchRequests()
  await fetchPendingCount()
}

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  fetchRooms()
  fetchRequests()
  fetchPendingCount()
  pollTimer = setInterval(() => {
    fetchRooms()
    fetchRequests()
    fetchPendingCount()
  }, 3000)
  tickTimer = setInterval(updateCountdowns, 1000)
})

onUnmounted(() => {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null }
})

watch([activeStatus, searchQuery], () => {
  currentPage.value = 1
  fetchRooms()
})

watch(currentPage, () => {
  fetchRooms()
})
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
