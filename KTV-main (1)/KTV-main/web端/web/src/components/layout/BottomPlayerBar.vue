<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useAuthStore } from '@/stores/auth'
import { favoritesApi, chatApi, playbackApi, roomApi } from '@/api'
import { parseLrc, findCurrentLine, type LyricLine } from '@/utils/lrcParser'
import { useParticleBurst } from '@/composables/useParticleBurst'
import { useHeartAnimation } from '@/composables/useHeartAnimation'
import { useSwitchFeedback } from '@/composables/useSwitchFeedback'

const player = usePlayerStore()
const auth = useAuthStore()
const { burst } = useParticleBurst()
const { toggleHeart } = useHeartAnimation()
const { rowClass, triggerCoverFly } = useSwitchFeedback()
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'https://localhost:5001'

const showLyrics = ref(false)

// --- Lyrics ---
const lyrics = ref<LyricLine[]>([])
const lyricsContainer = ref<HTMLElement | null>(null)
const lyricsOffset = ref(0)
const currentLine = computed(() => findCurrentLine(lyrics.value, player.currentTime + lyricsOffset.value))

async function fetchLyrics(lrcUrl: string) {
  try {
    const res = await fetch(API_BASE + lrcUrl)
    const text = await res.text()
    lyrics.value = parseLrc(text)
  } catch {
    lyrics.value = []
  }
}

watch(() => player.currentTrack?.lrcUrl, (url) => {
  if (url) fetchLyrics(url)
  else lyrics.value = []
}, { immediate: true })

watch(currentLine, async (idx) => {
  if (idx < 0 || !lyricsContainer.value) return
  await nextTick()
  const el = lyricsContainer.value.querySelector(`[data-line="${idx}"]`) as HTMLElement
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
})

function seekToLine(time: number) {
  if (!player.isSongOwner) return
  apiSeek(time)
}

// --- Playback sync controls ---
async function apiTogglePlay() {
  if (!player.hasTrack) return
  if (player.isPlaying) {
    await playbackApi.pause()
  } else {
    await playbackApi.resume()
  }
}
async function apiPlayNext() {
  await playbackApi.next()
}
async function apiPlayPrev() {
  await playbackApi.prev()
}
async function apiTogglePlayMode() {
  const modes: Array<'off' | 'repeat-all' | 'repeat-one' | 'shuffle'> = ['off', 'repeat-all', 'repeat-one', 'shuffle']
  const idx = modes.indexOf(player.playMode)
  const next = modes[(idx + 1) % modes.length]
  await playbackApi.setMode(next)
}
async function apiSeek(position: number) {
  await playbackApi.seek(position)
}

function seekAndSync(position: number) {
  player.seek(position)
  apiSeek(position)
}

// --- Wheel handler for lyrics overlay ---
function onOverlayWheel(e: WheelEvent) {
  const el = e.target as HTMLElement
  // Find nearest scrollable ancestor
  let cur: HTMLElement | null = el
  while (cur) {
    const style = window.getComputedStyle(cur)
    const oy = style.overflowY
    if ((oy === 'auto' || oy === 'scroll') && cur.scrollHeight > cur.clientHeight) {
      // Let this element handle scrolling naturally
      return
    }
    cur = cur.parentElement
    if (cur?.classList.contains('fixed')) break // stop at overlay root
  }
  // No scrollable ancestor found — block scroll from reaching page behind
  e.preventDefault()
}

// --- Funnel style ---
function lineStyle(i: number) {
  const dist = Math.abs(i - currentLine.value)
  if (currentLine.value < 0) return { transform: 'scale(0.85)', opacity: 0.4, color: 'rgba(255,255,255,0.4)' }
  if (dist === 0) return { transform: 'scale(1.15)', opacity: 1, color: '#fff' }
  if (dist === 1) return { transform: 'scale(0.95)', opacity: 0.75, color: 'rgba(255,255,255,0.75)' }
  if (dist === 2) return { transform: 'scale(0.88)', opacity: 0.55, color: 'rgba(255,255,255,0.55)' }
  if (dist === 3) return { transform: 'scale(0.82)', opacity: 0.4, color: 'rgba(255,255,255,0.4)' }
  return { transform: 'scale(0.78)', opacity: 0.3, color: 'rgba(255,255,255,0.3)' }
}

