<template>
  <div class="p-8 flex flex-col gap-8">
    <!-- Page Header -->
    <div class="flex flex-col gap-6">
      <h2 class="text-3xl font-display font-bold text-on-surface">反馈管理</h2>
      <div class="flex items-center justify-between bg-surface-container-lowest p-2 rounded-xl ring-1 ring-outline-variant/15">
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
            placeholder="搜索歌曲名或用户名..."
            type="text"
          />
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-surface-container-lowest rounded-xl p-6 ring-1 ring-outline-variant/15 flex-1 shadow-[0_8px_32px_rgba(25,28,30,0.03)]">
      <div class="w-full">
        <!-- Header -->
        <div class="grid grid-cols-7 gap-4 py-4 text-sm font-semibold text-on-surface-variant uppercase tracking-wider px-4">
          <div>反馈用户</div>
          <div>歌曲名</div>
          <div>歌手</div>
          <div>反馈类型</div>
          <div>提交时间</div>
          <div>状态</div>
          <div class="text-right">操作</div>
        </div>
        <!-- Rows -->
        <div
          v-for="fb in feedbacks"
          :key="fb.id"
          class="grid grid-cols-7 gap-4 py-5 items-center px-4 rounded-lg hover:bg-surface-container-low transition-colors"
        >
          <div class="font-medium text-on-surface">{{ fb.displayName || fb.username || '--' }}</div>
          <div class="text-sm text-on-surface-variant">{{ fb.songName || '--' }}</div>
          <div class="text-sm text-on-surface-variant">{{ fb.artist || '--' }}</div>
          <div>
            <span
              class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold"
              :class="feedbackTypeClass(fb.feedbackType)"
            >
              {{ formatFeedbackType(fb.feedbackType) }}
            </span>
          </div>
          <div class="text-sm text-on-surface-variant">{{ formatDate(fb.createdAt) }}</div>
          <div>
            <span
              class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold"
              :class="fb.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'"
            >
              {{ fb.status === 'pending' ? '待处理' : '已处理' }}
            </span>
          </div>
          <div class="flex justify-end gap-2">
            <button
              v-if="fb.status === 'pending'"
              @click="handleProcess(fb.id)"
              class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              标记已处理
            </button>
            <span v-else class="text-xs text-on-surface-variant/50">--</span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="feedbacks.length === 0" class="text-center py-16">
        <span class="material-symbols-outlined text-5xl text-surface-container-highest">inbox</span>
        <p class="text-on-surface-variant mt-4">暂无反馈</p>
      </div>

      <!-- Pagination -->
      <div v-if="total > 0" class="flex justify-between items-center mt-8 pt-4 border-t-0 text-sm text-on-surface-variant">
        <p>显示 {{ feedbacks.length }} 条，共 {{ total }} 条</p>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { feedbacksApi } from '@/api'
import type { Feedback } from '@/types'

const feedbacks = ref<Feedback[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const activeStatus = ref('')
const searchQuery = ref('')

const statusTabs = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '已处理', value: 'processed' },
]

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

function feedbackTypeClass(type: string) {
  switch (type) {
    case 'request_song': return 'bg-primary/10 text-primary'
    case 'report_error': return 'bg-error/10 text-error'
    case 'other': return 'bg-surface-container-high text-on-surface-variant'
    default: return 'bg-surface-variant text-on-surface-variant'
  }
}

function formatFeedbackType(type: string) {
  switch (type) {
    case 'request_song': return '请求添加歌曲'
    case 'report_error': return '歌曲信息纠错'
    case 'other': return '其他建议'
    default: return type
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function fetchFeedbacks() {
  const res = await feedbacksApi.getList({
    status: activeStatus.value || undefined,
    search: searchQuery.value || undefined,
    page: currentPage.value,
    pageSize: pageSize.value,
  })
  feedbacks.value = res.data.items
  total.value = res.data.total
}

async function handleProcess(id: number) {
  if (!confirm('确定标记为已处理？')) return
  await feedbacksApi.markProcessed(id)
  await fetchFeedbacks()
}

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  fetchFeedbacks()
  pollTimer = setInterval(fetchFeedbacks, 3000)
})

onUnmounted(() => {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
})

watch([activeStatus, searchQuery], () => {
  currentPage.value = 1
  fetchFeedbacks()
})

watch(currentPage, () => {
  fetchFeedbacks()
})
</script>
