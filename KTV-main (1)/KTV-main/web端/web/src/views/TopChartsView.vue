<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { chartsApi, favoritesApi } from '@/api'
import { useSongOrder } from '@/composables/useSongOrder'
import { useParticleBurst } from '@/composables/useParticleBurst'
import { useHeartAnimation } from '@/composables/useHeartAnimation'
import type { Song } from '@/types'
import { formatPlayCount } from '@/utils/format'

const { orderSong } = useSongOrder()
const { burst } = useParticleBurst()
const { toggleHeart } = useHeartAnimation()
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'https://localhost:5001'

type ChartPeriod = 'daily' | 'weekly'

const period = ref<ChartPeriod>('daily')
const charts = ref<Song[]>([])
const favoritedSongIds = ref<Set<number>>(new Set())

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

async function loadCharts() {
  const api = period.value === 'daily' ? chartsApi.getDaily : chartsApi.getWeekly
  const { data } = await api()
  charts.value = data.slice(0, 10)
}

async function loadFavorites() {
  try {
    const { data } = await favoritesApi.getList()
    favoritedSongIds.value = new Set(data.map(f => f.songId))
  } catch { /* ignore */ }
}

async function toggleFavorite(songId: number, event: MouseEvent) {
  const btn = event.currentTarget as HTMLElement
  const wasFav = favoritedSongIds.value.has(songId)
  if (!wasFav) burst(btn)
  toggleHeart(btn, !wasFav, async () => {
    if (wasFav) { await favoritesApi.remove(songId); favoritedSongIds.value.delete(songId) }
    else { await favoritesApi.add(songId); favoritedSongIds.value.add(songId) }
    favoritedSongIds.value = new Set(favoritedSongIds.value)
  })
}

function isFavorited(songId: number) {
  return favoritedSongIds.value.has(songId)
}

function setPeriod(p: ChartPeriod) {
  period.value = p
  loadCharts()
}

onMounted(() => {
  loadCharts()
  loadFavorites()
  window.addEventListener('song-rejected', onSongRejected)
})
onUnmounted(() => {
  window.removeEventListener('song-rejected', onSongRejected)
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-8">
    <!-- Header Section -->
    <div class="mb-10 flex flex-col gap-6">
      <h1 class="text-5xl font-extrabold text-on-surface font-display tracking-tight">热门榜单</h1>
      <!-- Period toggle -->
      <div class="flex glass p-1 rounded-full w-max">
        <button
          @click="setPeriod('daily')"
          :class="[
            'px-6 py-2 rounded-full font-label font-bold transition-all',
            period === 'daily'
              ? 'glass text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-primary',
          ]"
        >
          日榜
        </button>
        <button
          @click="setPeriod('weekly')"
          :class="[
            'px-6 py-2 rounded-full font-label font-bold transition-all',
            period === 'weekly'
              ? 'glass text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-primary',
          ]"
        >
          周榜
        </button>
      </div>
    </div>

    <!-- Ranked song list -->
    <div class="flex flex-col gap-10" :class="{ 'song-list-bounce': songListSpringing }">
      <div
        v-for="(song, index) in charts"
        :key="song.id"
        class="flex items-center gap-6 hover:glass hover:shadow-lg hover:scale-[1.02] p-4 -mx-4 rounded-lg transition-all duration-300 cursor-pointer group"
      >
        <!-- Rank number -->
        <span
          class="text-3xl font-display w-12 text-center"
          :class="index === 0 ? 'font-black text-tertiary-container' : 'font-bold text-on-surface-variant'"
        >
          {{ index + 1 }}
        </span>

        <!-- Album cover -->
        <img
          v-if="song.coverUrl"
          :src="API_BASE + song.coverUrl"
          class="w-16 h-16 rounded shrink-0 object-cover"
          :alt="song.title"
          @error="($event.target as HTMLImageElement).src = API_BASE + '/uploads/covers/default.jpg'"
        />
        <div v-else class="w-16 h-16 rounded bg-surface-container shrink-0 shadow-sm flex items-center justify-center">
          <span class="material-symbols-outlined text-slate-400">image</span>
        </div>

        <!-- Song info -->
        <div class="flex-1 min-w-0">
          <h3 class="text-xl font-bold text-on-surface truncate font-headline mb-1">{{ song.title }}</h3>
          <p class="text-sm text-on-surface-variant truncate font-label">{{ song.artist }}</p>
        </div>

        <!-- Play count -->
        <div class="text-right mr-4 hidden sm:block">
          <span class="text-sm font-medium text-on-surface-variant font-label">{{ formatPlayCount(song.playCount) }} 次播放</span>
        </div>

        <!-- Order button -->
        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            @click="toggleFavorite(song.id, $event)"
            class="heart-btn w-[60px] h-[60px] flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            :class="{ 'is-fav': isFavorited(song.id) }"
          >
            <div class="heart-icon relative w-[30px] h-[30px]">
              <svg viewBox="0 0 24 24" class="absolute inset-0 w-full h-full"><path class="heart-outline" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              <svg viewBox="0 0 24 24" class="heart-fill-svg absolute inset-0 w-full h-full"><path class="heart-fill-path" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
          </button>
          <button
            @click="orderSong(song)"
            class="px-6 py-3 rounded-full font-bold font-label shrink-0 transition-colors bg-primary text-on-primary shadow-sm hover:bg-secondary"
          >
            点歌
          </button>
        </div>
      </div>
    </div>

    <!-- Duang toast (spring feedback) -->
    <Transition name="duang">
      <div v-if="duangMsg" class="duang-toast">{{ duangMsg }}</div>
    </Transition>
  </div>
</template>

<style scoped>
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

.heart-outline { fill: none; stroke: #cbd5e1; stroke-width: 1.5; transition: stroke 0.25s; }
.heart-fill-svg { opacity: 0; transition: none; }
.heart-fill-path { fill: #ef4444; }
.heart-btn.is-fav .heart-fill-svg { opacity: 1; clip-path: circle(75% at 50% 55%); }
.heart-btn.is-fav .heart-outline { stroke: #ef4444; }
.dark .heart-outline { stroke: var(--d-outline); }
.dark .heart-btn.is-fav .heart-outline { stroke: #ef4444; }
</style>
