<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { songsApi, feedbacksApi, favoritesApi } from '@/api'
import { useSongOrder } from '@/composables/useSongOrder'
import type { Song } from '@/types'
import { formatPlayCount } from '@/utils/format'
import { useToast } from '@/composables/useToast'
import { useParticleBurst } from '@/composables/useParticleBurst'
import { useHeartAnimation } from '@/composables/useHeartAnimation'

// Toast
const { toastMsg, showToast } = useToast()
const { burst } = useParticleBurst()
const { toggleHeart } = useHeartAnimation()

const route = useRoute()
const { orderSong } = useSongOrder()
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'https://localhost:5001'
const genres = ref<string[]>([])
const selectedGenre = ref<string>('')
const searchKeyword = ref('')
const songs = ref<Song[]>([])
const favoritedSongIds = ref<Set<number>>(new Set())

// Spring animation for duplicate song
const songListSpringing = ref(false)
const duangMsg = ref('')
function onSongRejected(e: Event) {
  duangMsg.value = (e as CustomEvent).detail
  songListSpringing.value = true
  setTimeout(() => { songListSpringing.value = false }, 550)
  setTimeout(() => { duangMsg.value = '' }, 1200)
}

// Feedback dialog state
const showFeedbackDialog = ref(false)
const feedbackType = ref('request_song')
const feedbackSongName = ref('')
const feedbackArtist = ref('')
const feedbackDescription = ref('')
const feedbackSuccess = ref(false)
const feedbackLoading = ref(false)

async function loadGenres() {
  const { data } = await songsApi.getGenres()
  genres.value = data
}

async function loadSongs() {
  const { data } = await songsApi.getList({
    search: searchKeyword.value || undefined,
    genre: selectedGenre.value || undefined,
    page: 1,
    pageSize: 50,
  })
  songs.value = data.items
}

function doSearch() {
  loadSongs()
}

function selectGenre(genre: string) {
  selectedGenre.value = genre
  loadSongs()
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
    try {
      if (wasFav) {
        await favoritesApi.remove(songId)
        favoritedSongIds.value.delete(songId)
      } else {
        await favoritesApi.add(songId)
        favoritedSongIds.value.add(songId)
      }
      favoritedSongIds.value = new Set(favoritedSongIds.value)
    } catch (err: any) {
      showToast(err.response?.data?.message || '操作失败')
    }
  })
}

function isFavorited(songId: number) {
  return favoritedSongIds.value.has(songId)
}

function openFeedbackDialog() {
  feedbackType.value = 'request_song'
  feedbackSongName.value = ''
  feedbackArtist.value = ''
  feedbackDescription.value = ''
  feedbackSuccess.value = false
  showFeedbackDialog.value = true
}

async function submitFeedback() {
  feedbackLoading.value = true
  try {
    await feedbacksApi.create({
      feedbackType: feedbackType.value,
      songName: feedbackSongName.value || undefined,
      artist: feedbackArtist.value || undefined,
      description: feedbackDescription.value || undefined,
    })
    feedbackSuccess.value = true
    setTimeout(() => { showFeedbackDialog.value = false }, 1500)
  } catch (err: any) {
    showToast(err.response?.data?.message || '提交失败')
  } finally {
    feedbackLoading.value = false
  }
}

onMounted(() => {
  if (route.query.search) searchKeyword.value = String(route.query.search)
  loadGenres()
  loadSongs()
  loadFavorites()
  window.addEventListener('song-rejected', onSongRejected)
})
onUnmounted(() => {
  window.removeEventListener('song-rejected', onSongRejected)
})

