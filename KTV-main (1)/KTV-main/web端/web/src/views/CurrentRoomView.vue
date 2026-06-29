<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { roomApi, chatApi, favoritesApi, playbackApi, voiceApi } from '@/api'
import { usePlayerStore } from '@/stores/player'
import { useAuthStore } from '@/stores/auth'
import type { RoomInfo } from '@/types'
import { useToast } from '@/composables/useToast'
import { useSwitchFeedback } from '@/composables/useSwitchFeedback'

// Toast
const { toastMsg, showToast } = useToast()
const { rowClass, triggerCoverFly } = useSwitchFeedback()

const player = usePlayerStore()
const auth = useAuthStore()
const router = useRouter()

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'https://localhost:5001'

const roomInfo = ref<RoomInfo | null>(null)

// Metadata maps (keyed by queueItemId)
const orderedByMap = ref<Record<number, string>>({})
const orderedByUserIdMap = ref<Record<number, number>>({})

// Display queue derived from player.queue + metadata
const displayQueue = computed(() =>
  player.queue.map((t, i) => ({
    ...t,
    id: t.queueItemId,
    songTitle: t.title,
    orderedBy: orderedByMap.value[t.queueItemId] ?? t.orderedByName ?? '',
    orderedByUserId: orderedByUserIdMap.value[t.queueItemId] ?? t.orderedByUserId ?? 0,
    index: i,
  }))
)

// Join room state
const joinRoomCode = ref('')
const joinError = ref('')

async function handleJoinRoom() {
  joinError.value = ''
  if (!joinRoomCode.value || joinRoomCode.value.length < 4) {
    joinError.value = '请输入有效的房间码'
    return
  }
  try {
    const { data } = await roomApi.joinByCode(joinRoomCode.value.toUpperCase())
    auth.setCurrentRoomId(data.roomId)
    await loadRoom()
    await loadQueue()
    await loadChatMessages()
  } catch (err: any) {
    joinError.value = err.response?.data?.message || '房间不存在或已关闭'
  }
}

// Chat state
const chatMessages = ref<{ nickname: string; message: string; timestamp: string }[]>([])
const chatInput = ref('')
const chatContainer = ref<HTMLElement | null>(null)
let chatPollTimer: ReturnType<typeof setInterval> | null = null

// Voice message state
const isRecording = ref(false)
const recordingTime = ref(0)
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let recordingTimer: ReturnType<typeof setInterval> | null = null
const voiceMessages = ref<{ id: number; nickname: string; fileUrl: string; duration: number; createdAt: string }[]>([])
const playingVoiceId = ref<number | null>(null)
let currentAudio: HTMLAudioElement | null = null

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    audioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(track => track.stop())
      if (audioChunks.length === 0) return

      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      const file = new File([audioBlob], 'voice.webm', { type: 'audio/webm' })

      if (!roomInfo.value || roomInfo.value.roomId <= 0) {
        showToast('未加入房间，无法发送语音')
        return
      }

      try {
        await voiceApi.upload(roomInfo.value.roomId, file, recordingTime.value)
        showToast('语音已发送')
        await loadVoiceMessages()
      } catch (err: any) {
        showToast('发送失败: ' + (err.message || '未知错误'))
      }
    }

    mediaRecorder.start()
    isRecording.value = true
    recordingTime.value = 0
    recordingTimer = setInterval(() => {
      recordingTime.value++
      if (recordingTime.value >= 60) {
        stopRecording()
      }
    }, 1000)
  } catch (err: any) {
    showToast('无法访问麦克风: ' + (err.message || '请检查权限'))
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  isRecording.value = false
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }
}

function cancelRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.ondataavailable = null
    mediaRecorder.onstop = null
    mediaRecorder.stop()
  }
  isRecording.value = false
  recordingTime.value = 0
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }
  audioChunks = []
  showToast('已取消录音')
}

