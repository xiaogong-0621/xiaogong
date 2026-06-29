import { ref } from 'vue'
import { roomApi, playbackApi } from '@/api'
import { usePlayerStore } from '@/stores/player'
import { useAuthStore } from '@/stores/auth'
import type { Song } from '@/types'

export function useSongOrder() {
  const player = usePlayerStore()
  const auth = useAuthStore()
  const ordering = ref(false)

  async function orderSong(song: Song) {
    if (ordering.value) return
    ordering.value = true
    const wasEmpty = player.queue.length === 0
    try {
      // backend ignores roomId - it finds the user's room automatically
      const { data } = await roomApi.orderSong(song.id, 0)

      player.addToQueue({
        songId: song.id,
        title: song.title,
        artist: song.artist,
        coverUrl: song.coverUrl,
        mediaUrl: song.mediaUrl,
        lrcUrl: song.lrcUrl || '',
        orderedByUserId: auth.user?.id ?? 0,
        orderedByName: auth.user?.displayName ?? '',
        queueItemId: data.id,
      })

      // Auto-play if queue was empty (this is the first song)
      if (wasEmpty && data?.id) {
        await playbackApi.play(data.id)
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data || '点歌失败'
      window.dispatchEvent(new CustomEvent('song-rejected', { detail: msg }))
    } finally {
      ordering.value = false
    }
  }

  return { orderSong, ordering }
}