watch(() => route.query.search, (val) => {
  searchKeyword.value = val ? String(val) : ''
  loadSongs()
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

/* List spring bounce */
.song-list-bounce {
  animation: squishBounce 0.5s ease;
}
@keyframes squishBounce {
  0%   { transform: scaleY(1); }
  15%  { transform: scaleY(0.996); }
  35%  { transform: scaleY(1.002); }
  55%  { transform: scaleY(0.999); }
  100% { transform: scaleY(1); }
}

/* SVG heart */
.heart-outline { fill: none; stroke: #cbd5e1; stroke-width: 1.5; transition: stroke 0.25s; }
.heart-fill-svg { opacity: 0; transition: none; }
.heart-fill-path { fill: #ef4444; }
.heart-btn.is-fav .heart-fill-svg { opacity: 1; clip-path: circle(75% at 50% 55%); }
.heart-btn.is-fav .heart-outline { stroke: #ef4444; }
.dark .heart-outline { stroke: var(--d-outline); }
.dark .heart-btn.is-fav .heart-outline { stroke: #ef4444; }
</style>

<template>
  <div class="max-w-4xl mx-auto px-8">
    <!-- Page Title -->
    <div class="mb-10">
      <h1 class="text-5xl font-extrabold text-on-surface dark:text-[var(--d-on-surface)] font-display tracking-tight mb-2">探索歌曲</h1>
      <p class="text-on-surface-variant dark:text-[var(--d-on-surface-variant)]">探索属于你的音乐世界，发现最新潮流单曲</p>
    </div>

    <!-- Search bar -->
    <div class="relative mb-6">
      <input
        v-model="searchKeyword"
        @keydown.enter="doSearch"
        placeholder="搜索歌曲名、歌手..."
        class="w-full bg-surface-container dark:bg-[var(--d-input-bg)] dark:text-[var(--d-on-surface)] dark:placeholder:text-[var(--d-on-surface-variant)] border-none rounded-full px-6 py-3 focus:ring-2 focus:ring-primary outline-none dark:ring-1 dark:ring-[var(--d-outline-variant)] text-sm"
      />
      <span @click="doSearch" class="material-symbols-outlined absolute right-4 top-3 text-slate-400 dark:text-[var(--d-on-surface-variant)] cursor-pointer">search</span>
    </div>

    <!-- Genre filter pills -->
    <div class="flex items-center gap-3 mb-10 overflow-x-auto pb-2">
      <button
        @click="selectGenre('')"
        :class="[
          'px-6 py-2 rounded-full font-bold text-sm transition-all',
          selectedGenre === ''
            ? 'bg-primary text-on-primary dark:bg-[var(--d-primary)] dark:text-[var(--d-on-primary)]'
            : 'glass text-on-surface dark:text-[var(--d-on-surface)] hover:bg-primary-fixed dark:hover:bg-[var(--d-hover-bg)] shadow-sm',
        ]"
      >
        全部
      </button>
      <button
        v-for="genre in genres"
        :key="genre"
        @click="selectGenre(genre)"
        :class="[
          'px-6 py-2 rounded-full font-bold text-sm transition-all',
          selectedGenre === genre
            ? 'bg-primary text-on-primary dark:bg-[var(--d-primary)] dark:text-[var(--d-on-primary)]'
            : 'glass text-on-surface dark:text-[var(--d-on-surface)] hover:bg-primary-fixed dark:hover:bg-[var(--d-hover-bg)] shadow-sm',
        ]"
      >
        {{ genre }}
      </button>
    </div>

    <!-- Song list -->
    <div class="flex flex-col gap-4" :class="{ 'song-list-bounce': songListSpringing }">
      <div
        v-for="song in songs"
        :key="song.id"
        class="flex items-center gap-6 p-4 -mx-4 rounded-lg hover:glass hover:shadow-lg dark:hover:shadow-[0_4px_20px_var(--d-shadow-color)] hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
      >
        <!-- Album cover -->
        <img
          v-if="song.coverUrl"
          :src="API_BASE + song.coverUrl"
          class="w-16 h-16 rounded shrink-0 object-cover"
          :alt="song.title"
          @error="($event.target as HTMLImageElement).src = API_BASE + '/uploads/covers/default.jpg'"
        />
        <div v-else class="w-16 h-16 rounded bg-surface-container dark:bg-[var(--d-surface-container-high)] shrink-0 shadow-sm flex items-center justify-center">
          <span class="material-symbols-outlined text-slate-400 dark:text-[var(--d-outline)]">image</span>
        </div>

        <!-- Song info -->
        <div class="flex-1 min-w-0">
          <h3 class="text-xl font-bold text-on-surface dark:text-[var(--d-on-surface)] truncate font-headline mb-1">{{ song.title }}</h3>
          <p class="text-sm text-on-surface-variant dark:text-[var(--d-on-surface-variant)] truncate font-label">{{ song.artist }}</p>
        </div>

        <!-- Play count -->
        <div class="text-right mr-4 hidden sm:block">
          <span class="text-sm font-medium text-on-surface-variant dark:text-[var(--d-on-surface-variant)] font-label">{{ formatPlayCount(song.playCount) }} 次播放</span>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <!-- Favorite toggle -->
          <button
            @click="toggleFavorite(song.id, $event)"
            class="heart-btn w-[60px] h-[60px] flex items-center justify-center rounded-full hover:bg-surface-container-high dark:hover:bg-[var(--d-hover-bg)] transition-colors"
            :class="{ 'is-fav': isFavorited(song.id) }"
          >
            <div class="heart-icon relative w-[30px] h-[30px]">
              <svg viewBox="0 0 24 24" class="absolute inset-0 w-full h-full"><path class="heart-outline" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              <svg viewBox="0 0 24 24" class="heart-fill-svg absolute inset-0 w-full h-full"><path class="heart-fill-path" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
          </button>
          <!-- Order button -->
          <button
            @click="orderSong(song)"
            class="px-6 py-3 bg-primary text-on-primary rounded-full font-bold font-body text-sm active:scale-90 transition-transform shadow-lg shadow-primary/10"
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

    <!-- Feedback FAB -->
    <button
      @click="openFeedbackDialog"
      class="fixed bottom-28 right-8 w-14 h-14 bg-primary text-on-primary dark:bg-[var(--d-primary)] dark:text-[var(--d-on-primary)] rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-40"
      title="反馈"
    >
      <span class="material-symbols-outlined">feedback</span>
    </button>

    <!-- Feedback Dialog -->
    <div v-if="showFeedbackDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60" @click.self="showFeedbackDialog = false">
      <div class="glass rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
        <template v-if="!feedbackSuccess">
          <h3 class="text-xl font-display font-bold text-on-surface dark:text-[var(--d-on-surface)]">用户反馈</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-on-surface-variant dark:text-[var(--d-on-surface-variant)] mb-1">反馈类型</label>
              <select v-model="feedbackType" class="w-full bg-surface-container-high dark:bg-[var(--d-input-bg)] border-none rounded-lg py-3 px-4 text-on-surface dark:text-[var(--d-on-surface)] focus:ring-2 focus:ring-primary/30 outline-none dark:ring-1 dark:ring-[var(--d-outline-variant)]">
                <option value="request_song">请求添加歌曲</option>
                <option value="report_error">歌曲信息纠错</option>
                <option value="other">其他建议</option>
              </select>
            </div>
            <div v-if="feedbackType === 'request_song' || feedbackType === 'report_error'">
              <label class="block text-sm font-medium text-on-surface-variant dark:text-[var(--d-on-surface-variant)] mb-1">歌曲名称 {{ feedbackType === 'request_song' ? '(必填)' : '' }}</label>
              <input v-model="feedbackSongName" :required="feedbackType === 'request_song'" class="w-full bg-surface-container-high dark:bg-[var(--d-input-bg)] border-none rounded-lg py-3 px-4 text-on-surface dark:text-[var(--d-on-surface)] focus:ring-2 focus:ring-primary/30 outline-none dark:ring-1 dark:ring-[var(--d-outline-variant)]" />
            </div>
            <div v-if="feedbackType === 'request_song' || feedbackType === 'report_error'">
              <label class="block text-sm font-medium text-on-surface-variant dark:text-[var(--d-on-surface-variant)] mb-1">歌手（可选）</label>
              <input v-model="feedbackArtist" class="w-full bg-surface-container-high dark:bg-[var(--d-input-bg)] border-none rounded-lg py-3 px-4 text-on-surface dark:text-[var(--d-on-surface)] focus:ring-2 focus:ring-primary/30 outline-none dark:ring-1 dark:ring-[var(--d-outline-variant)]" />
            </div>
            <div>
              <label class="block text-sm font-medium text-on-surface-variant dark:text-[var(--d-on-surface-variant)] mb-1">补充说明（可选）</label>
              <textarea v-model="feedbackDescription" rows="3" class="w-full bg-surface-container-high dark:bg-[var(--d-input-bg)] border-none rounded-lg py-3 px-4 text-on-surface dark:text-[var(--d-on-surface)] focus:ring-2 focus:ring-primary/30 outline-none resize-none dark:ring-1 dark:ring-[var(--d-outline-variant)]"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button @click="showFeedbackDialog = false" class="px-6 py-3 rounded-lg font-medium text-on-surface-variant dark:text-[var(--d-on-surface-variant)] hover:bg-surface-container dark:hover:bg-[var(--d-hover-bg)] transition-colors">取消</button>
            <button @click="submitFeedback" :disabled="feedbackLoading" class="px-6 py-3 bg-primary text-on-primary dark:bg-[var(--d-primary)] dark:text-[var(--d-on-primary)] rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
              {{ feedbackLoading ? '提交中...' : '提交' }}
            </button>
          </div>
        </template>
        <template v-else>
          <div class="text-center py-8">
            <span class="material-symbols-outlined text-5xl text-primary dark:text-[var(--d-primary)] mb-4">check_circle</span>
            <p class="text-lg font-semibold text-on-surface dark:text-[var(--d-on-surface)]">反馈已提交，感谢您的建议</p>
          </div>
        </template>
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