async function playVoice(voice: { id: number; fileUrl: string }) {
  if (playingVoiceId.value === voice.id) {
    // Stop playing
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }
    playingVoiceId.value = null
    return
  }

  // Stop previous audio
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }

  playingVoiceId.value = voice.id
  currentAudio = new Audio(API_BASE + voice.fileUrl)
  currentAudio.onended = () => {
    playingVoiceId.value = null
    currentAudio = null
  }
  currentAudio.onerror = () => {
    playingVoiceId.value = null
    currentAudio = null
    showToast('播放失败')
  }
  currentAudio.play().catch(() => {
    playingVoiceId.value = null
    currentAudio = null
  })
}

async function loadVoiceMessages() {
  if (!roomInfo.value || roomInfo.value.roomId <= 0) return
  try {
    const { data } = await voiceApi.getMessages(roomInfo.value.roomId)
    voiceMessages.value = data
  } catch { /* ignore */ }
}

const progressPercent = computed(() => {
  if (player.duration <= 0) return 0
  return (player.currentTime / player.duration) * 100
})

async function loadRoom() {
  try {
    const { data } = await roomApi.getCurrent(auth.currentRoomId)
    // Only update if data actually changed (prevents re-render flash on poll)
    const prev = roomInfo.value
    if (prev && prev.roomId === data.roomId && prev.roomCode === data.roomCode && prev.songsQueued === data.songsQueued && prev.onlineUsers === data.onlineUsers) return
    roomInfo.value = data
  } catch (err: any) {
    console.error('loadRoom: error =', err.response?.status, err.response?.data)
    roomInfo.value = { roomId: 0, roomCode: 'N/A', songsQueued: 0, onlineUsers: 0 }
  }
}

async function loadQueue() {
  const { data } = await roomApi.getQueue()

  // Update metadata maps (keyed by queueItemId)
  const oMap: Record<number, string> = {}
  const ouMap: Record<number, number> = {}
  for (const item of data) {
    oMap[item.id] = item.orderedBy
    ouMap[item.id] = item.orderedByUserId
  }
  orderedByMap.value = oMap
  orderedByUserIdMap.value = ouMap

  player.loadQueue(
    data.map(item => ({
      songId: item.songId,
      title: item.songTitle,
      artist: item.artist,
      coverUrl: item.coverUrl,
      mediaUrl: item.mediaUrl,
      lrcUrl: item.lrcUrl || '',
      orderedByUserId: item.orderedByUserId,
      orderedByName: item.orderedBy,
      queueItemId: item.id,
    }))
  )
}

async function removeFromQueue(queueId: number) {
  await roomApi.removeFromQueue(queueId)
  delete orderedByMap.value[queueId]
  delete orderedByUserIdMap.value[queueId]
  player.loadQueue(player.queue.filter(t => t.queueItemId !== queueId))
}

function playSong(queueItemId: number) {
  playbackApi.play(queueItemId).then(() => {
    loadPlaybackState()
    loadQueue()
  })
}

// --- Favorites ---
const favoriteIds = ref<Set<number>>(new Set())
async function loadFavorites() {
  try { const res = await favoritesApi.getList(); favoriteIds.value = new Set(res.data.map((f: any) => f.songId)) } catch {}
}
async function toggleFavorite(songId: number) {
  if (favoriteIds.value.has(songId)) { await favoritesApi.remove(songId); favoriteIds.value.delete(songId) }
  else { await favoritesApi.add(songId); favoriteIds.value.add(songId) }
  favoriteIds.value = new Set(favoriteIds.value)
}

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

  // Reorder on server, then refresh queue
  const ids = [...player.queue.map(t => t.queueItemId)]
  const [item] = ids.splice(from, 1)
  ids.splice(i, 0, item)
  try { await roomApi.reorderBatch(ids); await loadQueue() } catch {}
}
function onDragEnd() { dragIndex.value = null; dragOverIndex.value = null }

