<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { favoritesApi } from '@/api'
import { useSongOrder } from '@/composables/useSongOrder'
import { useToast } from '@/composables/useToast'
import { useExplodeRemove } from '@/composables/useExplodeRemove'
import { useParticleBurst } from '@/composables/useParticleBurst'
import { useHeartAnimation } from '@/composables/useHeartAnimation'
import type { Favorite } from '@/types'

const { orderSong } = useSongOrder()
const { toastMsg, showToast } = useToast()
const { trigger: triggerExplode, cleanup: cleanupExplode } = useExplodeRemove()
const { burst } = useParticleBurst()
const { toggleHeart } = useHeartAnimation()

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'https://localhost:5001'
const favorites = ref<Favorite[]>([])
const removingId = ref<number | null>(null)

// Spring animation for duplicate song
const songListSpringing = ref(false)
const duangMsg = ref('')
function onSongRejected(e: Event) {
  const msg = (e as CustomEvent).detail
  duangMsg.value = msg
  songListSpringing.value = true
  setTimeout(() => { songListSpringing.value = false }, 550)
  setTimeout(() => { duangMsg.value = '' }, 1200)
}

// Template ref map: songId → card DOM element
const cardRefs = ref<Map<number, HTMLElement>>(new Map())
function setCardRef(songId: number) {
  return (el: any) => {
    if (el) cardRefs.value.set(songId, el)
    else cardRefs.value.delete(songId)
  }
}

async function loadFavorites() {
  const { data } = await favoritesApi.getList()
  favorites.value = data
}

function unfavorite(songId: number, event: MouseEvent) {
  if (removingId.value) return
  removingId.value = songId

  const cardEl = cardRefs.value.get(songId)
  const btn = event.currentTarget as HTMLElement
  if (!cardEl) { removingId.value = null; return }

  // Heart unfill + button particle burst
  burst(btn)
  toggleHeart(btn, false, () => {
    // After heart unfill: whole-card explosion
    const restoreCard = triggerExplode(cardEl, { autoRemove: false })

    // After explosion: API call → remove from list
    setTimeout(async () => {
      try {
        await favoritesApi.remove(songId)
        favorites.value = favorites.value.filter(f => f.songId !== songId)
      } catch (err: any) {
        restoreCard()
        showToast(err.response?.data?.message || '取消收藏失败')
      } finally {
        removingId.value = null
      }
    }, 820)
  })
}

