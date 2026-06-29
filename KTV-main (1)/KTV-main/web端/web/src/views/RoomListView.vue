<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { roomsApi, roomApi, roomRequestsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import type { Room } from '@/types'
import { ElMessage } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()
const rooms = ref<Room[]>([])
const total = ref(0)
const loading = ref(false)
const search = ref('')
const joinCode = ref('')
const showJoinDialog = ref(false)

async function loadRooms() {
  loading.value = true
  try {
    const { data } = await roomsApi.getList({ search: search.value || undefined })
    rooms.value = data.items
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function handleJoin(room: Room) {
  try {
    const { data } = await roomApi.joinByCode(room.roomCode)
    auth.setCurrentRoomId(data.roomId)
    router.push('/room')
  } catch {
    ElMessage.error('加入房间失败')
  }
}

async function handleJoinByCode() {
  if (!joinCode.value.trim()) {
    ElMessage.warning('请输入房间码')
    return
  }
  try {
    const { data } = await roomApi.joinByCode(joinCode.value.trim())
    auth.setCurrentRoomId(data.roomId)
    showJoinDialog.value = false
    joinCode.value = ''
    ElMessage.success('已加入房间')
    router.push('/room')
  } catch {
    ElMessage.error('房间不存在或已关闭')
  }
}

async function handleRequestRoom() {
  try {
    await roomRequestsApi.create()
    ElMessage.success('申请已提交，等待管理员审核')
  } catch {
    ElMessage.error('申请失败')
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
}

let timer: ReturnType<typeof setInterval>

onMounted(() => {
  loadRooms()
  timer = setInterval(loadRooms, 5000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-5xl font-extrabold text-on-surface font-display tracking-tight mb-2">房间列表</h1>
        <p class="text-on-surface-variant">{{ total }} 个在线房间</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative w-56">
          <input
            v-model="search"
            @input="loadRooms"
            class="w-full bg-surface-container border-none rounded-full px-5 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-primary outline-none"
            placeholder="搜索房间..."
          />
          <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline" style="font-size:20px">search</span>
        </div>
        <button
          @click="handleRequestRoom"
          class="flex items-center gap-2 px-5 py-2.5 bg-primary-container dark:bg-[var(--d-primary-container)] text-on-primary-container dark:text-[var(--d-primary)] rounded-full font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
        >
          <span class="material-symbols-outlined text-lg">add_circle</span>
          申请房间
        </button>
        <button
          @click="showJoinDialog = true"
          class="flex items-center gap-2 px-5 py-2.5 bg-primary-container dark:bg-[var(--d-primary-container)] text-on-primary-container dark:text-[var(--d-primary)] rounded-full font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
        >
          <span class="material-symbols-outlined text-lg">login</span>
          输入房间码
        </button>
      </div>
    </div>

    <!-- Room grid -->
    <div v-if="rooms.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="room in rooms"
        :key="room.id"
        class="rounded-2xl px-5 py-4 flex flex-wrap items-center gap-3"
      >
        <div class="flex items-center gap-2 shrink-0">
          <span class="material-symbols-outlined text-primary shrink-0" style="font-size:20px">meeting_room</span>
          <span class="text-sm font-bold text-on-surface font-headline whitespace-nowrap">{{ room.roomCode }}</span>
        </div>
        <span class="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium shrink-0">
          {{ room.currentUsers }} 人
        </span>
        <div class="flex items-center gap-1 text-xs text-outline shrink-0">
          <span class="material-symbols-outlined" style="font-size:16px">schedule</span>
          <span class="whitespace-nowrap">{{ formatDate(room.createdAt) }}</span>
        </div>
        <button
          @click="handleJoin(room)"
          class="shrink-0 px-5 py-2 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary hover:text-on-primary transition-all active:scale-95"
        >
          加入房间
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading" class="flex flex-col items-center justify-center py-24">
      <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
        <span class="material-symbols-outlined text-4xl text-primary">meeting_room</span>
      </div>
      <p class="text-lg font-bold text-on-surface font-headline mb-1">暂无在线房间</p>
      <p class="text-sm text-outline">输入房间码加入，或等待他人创建</p>
    </div>

    <!-- Join by code dialog -->
    <el-dialog v-model="showJoinDialog" title="加入房间" width="380px">
      <div>
        <label class="block text-sm font-semibold text-on-surface mb-1.5">房间码</label>
        <el-input v-model="joinCode" placeholder="输入 6 位房间码" size="large" @keyup.enter="handleJoinByCode" />
      </div>
      <template #footer>
        <el-button @click="showJoinDialog = false">取消</el-button>
        <el-button type="primary" @click="handleJoinByCode">加入</el-button>
      </template>
    </el-dialog>
  </div>
</template>