// --- Auto-scroll playlist to current + cover fly ---
const playlistContainer = ref<HTMLElement | null>(null)
watch(() => player.currentQueueItemId, async (newQid, oldQid) => {
  if (newQid == null || !playlistContainer.value) return
  await nextTick()
  const el = playlistContainer.value.querySelector(`[data-playlist-qid="${newQid}"]`) as HTMLElement
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  // Cover fly: animate to player bar cover
  if (oldQid != null && newQid !== oldQid) {
    const targetEl = document.querySelector('.player-capsule img') as HTMLElement
    if (targetEl) triggerCoverFly(playlistContainer.value, targetEl)
  }
})

async function sendChatMessage() {
  if (!chatInput.value.trim()) return
  if (!roomInfo.value || roomInfo.value.roomId <= 0) {
    showToast('未加入房间，无法发送消息')
    return
  }
  const msg = chatInput.value.trim()
  try {
    await chatApi.sendMessage(roomInfo.value.roomId, msg)
    chatInput.value = ''
    await loadChatMessages()
  } catch (err: any) {
    console.error('发送消息失败:', err)
    showToast('发送失败: ' + (err.message || '未知错误'))
  }
}

async function loadChatMessages() {
  if (!roomInfo.value || roomInfo.value.roomId <= 0) return
  try {
    const { data } = await chatApi.getMessages(roomInfo.value.roomId)
    const mapped = data.map(m => ({ nickname: m.nickname, message: m.message, timestamp: m.timestamp }))
    // Only update if messages actually changed
    if (mapped.length === chatMessages.value.length && mapped.every((m, i) => m.message === chatMessages.value[i].message && m.timestamp === chatMessages.value[i].timestamp)) return
    chatMessages.value = mapped
    scrollToChatBottom()
  } catch { /* ignore */ }
}

function scrollToChatBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