// --- Play mode ---
const playModeIcon = computed(() => {
  switch (player.playMode) {
    case 'repeat-all': return 'repeat'
    case 'repeat-one': return 'repeat_one'
    case 'shuffle': return 'shuffle'
    default: return 'trending_flat'
  }
})
const playModeLabel = computed(() => {
  switch (player.playMode) {
    case 'repeat-all': return '列表循环'
    case 'repeat-one': return '单曲循环'
    case 'shuffle': return '随机播放'
    default: return '顺序播放'
  }
})

// --- Volume ---
function onVolumeClick(e: MouseEvent) {
  const bar = e.currentTarget as HTMLElement
  const rect = bar.getBoundingClientRect()
  player.setVolume(Math.round(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * 100))
}
function onVolumeMousedown(e: MouseEvent) {
  const bar = e.currentTarget as HTMLElement
  const onMove = (ev: MouseEvent) => {
    const rect = bar.getBoundingClientRect()
    player.setVolume(Math.round(Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width)) * 100))
  }
  const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
const volumeIcon = computed(() => {
  if (player.volume === 0) return 'volume_off'
  if (player.volume < 30) return 'volume_mute'
  if (player.volume < 70) return 'volume_down'
  return 'volume_up'
})

// --- Favorites ---
const favoriteIds = ref<Set<number>>(new Set())
async function loadFavorites() {
  try { const res = await favoritesApi.getList(); favoriteIds.value = new Set(res.data.map((f: any) => f.songId)) } catch {}
}
async function toggleFavorite(songId: number, event: MouseEvent) {
  const btn = event.currentTarget as HTMLElement
  const wasFav = favoriteIds.value.has(songId)
  if (!wasFav) burst(btn)
  toggleHeart(btn, !wasFav, async () => {
    if (wasFav) { await favoritesApi.remove(songId); favoriteIds.value.delete(songId) }
    else { await favoritesApi.add(songId); favoriteIds.value.add(songId) }
    favoriteIds.value = new Set(favoriteIds.value)
  })
}
onMounted(loadFavorites)

// --- Chat ---
const chatMessages = ref<{ nickname: string; message: string; timestamp: string }[]>([])
const chatInput = ref('')
const chatContainer = ref<HTMLElement | null>(null)
let chatPollTimer: ReturnType<typeof setInterval> | null = null

async function loadChatMessages() {
  if (!auth.currentRoomId) return
  try {
    const { data } = await chatApi.getMessages(auth.currentRoomId)
    const mapped = data.map(m => ({ nickname: m.nickname, message: m.message, timestamp: m.timestamp }))
    if (mapped.length === chatMessages.value.length && mapped.every((m, i) => m.message === chatMessages.value[i].message && m.timestamp === chatMessages.value[i].timestamp)) return
    chatMessages.value = mapped
    nextTick(() => { if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight })
  } catch { /* ignore */ }
}

async function sendChatMessage() {
  if (!chatInput.value.trim() || !auth.currentRoomId) return
  try {
    await chatApi.sendMessage(auth.currentRoomId, chatInput.value.trim())
    chatInput.value = ''
    await loadChatMessages()
  } catch { /* ignore */ }
}

onMounted(() => { chatPollTimer = setInterval(loadChatMessages, 2000) })
onUnmounted(() => { if (chatPollTimer) { clearInterval(chatPollTimer); chatPollTimer = null } })

// --- Drag reorder (server-side only) ---
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
function onDragStart(i: number, e: DragEvent) {
  dragIndex.value = i; if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}
function onDragOver(i: number, e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dragOverIndex.value = i
}
function onDragLeave() { dragOverIndex.value = null }
async function onDrop(i: number, e: DragEvent) {
  e.preventDefault()
  if (dragIndex.value === null || dragIndex.value === i) { dragIndex.value = null; dragOverIndex.value = null; return }
  const from = dragIndex.value
  dragIndex.value = null; dragOverIndex.value = null

  const ids = [...player.queue.map(t => t.queueItemId)]
  const [item] = ids.splice(from, 1)
  ids.splice(i, 0, item)
  try { await roomApi.reorderBatch(ids) } catch {}
}
function onDragEnd() { dragIndex.value = null; dragOverIndex.value = null }