onMounted(() => {
  loadFavorites()
  window.addEventListener('song-rejected', onSongRejected)
})
onUnmounted(() => {
  cleanupExplode()
  window.removeEventListener('song-rejected', onSongRejected)
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-8">
    <!-- Page header -->
    <div class="mb-10">
      <h1 class="text-5xl font-extrabold text-on-surface font-display tracking-tight mb-2">我的收藏</h1>
      <p class="text-on-surface-variant">{{ favorites.length }} 首歌曲</p>
    </div>

    <!-- Favorites list -->
    <TransitionGroup name="fav" tag="div" class="flex flex-col" :class="{ 'song-list-bounce': songListSpringing }">
      <div
        v-for="favorite in favorites"
        :key="favorite.id"
        :ref="setCardRef(favorite.songId)"
        class="card flex items-center gap-6 p-4 -mx-4 rounded-lg cursor-pointer group"
        :class="{ 'card-removing': removingId === favorite.songId }"
      >
        <!-- Album cover -->
        <img
          v-if="favorite.song.coverUrl"
          :src="API_BASE + favorite.song.coverUrl"
          class="w-16 h-16 rounded shrink-0 object-cover"
          :alt="favorite.song.title"
          @error="($event.target as HTMLImageElement).src = API_BASE + '/uploads/covers/default.jpg'"
        />
        <div v-else class="w-16 h-16 rounded bg-surface-container shrink-0 shadow-sm flex items-center justify-center">
          <span class="material-symbols-outlined text-slate-400">image</span>
        </div>

        <!-- Song info -->
        <div class="flex-1 min-w-0">
          <h3 class="text-xl font-bold text-on-surface truncate font-headline mb-1">{{ favorite.song.title }}</h3>
          <p class="text-sm text-on-surface-variant truncate font-label">{{ favorite.song.artist }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            @click="unfavorite(favorite.songId, $event)"
            class="heart-btn is-fav w-[60px] h-[60px] flex items-center justify-center text-error hover:bg-error/10 rounded-full transition-colors"
            :class="{ 'pointer-events-none opacity-50': removingId === favorite.songId }"
          >
            <div class="heart-icon relative w-[30px] h-[30px]">
              <svg viewBox="0 0 24 24" class="absolute inset-0 w-full h-full"><path class="heart-outline" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              <svg viewBox="0 0 24 24" class="heart-fill-svg absolute inset-0 w-full h-full" style="opacity:1;clip-path:circle(75% at 50% 55%)"><path class="heart-fill-path" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
          </button>
          <button
            @click="orderSong(favorite.song)"
            class="px-6 py-3 bg-primary text-on-primary rounded-full font-bold text-sm active:scale-90 transition-transform shadow-lg shadow-primary/10"
          >
            点歌
          </button>
        </div>
      </div>
    </TransitionGroup>

    <!-- Empty state -->
    <div v-if="favorites.length === 0" class="text-center py-20">
      <span class="material-symbols-outlined text-6xl text-surface-container-highest">favorite_border</span>
      <p class="text-on-surface-variant mt-4">还没有收藏的歌曲</p>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toastMsg" class="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-error text-on-error px-6 py-3 rounded-xl shadow-lg text-sm font-medium">
        {{ toastMsg }}
      </div>
    </Transition>

    <!-- Duang toast (spring feedback) -->
    <Transition name="duang">
      <div v-if="duangMsg" class="duang-toast">{{ duangMsg }}</div>
    </Transition>
  </div>
</template>

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

/* List spring bounce */
.song-list-bounce {
  animation: squishBounce 0.5s ease;
}
@keyframes squishBounce {
  0%   { transform: scaleY(1); }
  15%  { transform: scaleY(0.985); }
  35%  { transform: scaleY(1.008); }
  55%  { transform: scaleY(0.997); }
  100% { transform: scaleY(1); }
}

/* Duang toast */
.duang-toast {
  position: fixed; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.75); color: #fff;
  padding: 12px 28px; border-radius: 16px;
  font-size: 16px; font-weight: 700;
  white-space: nowrap; pointer-events: none; z-index: 200;
}
.duang-enter-active {
  animation: duangPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.duang-leave-active {
  animation: duangFade 0.4s ease forwards;
}
@keyframes duangPop {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  60% { transform: translate(-50%, -50%) scale(1.03); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
@keyframes duangFade {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
}

/* --- Card base --- */
.card {
  margin-bottom: 16px;
  transition: background 0.2s, box-shadow 0.2s, transform 0.15s ease, margin-bottom 0.25s ease;
}
.card:hover {
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: scale(1.02);
}

/* --- Exploding card: lock pointer, override transitions --- */
.card-removing {
  pointer-events: none !important;
  transition: transform 0.1s ease, opacity 0.1s ease, max-height 0.25s ease,
    margin-bottom 0.25s ease, padding 0.25s ease !important;
}

/* --- TransitionGroup move (other items slide into gap) --- */
.fav-move {
  transition: transform 0.3s ease;
}

/* Dark mode */
.dark .card:hover {
  background: var(--d-hover-bg);
  box-shadow: 0 4px 12px var(--d-shadow-color);
}

/* SVG heart */
.heart-outline { fill: none; stroke: #ef4444; stroke-width: 1.5; transition: stroke 0.25s; }
.heart-fill-svg { opacity: 0; transition: none; }
.heart-fill-path { fill: #ef4444; }
.heart-btn.is-fav .heart-outline { stroke: #ef4444; }
</style>
