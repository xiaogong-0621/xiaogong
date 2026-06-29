import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface PlayerTrack {
  songId: number
  title: string
  artist: string
  coverUrl: string
  mediaUrl: string
  lrcUrl: string
  orderedByUserId: number
  orderedByName: string
  queueItemId: number
}

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'https://localhost:5001'

export const usePlayerStore = defineStore('player', () => {
  const audio = new Audio()
  audio.preload = 'auto'

  const queue = ref<PlayerTrack[]>([])
  const currentIndex = ref(-1)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(80)
  const playMode = ref<'off' | 'repeat-all' | 'repeat-one' | 'shuffle'>('off')

  // Sync mode state
  const syncMode = ref(false)
  const currentUserId = ref<number | null>(null)
  const currentQueueItemId = ref<number | null>(null)
  const isDragging = ref(false)

  const currentTrack = computed(() =>
    currentIndex.value >= 0 && currentIndex.value < queue.value.length
      ? queue.value[currentIndex.value]
      : null
  )

  const hasTrack = computed(() => currentTrack.value !== null)

  const songOwnerUserId = computed(() => currentTrack.value?.orderedByUserId ?? null)
  const isSongOwner = computed(() =>
    currentUserId.value != null && songOwnerUserId.value === currentUserId.value
  )

  // Sync audio events
  audio.addEventListener('timeupdate', () => {
    currentTime.value = audio.currentTime
  })
  audio.addEventListener('loadedmetadata', () => {
    duration.value = audio.duration
  })
  audio.addEventListener('play', () => {
    isPlaying.value = true
  })
  audio.addEventListener('pause', () => {
    isPlaying.value = false
  })
  audio.addEventListener('ended', () => {
    // In sync mode: server handles auto-advance
    if (syncMode.value) { audio.pause(); return }
    // Local mode
    if (playMode.value === 'repeat-one') {
      audio.currentTime = 0; audio.play().catch(() => {})
    } else {
      playNextLocal()
    }
  })
  audio.addEventListener('error', () => {
    if (currentTrack.value?.mediaUrl) {
      if (syncMode.value) { audio.pause() } else { playNextLocal() }
    }
  })

  audio.volume = volume.value / 100

  // ── Local audio primitives ──

  function _loadTrack(index: number) {
    const track = queue.value[index]
    if (!track) return
    currentIndex.value = index
    if (!track.mediaUrl) {
      audio.pause(); audio.src = ''; isPlaying.value = false; return
    }
    audio.src = API_BASE + track.mediaUrl
    audio.load()
  }

  function play() {
    if (!hasTrack.value || !currentTrack.value?.mediaUrl) return
    audio.play().catch(() => {})
  }

  function pause() {
    audio.pause()
  }

  function seek(time: number) {
    audio.currentTime = time
    currentTime.value = time
  }

  function setVolume(v: number) {
    volume.value = v
    audio.volume = v / 100
  }

  // ── Local-only playback (non-sync mode) ──

  function playNextLocal() {
    if (queue.value.length <= 1) {
      if (playMode.value === 'repeat-all' && queue.value.length === 1) {
        _loadTrack(0); play(); return
      }
      queue.value = []; currentIndex.value = -1; isPlaying.value = false; audio.src = ''
      return
    }
    if (playMode.value === 'shuffle') {
      let next: number
      do { next = Math.floor(Math.random() * queue.value.length) } while (next === 0)
      const [track] = queue.value.splice(next, 1)
      queue.value.shift(); queue.value.unshift(track)
    } else {
      queue.value.shift()
    }
    _loadTrack(0); play()
  }

  // ── Sync mode: apply remote state from server ──

  function applyRemoteState(state: any) {
    if (!state.hasTrack) {
      if (hasTrack.value) {
        audio.pause(); audio.src = ''; currentIndex.value = -1; currentQueueItemId.value = null
      }
      return
    }

    // Map server songId to local queue index
    const localIndex = queue.value.findIndex(t => t.songId === state.songId)

    // Song changed
    if (currentQueueItemId.value !== state.currentQueueItemId) {
      currentQueueItemId.value = state.currentQueueItemId
      if (localIndex >= 0) _loadTrack(localIndex)
    }

    // Play/pause sync
    if (state.isPlaying && audio.paused) play()
    else if (!state.isPlaying && !audio.paused) pause()

    // Time sync (drift > 2s when playing, > 0.5s when paused) — skip during drag
    if (!isDragging.value) {
      if (state.isPlaying) {
        if (Math.abs(audio.currentTime - state.currentTime) > 2) seek(state.currentTime)
      } else {
        if (Math.abs(audio.currentTime - state.currentTime) > 0.5) seek(state.currentTime)
      }
    }

    // Play mode sync
    if (state.playMode && playMode.value !== state.playMode) {
      playMode.value = state.playMode
    }
  }

  // ── Queue management ──

  function loadQueue(tracks: PlayerTrack[]) {
    const currentQid = currentQueueItemId.value
    queue.value = tracks

    if (tracks.length === 0) {
      currentIndex.value = -1; audio.src = ''; isPlaying.value = false; return
    }

    // Update currentIndex to match current track in new queue
    if (currentQid != null) {
      const newIndex = tracks.findIndex(t => t.queueItemId === currentQid)
      currentIndex.value = newIndex >= 0 ? newIndex : -1
    }
  }

  function addToQueue(track: PlayerTrack) {
    if (queue.value.some(t => t.songId === track.songId)) return
    queue.value.push(track)
  }

  function setSyncMode(enabled: boolean, userId: number) {
    syncMode.value = enabled
    currentUserId.value = userId
  }

  return {
    queue,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    playMode,
    currentTrack,
    hasTrack,
    songOwnerUserId,
    isSongOwner,
    currentQueueItemId,
    isDragging,
    play,
    pause,
    seek,
    setVolume,
    loadQueue,
    addToQueue,
    setSyncMode,
    applyRemoteState,
  }
})
