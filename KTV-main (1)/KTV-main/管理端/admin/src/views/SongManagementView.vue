<template>
  <div class="p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-display font-bold text-on-surface">歌曲管理</h2>
      <button @click="openAddDialog" class="px-6 py-3 bg-primary text-on-primary rounded-lg font-headline font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm press-scale">
        <span class="material-symbols-outlined text-sm">add</span>
        新增歌曲
      </button>
    </div>

    <!-- Stats Cards -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-surface-container-lowest rounded-lg p-6 flex flex-col gap-2 relative shadow-sm">
        <div class="flex items-center gap-3 text-on-surface-variant">
          <span class="material-symbols-outlined text-primary">album</span>
          <span class="font-label text-sm font-medium">总曲目</span>
        </div>
        <div class="font-display font-bold text-3xl text-on-surface">{{ songStats.totalSongs }}</div>
      </div>
      <div class="bg-surface-container-lowest rounded-lg p-6 flex flex-col gap-2 relative shadow-sm">
        <div class="flex items-center gap-3 text-on-surface-variant">
          <span class="material-symbols-outlined text-tertiary-container">library_add</span>
          <span class="font-label text-sm font-medium">本周新增</span>
        </div>
        <div class="font-display font-bold text-3xl text-on-surface">{{ songStats.weeklyNew }}</div>
      </div>
      <div class="bg-surface-container-lowest rounded-lg p-6 flex flex-col gap-2 relative shadow-sm">
        <div class="flex items-center gap-3 text-on-surface-variant">
          <span class="material-symbols-outlined text-secondary">play_circle</span>
          <span class="font-label text-sm font-medium">今日播放量</span>
        </div>
        <div class="font-display font-bold text-3xl text-on-surface">{{ formatPlayCount(songStats.todayPlays) }}</div>
      </div>
    </section>

    <!-- Search Row -->
    <section class="flex flex-col md:flex-row justify-between items-center gap-4">
      <div class="flex items-center gap-3 w-full md:w-auto">
        <div class="relative flex-1 md:w-96">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            v-model="searchQuery"
            @input="onSearch"
            class="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border-none rounded-lg text-on-surface placeholder:text-outline-variant shadow-sm focus:ring-2 focus:ring-primary/20 transition-shadow"
            placeholder="搜索歌曲、歌手..."
            type="text"
          />
        </div>
        <select
          v-model="statusFilter"
          @change="onStatusFilter"
          class="px-4 py-3 bg-surface-container-lowest border-none rounded-lg text-on-surface shadow-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
        >
          <option value="">全部状态</option>
          <option value="active">已上架</option>
          <option value="disabled">已下架</option>
        </select>
      </div>
    </section>

    <!-- Data Table -->
    <section class="bg-surface-container-lowest rounded-lg shadow-sm flex flex-col">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-low text-on-surface-variant font-label text-sm border-b border-surface-container-highest">
              <th class="p-4 font-medium w-24">封面</th>
              <th class="p-4 font-medium">歌曲名称</th>
              <th class="p-4 font-medium">歌手</th>
              <th class="p-4 font-medium">风格</th>
              <th class="p-4 font-medium">状态</th>
              <th class="p-4 font-medium text-right w-32">操作</th>
            </tr>
          </thead>
          <tbody class="text-sm font-body text-on-surface">
            <tr
              v-for="song in songs"
              :key="song.id"
              class="border-b border-surface-container-highest last:border-0 hover:bg-surface transition-colors group"
            >
              <td class="p-4">
                <img
                  :src="song.coverUrl ? BACKEND_BASE + song.coverUrl : BACKEND_BASE + DEFAULT_COVER"
                  class="w-12 h-12 rounded object-cover cursor-pointer transition-transform duration-200 hover:scale-[2.5] hover:shadow-lg hover:z-10 relative"
                  :alt="song.title"
                  @error="($event.target as HTMLImageElement).src = BACKEND_BASE + DEFAULT_COVER"
                />
              </td>
              <td class="p-4 font-medium">{{ song.title }}</td>
              <td class="p-4 text-on-surface-variant">{{ song.artist }}</td>
              <td class="p-4 text-on-surface-variant">{{ song.genre }}</td>
              <td class="p-4">
                <span
                  class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                  :class="song.status === 'active'
                    ? 'bg-primary-fixed text-on-primary-fixed'
                    : 'bg-error/10 text-error'"
                >
                  {{ song.status === 'active' ? '已上架' : '已下架' }}
                </span>
              </td>
              <td class="p-4 text-right space-x-2">
                <button @click="goToDetail(song.id)" class="text-primary hover:text-secondary transition-colors font-medium">详情</button>
                <button @click="handleDelete(song)" class="text-error hover:text-error/80 transition-colors font-medium">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="songs.length === 0" class="py-16 text-center text-on-surface-variant">
        <span class="material-symbols-outlined text-4xl text-outline-variant">library_music</span>
        <p class="mt-2">暂无歌曲数据</p>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="p-4 border-t border-surface-container-highest flex justify-end items-center gap-2 text-sm text-on-surface-variant">
        <button
          class="p-1 text-outline hover:text-on-surface transition-colors disabled:opacity-50"
          :disabled="currentPage <= 1"
          @click="currentPage--; fetchSongs()"
        >
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <button
          v-for="page in displayedPages"
          :key="page"
          class="px-3 py-1 rounded font-medium transition-colors cursor-pointer"
          :class="page === currentPage
            ? 'bg-primary text-on-primary'
            : page === '...'
              ? 'cursor-default'
              : 'hover:bg-surface-container-low'"
          @click="page !== '...' && (currentPage = page as number, fetchSongs())"
        >{{ page }}</button>
        <button
          class="p-1 text-outline hover:text-on-surface transition-colors disabled:opacity-50"
          :disabled="currentPage >= totalPages"
          @click="currentPage++; fetchSongs()"
        >
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </section>

    <!-- Add Song Dialog -->
    <div v-if="showDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showDialog = false">
      <div class="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg p-8 space-y-5">
        <h3 class="text-xl font-display font-bold text-on-surface">新增歌曲</h3>
        <form @submit.prevent="handleSave" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">歌曲名称 *</label>
            <input v-model="form.title" required class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">歌手 *</label>
            <input v-model="form.artist" required class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-on-surface-variant mb-1">风格 *</label>
              <select v-model="form.genre" class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none">
                <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-on-surface-variant mb-1">语种 *</label>
              <select v-model="form.language" class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none">
                <option v-for="l in languages" :key="l" :value="l">{{ l }}</option>
              </select>
            </div>
          </div>

          <!-- Music Upload -->
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">音乐文件 *</label>
            <div class="flex items-center gap-3">
              <label class="flex-1 flex items-center gap-3 px-4 py-3 bg-surface-container-high rounded-lg cursor-pointer hover:bg-surface-container-highest transition-colors">
                <span class="material-symbols-outlined text-on-surface-variant">audio_file</span>
                <span class="text-sm text-on-surface-variant truncate">
                  {{ musicFile ? musicFile.name : '选择 MP3/FLAC 文件（最大 100MB）' }}
                </span>
                <input type="file" accept=".mp3,.flac" class="hidden" @change="onMusicSelected" />
              </label>
              <span v-if="uploadingMusic" class="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            </div>
            <p v-if="musicUploadError" class="mt-1 text-xs text-error">{{ musicUploadError }}</p>
            <p v-if="form.mediaUrl" class="mt-1 text-xs text-on-surface-variant">时长：{{ formatDuration(form.duration) }} · {{ formatFileSize(form.fileSize) }}</p>
          </div>

          <!-- Cover Upload -->
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">封面图片（可选）</label>
            <div class="flex items-center gap-3">
              <div v-if="coverPreview" class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img :src="coverPreview" class="w-full h-full object-cover" />
              </div>
              <label class="flex-1 flex items-center gap-3 px-4 py-3 bg-surface-container-high rounded-lg cursor-pointer hover:bg-surface-container-highest transition-colors">
                <span class="material-symbols-outlined text-on-surface-variant">image</span>
                <span class="text-sm text-on-surface-variant truncate">
                  {{ coverFile ? coverFile.name : '选择封面图片（JPG/PNG/WebP，最大 5MB）' }}
                </span>
                <input type="file" accept=".jpg,.jpeg,.png,.webp" class="hidden" @change="onCoverSelected" />
              </label>
              <span v-if="uploadingCover" class="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            </div>
            <p v-if="coverUploadError" class="mt-1 text-xs text-error">{{ coverUploadError }}</p>
          </div>

          <!-- LRC Upload -->
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">歌词文件（可选）</label>
            <div class="flex items-center gap-3">
              <label class="flex-1 flex items-center gap-3 px-4 py-3 bg-surface-container-high rounded-lg cursor-pointer hover:bg-surface-container-highest transition-colors">
                <span class="material-symbols-outlined text-on-surface-variant">lyrics</span>
                <span class="text-sm text-on-surface-variant truncate">
                  {{ lrcFile ? lrcFile.name : '选择 LRC 歌词文件（最大 1MB）' }}
                </span>
                <input type="file" accept=".lrc" class="hidden" @change="onLrcSelected" />
              </label>
              <span v-if="uploadingLrc" class="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            </div>
            <p v-if="lrcUploadError" class="mt-1 text-xs text-error">{{ lrcUploadError }}</p>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showDialog = false" class="px-6 py-3 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container transition-colors">取消</button>
            <button type="submit" :disabled="saving || uploadingMusic || uploadingCover || uploadingLrc" class="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>

  <!-- Toast -->
  <Transition name="toast">
    <div v-if="toastMsg" class="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-error text-on-error px-6 py-3 rounded-xl shadow-lg text-sm font-medium">
      {{ toastMsg }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { songsApi, uploadApi } from '@/api'
import type { Song, SongStats } from '@/types'
import { formatPlayCount, formatDuration, formatFileSize } from '@/utils/format'
import { useToast } from '@/composables/useToast'
import jsmediatags from 'jsmediatags'

const BACKEND_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'https://localhost:5001'
const DEFAULT_COVER = '/uploads/covers/default.jpg'

// Toast
const { toastMsg, showToast } = useToast()

const router = useRouter()
const songs = ref<Song[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const statusFilter = ref('')
let searchTimer: ReturnType<typeof setTimeout>

const songStats = ref<SongStats>({ totalSongs: 0, weeklyNew: 0, todayPlays: 0 })
const genres = ['流行', '摇滚', '民谣', '电子', 'R&B', '嘻哈', '古典', '纯音乐']
const languages = ['中文', '英文', '日文', '韩文', '其他']

// Dialog state
const showDialog = ref(false)
const saving = ref(false)

// File upload state
const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)
const uploadingCover = ref(false)
const coverUploadError = ref('')

const musicFile = ref<File | null>(null)
const uploadingMusic = ref(false)
const musicUploadError = ref('')

const lrcFile = ref<File | null>(null)
const uploadingLrc = ref(false)
const lrcUploadError = ref('')

const form = ref({
  title: '',
  artist: '',
  genre: '流行',
  language: '中文',
  duration: 0,
  fileSize: 0 as number | null,
  coverUrl: null as string | null,
  mediaUrl: null as string | null,
  lrcUrl: null as string | null,
  originalFileName: null as string | null,
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const displayedPages = computed(() => {
  const pages: (number | string)[] = []
  const tp = totalPages.value
  const cp = currentPage.value
  if (tp <= 5) {
    for (let i = 1; i <= tp; i++) pages.push(i)
  } else {
    pages.push(1)
    if (cp > 3) pages.push('...')
    for (let i = Math.max(2, cp - 1); i <= Math.min(tp - 1, cp + 1); i++) pages.push(i)
    if (cp < tp - 2) pages.push('...')
    pages.push(tp)
  }
  return pages
})

async function fetchSongs() {
  const res = await songsApi.getList({
    search: searchQuery.value || undefined,
    status: statusFilter.value,
    page: currentPage.value,
    pageSize: pageSize.value,
  })
  songs.value = res.data.items
  total.value = res.data.total
}

async function fetchStats() {
  const res = await songsApi.getStats()
  songStats.value = res.data
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchSongs()
  }, 300)
}

function onStatusFilter() {
  currentPage.value = 1
  fetchSongs()
}

function goToDetail(id: number) {
  router.push(`/songs/${id}`)
}

function openAddDialog() {
  form.value = { title: '', artist: '', genre: '流行', language: '中文', duration: 0, fileSize: null, coverUrl: null, mediaUrl: null, lrcUrl: null, originalFileName: null }
  coverFile.value = null
  coverPreview.value = null
  coverUploadError.value = ''
  musicFile.value = null
  lrcFile.value = null
  lrcUploadError.value = ''
  showDialog.value = true
}

function onCoverSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  coverFile.value = file
  coverPreview.value = URL.createObjectURL(file)
  coverUploadError.value = ''
}

function onLrcSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  lrcFile.value = file
  lrcUploadError.value = ''
}

function parseFilename(file: File): { title: string; artist: string } {
  let name = file.name.replace(/\.(mp3|flac)$/i, '').replace(/\s*\[.*?\]\s*/g, '').trim()
  const parts = name.split(/\s*-\s*/)
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join('-').trim() }
  }
  return { title: name, artist: '' }
}

function readId3Tags(file: File): Promise<{ title: string; artist: string; coverBlob: Blob | null }> {
  return new Promise((resolve) => {
    jsmediatags.read(file, {
      onSuccess: (tag) => {
        const t = tag.tags as any
        let coverBlob: Blob | null = null
        if (t.picture) {
          const { data, format } = t.picture
          const bytes = new Uint8Array(data)
          coverBlob = new Blob([bytes], { type: format })
        }
        resolve({
          title: t.title || '',
          artist: t.artist || '',
          coverBlob,
        })
      },
      onError: () => resolve({ title: '', artist: '', coverBlob: null }),
    })
  })
}

async function onMusicSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  musicFile.value = file
  form.value.mediaUrl = null
  musicUploadError.value = ''

  // Read duration from MP3 file
  const audio = new Audio()
  audio.preload = 'metadata'
  audio.onloadedmetadata = () => {
    form.value.duration = Math.round(audio.duration)
    URL.revokeObjectURL(audio.src)
  }
  audio.src = URL.createObjectURL(file)

  // Auto-fill title, artist, cover from ID3 tags (only when fields are empty)
  const id3 = await readId3Tags(file)

  // Title: ID3 → filename fallback
  if (!form.value.title) {
    if (id3.title) {
      form.value.title = id3.title
    } else {
      const parsed = parseFilename(file)
      form.value.title = parsed.title
    }
  }

  // Artist: ID3 → filename fallback
  if (!form.value.artist) {
    if (id3.artist) {
      form.value.artist = id3.artist
    } else {
      const parsed = parseFilename(file)
      form.value.artist = parsed.artist
    }
  }

  // Cover: from ID3 embedded picture (only when no cover set)
  if (!coverFile.value && id3.coverBlob) {
    const coverFromId3 = new File([id3.coverBlob], 'cover.jpg', { type: id3.coverBlob.type })
    coverFile.value = coverFromId3
    coverPreview.value = URL.createObjectURL(coverFromId3)
  }
}

