<template>
  <div class="p-8 flex flex-col gap-8 max-w-4xl mx-auto w-full">
    <!-- Back Button -->
    <button @click="router.push('/songs')" class="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors w-fit">
      <span class="material-symbols-outlined">arrow_back</span>
      <span class="font-medium">返回歌曲列表</span>
    </button>

    <!-- Loading -->
    <div v-if="loading" class="py-20 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      <p class="mt-2">加载中...</p>
    </div>

    <!-- Not Found -->
    <div v-else-if="!detail" class="py-20 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-4xl">error</span>
      <p class="mt-2">歌曲不存在</p>
    </div>

    <!-- Detail Content -->
    <template v-else>
      <!-- Header: Cover + Title -->
      <div class="flex gap-8 items-start">
        <div class="w-48 h-48 rounded overflow-hidden bg-surface-container-high flex-shrink-0 shadow-md relative group">
          <img :src="currentCoverUrl" class="w-full h-full object-cover" @error="($event.target as HTMLImageElement).src = BACKEND_BASE + DEFAULT_COVER" />
          <!-- Cover replace button (edit mode) -->
          <label v-if="editing" class="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
            <span class="material-symbols-outlined text-white text-3xl">edit</span>
            <input type="file" accept=".jpg,.jpeg,.png,.webp" class="hidden" @change="onCoverReplace" />
          </label>
        </div>
        <div class="flex-1 space-y-3">
          <div v-if="!editing">
            <h2 class="text-3xl font-display font-bold text-on-surface">{{ detail.title }}</h2>
            <p class="text-lg text-on-surface-variant mt-1">{{ detail.artist }}</p>
          </div>
          <div v-else class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-on-surface-variant mb-0.5">歌曲名称</label>
              <input v-model="editForm.title" class="w-full text-3xl font-display font-bold bg-transparent border-b-2 border-primary/30 focus:border-primary outline-none text-on-surface py-1" />
            </div>
            <div>
              <label class="block text-xs font-medium text-on-surface-variant mb-0.5">歌手</label>
              <input v-model="editForm.artist" class="w-full text-lg bg-transparent border-b-2 border-primary/30 focus:border-primary outline-none text-on-surface-variant py-1" />
            </div>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
              :class="detail.status === 'active'
                ? 'bg-primary-fixed text-on-primary-fixed'
                : 'bg-error/10 text-error'"
            >
              {{ detail.status === 'active' ? '已上架' : '已下架' }}
            </span>
            <button
              v-if="!editing"
              @click="toggleStatus"
              class="text-xs font-medium px-3 py-1 rounded-full border transition-colors"
              :class="detail.status === 'active'
                ? 'border-error/30 text-error hover:bg-error/10'
                : 'border-primary/30 text-primary hover:bg-primary/10'"
            >
              {{ detail.status === 'active' ? '下架' : '上架' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Detail Fields -->
      <div class="bg-surface-container-lowest rounded-2xl shadow-sm p-8">
        <div class="grid grid-cols-2 gap-x-12 gap-y-6">
          <!-- File Size -->
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">文件大小</label>
            <p class="text-on-surface">{{ formatFileSize(detail.fileSize) }}</p>
          </div>
          <!-- Duration -->
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">时长</label>
            <p class="text-on-surface">{{ formatDuration(detail.duration) }}</p>
          </div>
          <!-- Genre -->
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">风格</label>
            <p v-if="!editing" class="text-on-surface">{{ detail.genre }}</p>
            <select v-else v-model="editForm.genre" class="w-full px-3 py-2 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none">
              <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
          <!-- Language -->
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">语种</label>
            <p v-if="!editing" class="text-on-surface">{{ detail.language || '-' }}</p>
            <select v-else v-model="editForm.language" class="w-full px-3 py-2 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none">
              <option v-for="l in languages" :key="l" :value="l">{{ l }}</option>
            </select>
          </div>
          <!-- Play Count -->
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">播放量</label>
            <p class="text-on-surface">{{ formatPlayCount(detail.playCount) }}</p>
          </div>
          <!-- Favorite Count -->
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">收藏数</label>
            <p class="text-on-surface">{{ detail.favoriteCount }}</p>
          </div>
          <!-- Rating -->
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">评分</label>
            <p class="text-on-surface">{{ detail.rating || '-' }}</p>
          </div>
          <!-- Comment Count -->
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">评论数</label>
            <p class="text-on-surface">{{ detail.commentCount || '-' }}</p>
          </div>
          <!-- Ranking -->
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">榜单排行</label>
            <p class="text-on-surface">#{{ detail.ranking }}</p>
          </div>
          <!-- Created At -->
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">创建时间</label>
            <p class="text-on-surface">{{ formatDate(detail.createdAt) }}</p>
          </div>
        </div>

        <!-- Music File Section -->
        <div class="mt-8 pt-6 border-t border-surface-container-highest">
          <label class="block text-sm font-medium text-on-surface-variant mb-2">音乐文件</label>
          <div v-if="!editing" class="flex items-center gap-3 text-on-surface">
            <span class="material-symbols-outlined text-primary">audio_file</span>
            <span class="text-sm truncate">{{ detail.originalFileName || (detail.mediaUrl ? detail.mediaUrl.split('/').pop() : '未上传') }}</span>
          </div>
          <div v-else class="space-y-2">
            <div class="flex items-center gap-3 text-on-surface">
              <span class="material-symbols-outlined text-primary">audio_file</span>
              <span class="text-sm truncate">{{ currentMediaName }}</span>
            </div>
            <label class="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg cursor-pointer hover:bg-surface-container-highest transition-colors text-sm text-on-surface-variant">
              <span class="material-symbols-outlined text-sm">swap_horiz</span>
              替换音乐文件
              <input type="file" accept=".mp3,.flac" class="hidden" @change="onMusicReplace" />
            </label>
            <p class="text-xs text-on-surface-variant">替换后原文件将被删除</p>
          </div>
        </div>

        <!-- LRC File Section -->
        <div class="mt-8 pt-6 border-t border-surface-container-highest">
          <label class="block text-sm font-medium text-on-surface-variant mb-2">歌词文件</label>
          <div v-if="!editing" class="flex items-center gap-3 text-on-surface">
            <span class="material-symbols-outlined text-primary">lyrics</span>
            <span class="text-sm truncate">{{ detail.lrcUrl ? detail.lrcUrl.split('/').pop() : '未上传' }}</span>
          </div>
          <div v-else class="space-y-2">
            <div class="flex items-center gap-3 text-on-surface">
              <span class="material-symbols-outlined text-primary">lyrics</span>
              <span class="text-sm truncate">{{ currentLrcName }}</span>
            </div>
            <label class="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg cursor-pointer hover:bg-surface-container-highest transition-colors text-sm text-on-surface-variant">
              <span class="material-symbols-outlined text-sm">{{ detail.lrcUrl ? 'swap_horiz' : 'upload' }}</span>
              {{ detail.lrcUrl ? '替换歌词文件' : '上传歌词文件' }}
              <input type="file" accept=".lrc" class="hidden" @change="onLrcReplace" />
            </label>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-3">
        <template v-if="!editing">
          <button @click="startEditing" class="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-colors press-scale flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">edit</span>
            修改
          </button>
        </template>
        <template v-else>
          <button @click="cancelEditing" class="px-6 py-3 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container transition-colors">取消</button>
          <button @click="saveChanges" :disabled="saving" class="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2">
            <span v-if="saving" class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { songsApi, uploadApi } from '@/api'
import type { SongDetail } from '@/types'
import { formatPlayCount, formatDuration, formatFileSize } from '@/utils/format'

const BACKEND_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'https://localhost:5001'
const DEFAULT_COVER = '/uploads/covers/default.jpg'

const route = useRoute()
const router = useRouter()
const songId = Number(route.params.id)

const loading = ref(true)
const detail = ref<SongDetail | null>(null)
const editing = ref(false)
const saving = ref(false)
const genres = ['流行', '摇滚', '民谣', '电子', 'R&B', '嘻哈', '古典', '纯音乐']
const languages = ['中文', '英文', '日文', '韩文', '其他']

// Edit form state
const editForm = ref({
  title: '',
  artist: '',
  genre: '',
  language: '',
})
const newCoverFile = ref<File | null>(null)
const newCoverUrl = ref<string | null>(null)
const newMediaFile = ref<File | null>(null)
const newMediaUrl = ref<string | null>(null)
const newFileSize = ref<number | null>(null)
const newDuration = ref<number | null>(null)
const newLrcFile = ref<File | null>(null)
const newLrcUrl = ref<string | null>(null)

const currentCoverUrl = computed(() => {
  const url = newCoverUrl.value || detail.value?.coverUrl
  if (!url) return BACKEND_BASE + DEFAULT_COVER
  if (url.startsWith('blob:') || url.startsWith('http')) return url
  return BACKEND_BASE + url
})
const currentMediaName = computed(() => {
  if (newMediaFile.value) return newMediaFile.value.name
  return detail.value?.mediaUrl?.split('/').pop() || '未上传'
})
const currentLrcName = computed(() => {
  if (newLrcFile.value) return newLrcFile.value.name
  return detail.value?.lrcUrl?.split('/').pop() || '未上传'
})

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

async function fetchDetail() {
  loading.value = true
  try {
    const res = await songsApi.getDetail(songId)
    detail.value = res.data
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
}

function startEditing() {
  if (!detail.value) return
  editForm.value = {
    title: detail.value.title,
    artist: detail.value.artist,
    genre: detail.value.genre,
    language: detail.value.language || '中文',
  }
  newCoverFile.value = null
  newCoverUrl.value = null
  newMediaFile.value = null
  newMediaUrl.value = null
  newFileSize.value = null
  newDuration.value = null
  newLrcFile.value = null
  newLrcUrl.value = null
  editing.value = true
}

async function toggleStatus() {
  if (!detail.value) return
  const newStatus = detail.value.status === 'active' ? 'disabled' : 'active'
  const label = newStatus === 'disabled' ? '下架' : '上架'
  if (!confirm(`确定${label}歌曲「${detail.value.title}」？`)) return
  await songsApi.update(songId, { status: newStatus })
  await fetchDetail()
}

function cancelEditing() {
  editing.value = false
  newCoverUrl.value = null
  newMediaUrl.value = null
}

function onCoverReplace(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  newCoverFile.value = file
  newCoverUrl.value = URL.createObjectURL(file)
}

function onMusicReplace(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  // Confirm replacement
  if (!confirm('替换后原文件将被删除，确定继续？')) {
    (e.target as HTMLInputElement).value = ''
    return
  }

  newMediaFile.value = file
  newFileSize.value = file.size

  // Read duration
  const audio = new Audio()
  audio.preload = 'metadata'
  audio.onloadedmetadata = () => {
    newDuration.value = Math.round(audio.duration)
    URL.revokeObjectURL(audio.src)
  }
  audio.src = URL.createObjectURL(file)
}

function onLrcReplace(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  newLrcFile.value = file
}

async function saveChanges() {
  if (!detail.value) return
  saving.value = true
  try {
    const updateData: Record<string, any> = {}

    // Upload new cover if selected
    if (newCoverFile.value) {
      const res = await uploadApi.cover(newCoverFile.value)
      updateData.coverUrl = res.data.url
    }

    // Upload new music if selected
    if (newMediaFile.value) {
      const res = await uploadApi.music(newMediaFile.value)
      updateData.mediaUrl = res.data.url
      updateData.fileSize = newFileSize.value
      if (newDuration.value) updateData.duration = newDuration.value
    }

    // Upload new LRC if selected
    if (newLrcFile.value) {
      const res = await uploadApi.lrc(newLrcFile.value)
      updateData.lrcUrl = res.data.url
    }

    // Text fields (always send to allow updates)
    updateData.title = editForm.value.title
    updateData.artist = editForm.value.artist
    updateData.genre = editForm.value.genre
    updateData.language = editForm.value.language

    await songsApi.update(songId, updateData)

    // Refresh detail
    editing.value = false
    await fetchDetail()
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchDetail()
})
</script>