// --- Auto-scroll playlist to current + cover fly ---
const playlistContainer = ref<HTMLElement | null>(null)
const heroCoverRef = ref<HTMLElement | null>(null)
watch(() => player.currentQueueItemId, async (newQid, oldQid) => {
  if (newQid == null || !playlistContainer.value) return
  await nextTick()
  const el = playlistContainer.value.querySelector(`[data-playlist-qid="${newQid}"]`) as HTMLElement
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  // Cover fly: animate to hero cover in lyrics overlay
  if (oldQid != null && newQid !== oldQid && heroCoverRef.value) {
    triggerCoverFly(playlistContainer.value, heroCoverRef.value)
  }
})

// --- Keydown ---
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showLyrics.value) showLyrics.value = false
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// --- Progress ---
const progressPercent = computed(() => {
  if (player.duration <= 0) return 0
  return (player.currentTime / player.duration) * 100
})

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function onProgressClick(e: MouseEvent) {
  if (!player.hasTrack || !player.isSongOwner) return
  const bar = e.currentTarget as HTMLElement
  const rect = bar.getBoundingClientRect()
  const pos = ((e.clientX - rect.left) / rect.width) * player.duration
  apiSeek(pos)
}

function onProgressMousedown(e: MouseEvent) {
  if (!player.hasTrack || !player.isSongOwner) return
  player.isDragging = true
  const bar = e.currentTarget as HTMLElement
  let lastSeekTime = 0
  const onMove = (ev: MouseEvent) => {
    const rect = bar.getBoundingClientRect()
    const pos = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width)) * player.duration
    player.seek(pos)
    const now = Date.now()
    if (now - lastSeekTime > 500) {
      lastSeekTime = now
      apiSeek(pos)
    }
  }
  const onUp = () => {
    player.isDragging = false
    apiSeek(player.currentTime)
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function openLyrics() { if (player.hasTrack) showLyrics.value = true }
function closeLyrics() { showLyrics.value = false }

const coverSrc = computed(() =>
  player.currentTrack?.coverUrl
    ? API_BASE + player.currentTrack.coverUrl
    : API_BASE + '/uploads/covers/default.jpg'
)
</script>

<template>
  <!-- ====== 胶囊播放器 ====== -->
  <footer class="player-capsule fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-white/80 backdrop-blur-2xl rounded-full pl-2 pr-6 py-2 shadow-[0_8px_40px_rgba(0,0,0,0.12)] transition-all duration-500"
    :class="showLyrics ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100'"
    style="max-width: 610px;">

    <!-- Cover (click to open lyrics) -->
    <div class="shrink-0" :class="player.hasTrack ? 'cursor-pointer' : 'cursor-default'" @click="openLyrics">
      <div class="relative w-14 h-14 rounded-full overflow-hidden shadow-lg group">
        <img
          :src="coverSrc"
          class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          :alt="player.currentTrack?.title ?? '封面'"
          @error="($event.target as HTMLImageElement).src = API_BASE + '/uploads/covers/default.jpg'"
        />
        <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span class="material-symbols-outlined text-white text-xl">expand_less</span>
        </div>
      </div>
    </div>

    <!-- Info + progress -->
    <div class="flex-1 min-w-0">
      <p v-if="player.hasTrack" class="text-sm font-bold truncate dark:text-[var(--d-on-surface)]">
        {{ player.currentTrack.title }} <span class="font-normal text-slate-500 dark:text-[var(--d-on-surface-variant)]">- {{ player.currentTrack.artist }}</span>
        <span v-if="player.currentTrack.orderedByName" class="ml-1 text-[10px] font-normal text-primary/60 dark:text-[var(--d-primary-container)]">{{ player.currentTrack.orderedByName }} 的歌</span>
      </p>
      <p v-else class="text-sm text-slate-400 dark:text-[var(--d-on-surface-variant)] truncate">未在播放</p>
      <div
        class="progress-track mt-1.5 h-1 w-full bg-slate-200/60 rounded-full group"
        :class="player.isSongOwner ? 'cursor-pointer' : 'cursor-default'"
        @click.stop="player.isSongOwner && onProgressClick($event)"
        @mousedown.stop="player.isSongOwner && onProgressMousedown($event)"
      >
        <div class="h-full bg-gradient-to-r from-primary to-secondary rounded-full relative transition-all" :style="{ width: progressPercent + '%' }">
          <div v-if="player.isSongOwner" class="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex items-center gap-1 shrink-0">
      <button
        class="w-8 h-8 flex items-center justify-center transition-colors rounded-full press-scale"
        :class="[
          player.isSongOwner ? 'text-slate-400 dark:text-[var(--d-on-surface-variant)] hover:text-on-surface dark:hover:text-[var(--d-on-surface)] hover:bg-slate-100 dark:hover:bg-[var(--d-hover-bg)]' : 'text-slate-200 dark:text-[var(--d-outline-variant)] cursor-not-allowed',
          (!player.hasTrack || player.queue.length <= 1) ? 'opacity-30 pointer-events-none' : ''
        ]"
        :title="!player.isSongOwner && player.hasTrack ? '仅点歌人可控制' : ''"
        @click="player.isSongOwner && apiPlayPrev()"
      >
        <span class="material-symbols-outlined text-xl">skip_previous</span>
      </button>
      <button
        class="w-10 h-10 flex items-center justify-center hover:scale-110 transition-transform press-scale"
        :class="[
          player.isSongOwner ? 'text-on-primary-container dark:text-[var(--d-primary)]' : 'text-slate-300 dark:text-[var(--d-outline)] cursor-not-allowed',
          !player.hasTrack ? 'opacity-30 pointer-events-none' : ''
        ]"
        :title="!player.isSongOwner && player.hasTrack ? '仅点歌人可控制' : ''"
        @click="player.isSongOwner && apiTogglePlay()"
      >
        <span class="material-symbols-outlined text-3xl" :style="{ fontVariationSettings: `'FILL' ${player.isPlaying ? 1 : 0}` }">
          {{ player.isPlaying ? 'pause_circle' : 'play_circle' }}
        </span>
      </button>
      <button
        class="w-8 h-8 flex items-center justify-center transition-colors rounded-full press-scale"
        :class="[
          player.isSongOwner ? 'text-slate-400 dark:text-[var(--d-on-surface-variant)] hover:text-on-surface dark:hover:text-[var(--d-on-surface)] hover:bg-slate-100 dark:hover:bg-[var(--d-hover-bg)]' : 'text-slate-200 dark:text-[var(--d-outline-variant)] cursor-not-allowed',
          (!player.hasTrack || player.queue.length <= 1) ? 'opacity-30 pointer-events-none' : ''
        ]"
        :title="!player.isSongOwner && player.hasTrack ? '仅点歌人可控制' : ''"
        @click="player.isSongOwner && apiPlayNext()"
      >
        <span class="material-symbols-outlined text-xl">skip_next</span>
      </button>
      <button
        class="w-8 h-8 flex items-center justify-center transition-colors rounded-full press-scale relative group"
        :class="[
          player.isSongOwner ? 'text-slate-400 dark:text-[var(--d-on-surface-variant)] hover:text-on-surface dark:hover:text-[var(--d-on-surface)] hover:bg-slate-100 dark:hover:bg-[var(--d-hover-bg)]' : 'text-slate-200 dark:text-[var(--d-outline-variant)] cursor-not-allowed',
          !player.hasTrack ? 'opacity-30 pointer-events-none' : ''
        ]"
        :title="!player.isSongOwner && player.hasTrack ? '仅点歌人可控制' : playModeLabel"
        @click="player.isSongOwner && apiTogglePlayMode()"
      >
        <span class="material-symbols-outlined text-xl" :class="player.playMode !== 'off' ? 'text-primary dark:text-[var(--d-primary)]' : ''">{{ playModeIcon }}</span>
      </button>
      <!-- Favorite -->
      <button
        v-if="player.hasTrack"
        class="heart-btn w-12 h-12 flex items-center justify-center transition-colors rounded-full press-scale text-slate-400 dark:text-[var(--d-on-surface-variant)] hover:text-on-surface dark:hover:text-[var(--d-on-surface)] hover:bg-slate-100 dark:hover:bg-[var(--d-hover-bg)]"
        :class="{ 'is-fav': favoriteIds.has(player.currentTrack.songId) }"
        @click="toggleFavorite(player.currentTrack.songId, $event)"
      >
        <div class="heart-icon relative w-6 h-6">
          <svg viewBox="0 0 24 24" class="absolute inset-0 w-full h-full"><path class="heart-outline" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <svg viewBox="0 0 24 24" class="heart-fill-svg absolute inset-0 w-full h-full"><path class="heart-fill-path" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </div>
      </button>
    </div>

    <!-- Time -->
    <span v-if="player.hasTrack" class="text-[10px] text-slate-400 dark:text-[var(--d-on-surface-variant)] font-mono tabular-nums shrink-0">{{ formatTime(player.currentTime) }}</span>
  </footer>

  <!-- ====== 歌词页全屏覆盖 ====== -->
  <Transition name="lyrics-slide">
    <div v-if="showLyrics" class="fixed inset-0 z-[60] flex" @wheel="onOverlayWheel">
      <!-- 封面背景 + 毛玻璃 -->
      <img
        :src="coverSrc"
        class="absolute inset-0 w-full h-full object-cover scale-110 blur-3xl brightness-50"
        :alt="player.currentTrack?.title ?? ''"
      />
      <div class="absolute inset-0 bg-black/50 backdrop-blur-xl"></div>

      <!-- 左侧：封面 + 信息 + 控件 -->
      <div class="relative z-10 w-[38%] flex flex-col items-center justify-center px-10 gap-5">
        <!-- 收起按钮 -->
        <button @click="closeLyrics" class="absolute top-6 left-6 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors press-scale">
          <span class="material-symbols-outlined">expand_more</span>
        </button>

        <!-- 大封面 -->
        <img
          ref="heroCoverRef"
          :src="coverSrc"
          class="w-56 h-56 object-cover shadow-2xl shadow-black/40 transition-all duration-700"
          :class="player.isPlaying ? 'rounded-[45%]' : 'rounded-full'"
          :alt="player.currentTrack?.title ?? ''"
          @error="($event.target as HTMLImageElement).src = API_BASE + '/uploads/covers/default.jpg'"
        />

        <!-- 歌曲信息 -->
        <div class="text-center">
          <h2 class="text-2xl font-bold text-white">{{ player.currentTrack?.title ?? '未在播放' }}</h2>
          <p class="text-white/50 mt-1">{{ player.currentTrack?.artist }}</p>
          <p v-if="player.currentTrack?.orderedByName" class="text-[#71fcfe]/50 text-xs mt-1">{{ player.currentTrack.orderedByName }} 的歌</p>
          <!-- Favorite -->
          <button
            v-if="player.hasTrack"
            class="heart-btn mt-3 w-[60px] h-[60px] flex items-center justify-center rounded-full hover:bg-white/10 transition-colors mx-auto"
            :class="{ 'is-fav': favoriteIds.has(player.currentTrack.songId) }"
            @click="toggleFavorite(player.currentTrack.songId, $event)"
          >
            <div class="heart-icon relative w-[30px] h-[30px]">
              <svg viewBox="0 0 24 24" class="absolute inset-0 w-full h-full"><path class="heart-outline" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              <svg viewBox="0 0 24 24" class="heart-fill-svg absolute inset-0 w-full h-full"><path class="heart-fill-path" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
          </button>
        </div>

        <!-- 进度条 -->
        <div class="w-full max-w-xs mt-2">
          <div class="flex justify-between text-[11px] text-white/50 font-mono tabular-nums mb-2">
            <span>{{ formatTime(player.currentTime) }}</span>
            <span>{{ formatTime(player.duration) }}</span>
          </div>
          <div
            class="h-1.5 w-full bg-white/20 rounded-full group"
            :class="player.isSongOwner ? 'cursor-pointer' : 'cursor-default'"
            @click="player.isSongOwner && onProgressClick($event)"
            @mousedown="player.isSongOwner && onProgressMousedown($event)"
          >
            <div class="h-full bg-white rounded-r-full relative transition-all" :style="{ width: progressPercent + '%' }">
              <div class="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity -mr-1"></div>
            </div>
          </div>
          <!-- 进度微调 + 歌词微调 -->
          <div class="flex items-center justify-center gap-6 mt-3">
            <div class="flex items-center gap-2">
              <button
                class="flex items-center gap-0.5 text-[10px] text-white/30 hover:text-white/70 transition-colors press-scale"
                :class="{ 'pointer-events-none': !player.isSongOwner }"
                @click="player.isSongOwner && seekAndSync(Math.max(0, player.currentTime - 1))"
              >
                <span class="material-symbols-outlined text-sm">replay_5</span>
                <span>-1s</span>
              </button>
              <span class="text-white/15 text-[10px]">进度</span>
              <button
                class="flex items-center gap-0.5 text-[10px] text-white/30 hover:text-white/70 transition-colors press-scale"
                :class="{ 'pointer-events-none': !player.isSongOwner }"
                @click="player.isSongOwner && seekAndSync(Math.min(player.duration, player.currentTime + 1))"
              >
                <span class="material-symbols-outlined text-sm">forward_5</span>
                <span>+1s</span>
              </button>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="flex items-center gap-0.5 text-[10px] text-white/30 hover:text-white/70 transition-colors press-scale"
                @click="lyricsOffset -= 0.5"
              >
                <span class="material-symbols-outlined text-sm">text_decrease</span>
                <span>-0.5s</span>
              </button>
              <span class="text-white/15 text-[10px]">歌词{{ lyricsOffset !== 0 ? ` ${lyricsOffset > 0 ? '+' : ''}${lyricsOffset.toFixed(1)}s` : '' }}</span>
              <button
                class="flex items-center gap-0.5 text-[10px] text-white/30 hover:text-white/70 transition-colors press-scale"
                @click="lyricsOffset += 0.5"
              >
                <span class="material-symbols-outlined text-sm">text_increase</span>
                <span>+0.5s</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 播放控制 + 模式 + 音量 -->
        <div class="flex items-center justify-center gap-5 mt-4">
          <!-- 播放模式 -->
          <button class="w-9 h-9 flex items-center justify-center transition-colors press-scale relative group"
            :class="player.isSongOwner ? 'text-white/40 hover:text-white/80' : 'text-white/15 cursor-not-allowed'"
            :title="!player.isSongOwner ? '仅点歌人可控制' : ''"
            @click="player.isSongOwner && apiTogglePlayMode()">
            <span class="material-symbols-outlined text-xl" :class="player.playMode !== 'off' ? 'text-[#71fcfe]' : ''">{{ playModeIcon }}</span>
            <span class="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-white/60 bg-black/60 rounded px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{{ playModeLabel }}</span>
          </button>

          <button
            :class="player.isSongOwner ? 'text-white/60 hover:text-white' : 'text-white/15 cursor-not-allowed'"
            class="press-scale"
            :title="!player.isSongOwner ? '仅点歌人可控制' : ''"
            @click="player.isSongOwner && apiPlayPrev()">
            <span class="material-symbols-outlined text-3xl">skip_previous</span>
          </button>
          <button class="w-16 h-16 rounded-full bg-gradient-to-br from-[#71fcfe] to-[#4fb3ff] text-slate-900 flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-[#71fcfe]/30 press-scale"
            :class="{ 'opacity-40': !player.isSongOwner }"
            :title="!player.isSongOwner ? '仅点歌人可控制' : ''"
            @click="player.isSongOwner && apiTogglePlay()">
            <span class="material-symbols-outlined text-4xl">{{ player.isPlaying ? 'pause' : 'play_arrow' }}</span>
          </button>
          <button
            :class="player.isSongOwner ? 'text-white/60 hover:text-white' : 'text-white/15 cursor-not-allowed'"
            class="press-scale"
            :title="!player.isSongOwner ? '仅点歌人可控制' : ''"
            @click="player.isSongOwner && apiPlayNext()">
            <span class="material-symbols-outlined text-3xl">skip_next</span>
          </button>

          <!-- 音量 -->
          <div class="flex items-center gap-1.5 group/vol">
            <button class="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors press-scale"
              @click="player.setVolume(player.volume === 0 ? 80 : 0)">
              <span class="material-symbols-outlined text-xl">{{ volumeIcon }}</span>
            </button>
            <div class="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300">
              <div
                class="h-1 w-full bg-white/20 rounded-full cursor-pointer mt-1"
                @click="onVolumeClick"
                @mousedown="onVolumeMousedown"
              >
                <div class="h-full bg-white rounded-full" :style="{ width: player.volume + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：歌词 + 播放列表 -->
      <div class="relative z-10 flex-1 flex">
        <!-- 歌词漏斗 -->
        <div class="flex-1 flex flex-col">
          <div ref="lyricsContainer" class="flex-1 overflow-y-auto px-10 scroll-smooth scrollbar-hide" style="mask-image: linear-gradient(transparent, black 15%, black 85%, transparent);">
            <div class="h-[35vh]"></div>
            <!-- 无歌词提示 -->
            <div v-if="lyrics.length === 0" class="text-center py-8">
              <p class="text-white/20 text-sm">暂无歌词</p>
            </div>
            <div v-else class="space-y-2">
              <div v-for="(line, i) in lyrics" :key="i"
                :data-line="i"
                @click="seekToLine(line.time)"
                class="cursor-pointer transition-all duration-500 ease-out py-2 origin-left"
                :style="{
                  ...lineStyle(i),
                  fontSize: i === currentLine ? '1.75rem' : '1.25rem',
                  fontWeight: i === currentLine ? 700 : 400,
                  letterSpacing: i === currentLine ? '-0.01em' : '0',
                  textShadow: i === currentLine ? '0 0 30px rgba(113,252,254,0.25)' : 'none',
                }"
              >
                {{ line.text || '···' }}
              </div>
            </div>
            <div class="h-[40vh]"></div>
          </div>
        </div>

        <!-- 右侧边栏：聊天 + 播放列表 -->
        <div class="w-72 border-l border-white/10 flex flex-col">
          <!-- 聊天上半 -->
          <div class="flex-1 flex flex-col border-b border-white/10 min-h-0">
            <div class="px-5 py-3 flex items-center gap-2 flex-shrink-0">
              <span class="material-symbols-outlined text-white/50 text-lg">chat</span>
              <p class="text-white/70 text-sm font-bold">聊天</p>
            </div>
            <div ref="chatContainer" class="flex-1 overflow-y-auto scrollbar-hide px-4 pb-3 space-y-2 min-h-0">
              <div v-for="(msg, i) in chatMessages" :key="i" class="text-xs">
                <div v-if="msg.nickname === '系统'" class="text-center text-white/20 py-0.5">
                  {{ msg.message }}
                </div>
                <div v-else>
                  <span class="text-[#71fcfe]/70 font-semibold">{{ msg.nickname }}</span>
                  <span class="text-white/20 ml-1">{{ msg.timestamp }}</span>
                  <p class="text-white/60 mt-0.5">{{ msg.message }}</p>
                </div>
              </div>
              <div v-if="chatMessages.length === 0" class="text-center text-white/15 text-xs py-4">暂无消息</div>
            </div>
            <form @submit.prevent="sendChatMessage" class="p-3 flex gap-2 flex-shrink-0">
              <input
                v-model="chatInput"
                type="text"
                placeholder="发消息..."
                maxlength="200"
                class="flex-1 bg-white/10 border-none rounded-lg py-2 px-3 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-[#71fcfe]/30"
              />
              <button type="submit" class="px-3 py-2 bg-[#71fcfe]/20 text-[#71fcfe] rounded-lg text-xs hover:bg-[#71fcfe]/30 transition-colors">
                <span class="material-symbols-outlined text-sm">send</span>
              </button>
            </form>
          </div>

          <!-- 播放列表下半 -->
          <div class="flex-1 flex flex-col min-h-0">
            <div class="px-5 py-3 flex items-center gap-2 flex-shrink-0">
              <span class="material-symbols-outlined text-white/50 text-lg">queue_music</span>
              <p class="text-white/70 text-sm font-bold">播放列表</p>
              <span class="text-white/30 text-xs ml-1">{{ player.queue.length }} 首</span>
            </div>
            <div ref="playlistContainer" class="flex-1 overflow-y-auto scrollbar-hide px-3 pb-4 min-h-0">
              <div v-for="(track, i) in player.queue" :key="track.queueItemId"
                :data-playlist-qid="track.queueItemId"
                class="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all mb-1 group"
                :class="[
                  player.currentQueueItemId === track.queueItemId ? 'bg-white/20 ring-1 ring-[#71fcfe]/40' : 'hover:bg-white/5',
                  dragOverIndex === i ? 'border-t-2 border-[#71fcfe]' : '',
                  dragIndex === i ? 'opacity-40' : '',
                  rowClass(track.queueItemId),
                ]"
                draggable="true"
                @dragstart="onDragStart(i, $event)"
                @dragover="onDragOver(i, $event)"
                @dragleave="onDragLeave"
                @drop="onDrop(i, $event)"
                @dragend="onDragEnd"
                @click="track.queueItemId && playbackApi.play(track.queueItemId)"
              >
                <span class="material-symbols-outlined text-white/15 text-xs cursor-grab active:cursor-grabbing flex-shrink-0">drag_indicator</span>
                <img
                  :src="track.coverUrl ? (API_BASE + track.coverUrl) : API_BASE + '/uploads/covers/default.jpg'"
                  class="w-8 h-8 rounded object-cover flex-shrink-0"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-xs truncate" :class="player.currentQueueItemId === track.queueItemId ? 'text-[#71fcfe] font-bold' : 'text-white/60'">
                    {{ track.title }}
                  </p>
                  <p class="text-[10px] truncate" :class="player.currentQueueItemId === track.queueItemId ? 'text-white/70' : 'text-white/25'">
                    {{ track.artist }}
                  </p>
                </div>
                <button
                  class="heart-btn flex-shrink-0 press-scale opacity-0 group-hover:opacity-100 transition-opacity"
                  :class="{ 'is-fav': favoriteIds.has(track.songId) }"
                  @click.stop="toggleFavorite(track.songId, $event)"
                >
                  <div class="heart-icon relative w-4 h-4">
                    <svg viewBox="0 0 24 24" class="absolute inset-0 w-full h-full"><path class="heart-outline" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    <svg viewBox="0 0 24 24" class="heart-fill-svg absolute inset-0 w-full h-full"><path class="heart-fill-path" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  </div>
                </button>
              </div>
              <p v-if="player.queue.length === 0" class="text-center text-white/15 text-xs py-6">播放列表为空</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.lyrics-slide-enter-active,
