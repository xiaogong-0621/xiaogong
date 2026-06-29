<template>
  <div class="p-8 space-y-8">
    <!-- Stats Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="bg-surface-container-lowest p-6 rounded-xl flex items-center justify-between shadow-sm"
      >
        <div>
          <p class="text-on-surface-variant text-sm font-medium font-body mb-1">{{ card.label }}</p>
          <h3 class="text-3xl font-bold font-headline text-on-surface">{{ card.value }}</h3>
        </div>
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center"
          :class="card.iconBg"
        >
          <span class="material-symbols-outlined" :class="card.iconColor">{{ card.icon }}</span>
        </div>
      </div>
    </div>

    <!-- Two Columns Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Left: Latest Rooms -->
      <div class="lg:col-span-7 bg-surface-container-lowest p-8 rounded-xl shadow-sm">
        <h3 class="text-lg font-bold font-headline mb-6 text-on-surface">最新房间动态</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-outline-variant/15 text-on-surface-variant text-sm font-medium">
                <th class="pb-4 pr-4 font-normal">房间码</th>
                <th class="pb-4 px-4 font-normal">当前人数</th>
                <th class="pb-4 px-4 font-normal">创建时间</th>
              </tr>
            </thead>
            <tbody class="text-sm text-on-surface font-body">
              <tr
                v-for="room in latestRooms"
                :key="room.id"
                class="border-b border-outline-variant/15 last:border-0 hover:bg-surface-container-low transition-colors"
              >
                <td class="py-4 pr-4 font-mono font-semibold">{{ room.roomCode }}</td>
                <td class="py-4 px-4">{{ room.currentUsers }} 人</td>
                <td class="py-4 px-4 text-on-surface-variant">{{ formatDate(room.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="latestRooms.length === 0" class="text-center py-8">
          <p class="text-on-surface-variant text-sm">暂无活跃房间</p>
        </div>
      </div>

      <!-- Right: Top Songs Ranking -->
      <div class="lg:col-span-5 bg-surface-container-lowest p-8 rounded-xl shadow-sm">
        <h3 class="text-lg font-bold font-headline mb-6 text-on-surface">热门歌曲排行</h3>
        <div class="space-y-4">
          <div
            v-for="(song, index) in topSongs"
            :key="song.id"
            class="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors group cursor-pointer"
          >
            <div class="flex items-center gap-4">
              <span
                class="text-xl font-bold font-headline w-6 text-center"
                :class="rankColor(index)"
              >{{ index + 1 }}</span>
              <img
                v-if="song.coverUrl"
                :src="'http://localhost:5276' + song.coverUrl"
                class="w-12 h-12 rounded overflow-hidden shrink-0 object-cover"
                :alt="song.title"
                @error="($event.target as HTMLImageElement).src = 'http://localhost:5276/uploads/covers/default.jpg'"
              />
              <div v-else class="w-12 h-12 bg-slate-200 rounded overflow-hidden shrink-0 flex items-center justify-center">
                <span class="material-symbols-outlined text-slate-400 text-lg">music_note</span>
              </div>
              <div>
                <p class="text-sm font-bold font-headline text-on-surface group-hover:text-primary transition-colors">{{ song.title }}</p>
                <p class="text-xs text-on-surface-variant font-body">{{ song.artist }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-on-surface">{{ formatPlayCount(song.playCount) }}</p>
              <p class="text-xs text-on-surface-variant">次播放</p>
            </div>
          </div>
        </div>
        <div v-if="topSongs.length === 0" class="text-center py-8">
          <p class="text-on-surface-variant text-sm">暂无播放数据</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { dashboardApi } from '@/api'
import type { DashboardStats, Song } from '@/types'
import { formatPlayCount } from '@/utils/format'

const stats = ref<DashboardStats>({
  activeRooms: 0,
  onlineUsers: 0,
  todayRooms: 0,
  totalUsers: 0,
})
const latestRooms = ref<any[]>([])
const topSongs = ref<Song[]>([])

const statCards = computed(() => [
  { icon: 'meeting_room', value: stats.value.activeRooms, label: '在线房间数', iconBg: 'bg-primary-fixed', iconColor: 'text-primary' },
  { icon: 'group', value: stats.value.onlineUsers, label: '在线用户数', iconBg: 'bg-secondary-fixed', iconColor: 'text-secondary' },
  { icon: 'add_home', value: stats.value.todayRooms, label: '今日创建房间', iconBg: 'bg-tertiary-fixed', iconColor: 'text-tertiary' },
  { icon: 'person', value: stats.value.totalUsers, label: '总注册用户', iconBg: 'bg-primary-container', iconColor: 'text-on-primary-container' },
])

function rankColor(index: number) {
  switch (index) {
    case 0: return 'text-tertiary'
    case 1: return 'text-secondary'
    case 2: return 'text-primary'
    default: return 'text-on-surface-variant'
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

let pollTimer: ReturnType<typeof setInterval> | null = null

async function loadDashboard() {
  try {
    const [statsRes, roomsRes, songsRes] = await Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getLatestRooms(),
      dashboardApi.getTopSongs(),
    ])
    stats.value = statsRes.data
    latestRooms.value = roomsRes.data as any[]
    topSongs.value = songsRes.data
  } catch { /* ignore poll errors */ }
}

onMounted(async () => {
  await loadDashboard()
  pollTimer = setInterval(loadDashboard, 3000)
})

onUnmounted(() => {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
})
</script>