async function leaveCurrentRoom() {
  if (!roomInfo.value || roomInfo.value.roomId <= 0) return
  try {
    await roomApi.leaveRoom(roomInfo.value.roomId)
    router.push('/explore')
  } catch (err: any) {
    console.error('退出房间失败:', err)
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// Playback state sync
async function loadPlaybackState() {
  try {
    const { data } = await playbackApi.getState()
    player.applyRemoteState(data)
  } catch { /* ignore */ }
}

onMounted(async () => {
  // Enable sync mode
  if (auth.user) {
    player.setSyncMode(true, auth.user.id)
  }

  await loadRoom()
  await loadQueue()
  await loadPlaybackState()
  await loadChatMessages()
  await loadVoiceMessages()
  loadFavorites()
  // Poll every 2 seconds
  chatPollTimer = setInterval(() => {
    loadChatMessages()
    loadVoiceMessages()
    loadQueue()
    loadRoom()
    loadPlaybackState()
  }, 2000)
})

onUnmounted(() => {
  if (chatPollTimer) {
    clearInterval(chatPollTimer)
    chatPollTimer = null
  }
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

/* ===== Switch feedback: Takeover + weak spotlight ===== */
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
  0% { box-shadow: 0 0 0 0 rgba(103,80,164,.2); }
  40% { box-shadow: 0 0 14px 5px rgba(103,80,164,.2); }
  100% { box-shadow: 0 0 0 0 transparent; }
}
.switch-dim {
  opacity: .8;
  transition: opacity .15s;
}

/* Cover catch pulse on player */
:global(.cover-catch) {
  animation: coverCatch .4s cubic-bezier(.34,1.56,.64,1);
}
@keyframes coverCatch {
  0% { transform: scale(.82); }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* EQ bars — persistent playing indicator */
.eq-bars {
  display: inline-flex; gap: 2px; align-items: flex-end; height: 14px;
}
.eq-bar {
  width: 3px; border-radius: 1px; background: #6750A4;
}
.eq-bar:nth-child(1) { animation: eqB .5s ease-in-out infinite alternate; }
.eq-bar:nth-child(2) { animation: eqB .6s ease-in-out infinite alternate .15s; }
.eq-bar:nth-child(3) { animation: eqB .45s ease-in-out infinite alternate .3s; }
@keyframes eqB { 0% { height: 3px; } 100% { height: 14px; } }
</style>

<template>
  <!-- Not in a room -->
  <div v-if="!roomInfo || roomInfo.roomId <= 0" class="flex flex-col items-center justify-center min-h-[60vh] gap-6">
    <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
      <span class="material-symbols-outlined text-5xl text-primary">meeting_room</span>
    </div>
    <h2 class="text-2xl font-bold text-on-surface">你还没加入任何房间</h2>
    <p class="text-on-surface-variant">输入房间码加入已有房间</p>
    <div class="flex gap-2 w-80">
      <input
        v-model="joinRoomCode"
        type="text"
        placeholder="6位房间码"
        maxlength="6"
        class="flex-1 bg-surface-container-high border-none rounded-lg py-3 px-4 text-lg text-on-surface font-mono tracking-widest text-center placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/30 focus:outline-none uppercase"
      />
      <button
        @click="handleJoinRoom"
        class="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:opacity-90 transition-opacity press-scale"
      >
        加入
      </button>
    </div>
    <p v-if="joinError" class="text-error text-sm">{{ joinError }}</p>
  </div>

  <!-- In a room -->
  <div v-else class="flex gap-8">
    <!-- Left: Room content -->
    <div class="flex-1">
      <!-- Header Section -->
      <div class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-4xl font-extrabold tracking-tight text-on-surface">当前房间</h1>
          <button
            @click="leaveCurrentRoom"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-error bg-error/10 hover:bg-error/20 rounded-full transition-colors press-scale"
          >
            <span class="material-symbols-outlined text-lg">logout</span>
            退出房间
          </button>
        </div>
        <div class="flex flex-wrap gap-3 text-sm font-medium text-on-surface-variant">
          <span v-if="roomInfo" class="flex items-center gap-2 glass px-4 py-2 rounded-full shrink-0">
            <span class="material-symbols-outlined text-sm">label</span>
            <span class="whitespace-nowrap">房间码: {{ roomInfo.roomCode }}</span>
          </span>
          <span v-if="roomInfo" class="flex items-center gap-2 glass px-4 py-2 rounded-full shrink-0">
            <span class="material-symbols-outlined text-sm">group</span>
            <span class="whitespace-nowrap">在线: {{ roomInfo.onlineUsers }} 人</span>
          </span>
          <span class="flex items-center gap-2 glass px-4 py-2 rounded-full shrink-0">
            <span class="material-symbols-outlined text-sm">format_list_bulleted</span>
            <span class="whitespace-nowrap">已点歌曲: {{ displayQueue.length }}</span>
          </span>
        </div>
      </div>

      <!-- Now Playing hero card -->
      <div v-if="player.currentTrack" class="glass rounded-xl p-8 shadow-sm flex gap-8 items-center mb-10">
        <img
          :src="API_BASE + player.currentTrack.coverUrl"
          class="w-48 h-48 rounded flex-shrink-0 object-cover cursor-pointer transition-transform duration-200 hover:scale-[2.5] hover:shadow-lg hover:z-10 relative"
          :alt="player.currentTrack.title"
          @error="($event.target as HTMLImageElement).src = API_BASE + '/uploads/covers/default.jpg'"
        />
        <div class="flex-grow">
          <div class="flex justify-between items-start mb-6">
            <div>
              <h2 class="text-3xl font-bold mb-1">{{ player.currentTrack.title }}</h2>
              <p class="text-on-surface-variant">{{ player.currentTrack.artist }}</p>
            </div>
            <button
              class="p-3 bg-primary-container dark:bg-[var(--d-primary-container)] text-on-primary-container dark:text-[var(--d-primary)] rounded-full hover:opacity-90 transition-opacity flex items-center gap-2 px-6 font-bold border-2 border-white dark:border-[var(--d-outline-variant)] shadow-sm hover:shadow-md"
              @click="player.isSongOwner && playbackApi.next().then(() => loadPlaybackState())"
              :class="{ 'opacity-30 pointer-events-none': !player.isSongOwner }"
              :title="!player.isSongOwner ? '仅点歌人可控制' : ''"
            >
              <span class="material-symbols-outlined">skip_next</span> 切歌
            </button>
          </div>
          <!-- Progress Bar -->
          <div class="space-y-2">
            <div class="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full transition-all" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <div class="flex justify-between text-xs font-bold text-slate-400 tracking-widest">
              <span>{{ formatTime(player.currentTime) }}</span>
              <span>{{ formatTime(player.duration) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty now-playing state -->
      <div v-else class="glass rounded-xl p-8 shadow-sm flex gap-8 items-center mb-10">
        <div class="w-48 h-48 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center">
          <span class="material-symbols-outlined text-6xl text-slate-300">music_off</span>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-slate-400 mb-2">未在播放</h2>
          <p class="text-slate-400">在歌曲列表中点歌开始播放</p>
        </div>
      </div>

      <!-- Queue section -->
      <h3 class="text-xl font-bold px-2 mb-4">播放列表</h3>

      <div ref="playlistContainer" class="rounded-xl overflow-hidden">
        <div
          v-for="(item, index) in displayQueue"
          :key="item.queueItemId"
          :data-playlist-qid="item.queueItemId"
          class="flex items-center px-8 py-5 hover:glass hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
          :class="[
            player.currentQueueItemId === item.queueItemId ? 'bg-primary/15 ring-1 ring-primary/30' : '',
            dragOverIndex === index ? 'border-t-2 border-primary' : '',
            dragIndex === index ? 'opacity-40' : '',
            rowClass(item.queueItemId),
          ]"
          draggable="true"
          @dragstart="onDragStart(index, $event)"
          @dragover="onDragOver(index, $event)"
          @dragleave="onDragLeave"
          @drop="onDrop(index, $event)"
          @dragend="onDragEnd"
          @click="playSong(item.queueItemId)"
        >
          <span class="material-symbols-outlined text-slate-300 text-sm cursor-grab active:cursor-grabbing mr-3 opacity-0 group-hover:opacity-100 transition-opacity">drag_indicator</span>
          <span
            class="w-8 font-bold"
            :class="player.currentQueueItemId === item.queueItemId ? 'text-primary' : 'text-slate-400'"
          >
            <span v-if="player.currentQueueItemId === item.queueItemId && player.isPlaying" class="eq-bars">
              <span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span>
            </span>
            <span v-else>{{ String(index + 1).padStart(2, '0') }}</span>
          </span>
          <img
            :src="API_BASE + item.coverUrl"
            class="w-12 h-12 rounded flex-shrink-0 object-cover mx-6"
            :alt="item.songTitle"
            @error="($event.target as HTMLImageElement).src = API_BASE + '/uploads/covers/default.jpg'"
          />
          <div class="flex-grow grid grid-cols-3 items-center">
            <span class="font-bold" :class="{ 'text-primary': player.currentQueueItemId === item.queueItemId }">{{ item.songTitle }}</span>
            <span class="text-on-surface-variant">{{ item.artist }}</span>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-400">点播者: {{ item.orderedBy }}</span>
              <div class="flex items-center gap-2">
                <button
                  class="press-scale opacity-0 group-hover:opacity-100 transition-opacity"
                  @click.stop="toggleFavorite(item.songId)"
                >
                  <span class="material-symbols-outlined text-lg transition-colors"
                    :class="favoriteIds.has(item.songId) ? 'text-red-400' : 'text-slate-300 hover:text-slate-500'"
                    :style="{ fontVariationSettings: `'FILL' ${favoriteIds.has(item.songId) ? 1 : 0}` }"
                  >favorite</span>
                </button>
                <button
                  v-if="auth.user?.id === item.orderedByUserId"
                  @click.stop="removeFromQueue(item.id)"
                  class="text-error hover:scale-110 transition-transform opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="displayQueue.length === 0" class="text-center py-20">
        <span class="material-symbols-outlined text-6xl text-surface-container-highest">queue_music</span>
        <p class="text-on-surface-variant mt-4">播放列表为空</p>
      </div>
    </div>

    <!-- Right: Chat panel -->
    <div class="w-80 flex-shrink-0 glass rounded-xl shadow-sm flex flex-col sticky top-24" style="height: calc(100vh - 200px)">
      <div class="p-4 border-b border-surface-container-highest">
        <h3 class="font-bold text-on-surface flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-xl">chat</span>
          实时聊天
        </h3>
      </div>
      <!-- Messages -->
      <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-3">
        <div v-for="(msg, i) in chatMessages" :key="i" class="text-sm">
          <div v-if="msg.nickname === '系统'" class="text-center text-xs text-on-surface-variant/60 py-1">
            [{{ msg.timestamp }}] {{ msg.message }}
          </div>
          <div v-else class="flex flex-col">
            <div class="flex items-center gap-2 mb-0.5">
              <span class="font-semibold text-primary text-xs">{{ msg.nickname }}</span>
              <span class="text-[10px] text-on-surface-variant/50">{{ msg.timestamp }}</span>
            </div>
            <p class="text-on-surface bg-surface-container-high rounded-lg px-3 py-2 inline-block max-w-[90%]">{{ msg.message }}</p>
          </div>
        </div>
        <!-- Voice messages -->
        <div v-for="voice in voiceMessages" :key="'voice-' + voice.id" class="text-sm">
          <div class="flex flex-col">
            <div class="flex items-center gap-2 mb-0.5">
              <span class="font-semibold text-primary text-xs">{{ voice.nickname }}</span>
              <span class="text-[10px] text-on-surface-variant/50">{{ voice.createdAt }}</span>
            </div>
            <div
              class="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2 inline-block max-w-[90%] cursor-pointer hover:bg-primary/20 transition-colors"
              @click="playVoice(voice)"
            >
              <span class="material-symbols-outlined text-primary text-lg">
                {{ playingVoiceId === voice.id ? 'pause_circle' : 'play_circle' }}
              </span>
              <div class="flex gap-0.5 items-end h-4">
                <span v-for="n in 12" :key="n" class="w-1 bg-primary rounded-full"
                  :style="{ height: (4 + Math.random() * 12) + 'px' }"></span>
              </div>
              <span class="text-xs text-on-surface-variant">{{ voice.duration }}s</span>
            </div>
          </div>
        </div>
        <div v-if="chatMessages.length === 0 && voiceMessages.length === 0" class="text-center text-xs text-on-surface-variant/50 py-8">
          还没有消息，来说点什么吧
        </div>
      </div>
      <!-- Input -->
      <div class="p-3 border-t border-surface-container-highest">
        <!-- Recording UI -->
        <div v-if="isRecording" class="flex items-center gap-2">
          <div class="flex-1 flex items-center gap-2 bg-error/10 rounded-lg px-3 py-2.5">
            <span class="w-3 h-3 bg-error rounded-full animate-pulse"></span>
            <span class="text-sm font-medium text-error">录音中 {{ recordingTime }}s</span>
          </div>
          <button
            @click="cancelRecording"
            class="px-3 py-2.5 bg-surface-container-high text-on-surface rounded-lg text-sm font-medium hover:bg-surface-container transition-colors"
          >
            取消
          </button>
          <button
            @click="stopRecording"
            class="px-4 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            发送
          </button>
        </div>
        <!-- Normal input -->
        <form v-else @submit.prevent="sendChatMessage" class="flex gap-2">
          <input
            v-model="chatInput"
            type="text"
            placeholder="发消息..."
            maxlength="200"
            class="flex-1 bg-surface-container-high border-none rounded-lg py-2.5 px-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/30 focus:outline-none"
          />
          <button
            type="button"
            @click="startRecording"
            class="px-3 py-2.5 bg-surface-container-high text-on-surface-variant rounded-lg hover:bg-surface-container transition-colors"
            title="按住说话"
          >
            <span class="material-symbols-outlined text-lg">mic</span>
          </button>
          <button
            type="submit"
            class="px-4 py-2.5 bg-primary-container dark:bg-[var(--d-primary-container)] text-on-primary-container dark:text-[var(--d-primary)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <span class="material-symbols-outlined text-lg">send</span>
          </button>
        </form>
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