.lyrics-slide-leave-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.lyrics-slide-enter-from,
.lyrics-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

/* SVG heart */
.heart-outline { fill: none; stroke: rgba(255,255,255,0.2); stroke-width: 1.5; transition: stroke 0.25s; }
.heart-fill-svg { opacity: 0; transition: none; }
.heart-fill-path { fill: #ef4444; }
.heart-btn.is-fav .heart-fill-svg { opacity: 1; clip-path: circle(75% at 50% 55%); }
.heart-btn.is-fav .heart-outline { stroke: #ef4444; }

/* ===== Switch feedback (dark theme) ===== */
.switch-old {
  animation: switchOld .15s ease forwards;
}
@keyframes switchOld {
  to { opacity: .55; transform: scale(.97); }
}
.switch-new {
  animation: switchNew .4s cubic-bezier(.4,0,.2,1) forwards;
}
@keyframes switchNew {
  0% { opacity: .6; transform: scale(.96) translateY(4px); }
  50% { opacity: 1; transform: scale(1.01) translateY(0); }
  100% { transform: scale(1); opacity: 1; }
}
.switch-glow {
  animation: switchGlow .5s ease forwards;
}
@keyframes switchGlow {
  0% { box-shadow: 0 0 0 0 rgba(113,252,254,.15); }
  40% { box-shadow: 0 0 14px 5px rgba(113,252,254,.15); }
  100% { box-shadow: 0 0 0 0 transparent; }
}
.switch-dim {
  opacity: .8;
  transition: opacity .15s;
}

/* Cover catch pulse */
:global(.cover-catch) {
  animation: coverCatch .4s cubic-bezier(.34,1.56,.64,1);
}
@keyframes coverCatch {
  0% { transform: scale(.82); }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
</style>