async function handleSave() {
  saving.value = true
  try {
    // Upload music first (required)
    if (musicFile.value) {
      uploadingMusic.value = true
      try {
        const res = await uploadApi.music(musicFile.value)
        form.value.mediaUrl = res.data.url
        form.value.fileSize = musicFile.value.size
        form.value.originalFileName = res.data.originalName
      } catch (err: any) {
        musicUploadError.value = err.response?.data?.message || '音乐文件上传失败'
        return
      } finally {
        uploadingMusic.value = false
      }
    }

    if (!form.value.mediaUrl) {
      musicUploadError.value = '请上传音乐文件'
      return
    }

    if (form.value.mediaUrl.includes('wwwroot') || /^[A-Z]:\\/i.test(form.value.mediaUrl)) {
      musicUploadError.value = '非法路径，请重新选择音乐文件'
      return
    }

    // Upload cover (optional)
    if (coverFile.value) {
      uploadingCover.value = true
      try {
        const res = await uploadApi.cover(coverFile.value)
        form.value.coverUrl = res.data.url
      } catch (err: any) {
        coverUploadError.value = err.response?.data?.message || '封面上传失败'
        return
      } finally {
        uploadingCover.value = false
      }
    }

    // Upload LRC (optional)
    if (lrcFile.value) {
      uploadingLrc.value = true
      try {
        const res = await uploadApi.lrc(lrcFile.value)
        form.value.lrcUrl = res.data.url
      } catch (err: any) {
        lrcUploadError.value = err.response?.data?.message || '歌词文件上传失败'
        return
      } finally {
        uploadingLrc.value = false
      }
    }

    await songsApi.create(form.value as Partial<Song>)
    showDialog.value = false
    await fetchSongs()
    await fetchStats()
  } finally {
    saving.value = false
  }
}

async function handleDelete(song: Song) {
  if (!confirm(`确定删除歌曲「${song.title}」吗？`)) return
  try {
    await songsApi.delete(song.id)
    await fetchSongs()
    await fetchStats()
  } catch (err: any) {
    showToast(err.response?.data?.message || '删除失败')
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  fetchStats()
  fetchSongs()
  pollTimer = setInterval(() => {
    fetchStats()
    fetchSongs()
  }, 3000)
})

onUnmounted(() => {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
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
