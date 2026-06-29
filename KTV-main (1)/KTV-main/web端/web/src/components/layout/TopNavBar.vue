<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { roomApi, authApi } from '@/api'

const router = useRouter()
const auth = useAuthStore()
const notificationStore = useNotificationStore()
const showMenu = ref(false)
const isDark = ref(false)
const searchQuery = ref('')

function doSearch() {
  const q = searchQuery.value.trim()
  if (q) router.push({ path: '/explore', query: { search: q } })
}

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  if (isDark.value) document.documentElement.classList.add('dark')
  // 启动通知轮询
  notificationStore.startPolling()
})

onUnmounted(() => {
  notificationStore.stopPolling()
})

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

async function handleLogout() {
  showMenu.value = false
  if (auth.currentRoomId > 0) {
    try { await roomApi.leaveRoom(auth.currentRoomId) } catch { /* ignore */ }
  }
  try { await authApi.logout() } catch { /* ignore */ }
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 glass flex justify-between items-center w-full px-8 py-4 font-headline text-sm tracking-wide">
    <div class="flex items-center gap-8">
      <span class="text-xl font-bold tracking-tighter text-on-surface dark:text-[var(--d-on-surface)]">声域友</span>
      <div class="relative w-96">
        <input v-model="searchQuery" @keydown.enter="doSearch" class="w-full bg-surface-container dark:bg-[var(--d-input-bg)] dark:text-[var(--d-on-surface)] dark:placeholder:text-[var(--d-on-surface-variant)] border-none rounded-full px-6 py-2 focus:ring-2 focus:ring-primary outline-none dark:ring-1 dark:ring-[var(--d-outline-variant)]" placeholder="搜索歌曲、歌手..." type="text"/>
        <span @click="doSearch" class="material-symbols-outlined absolute right-4 top-2 text-slate-400 dark:text-[var(--d-on-surface-variant)] cursor-pointer">search</span>
      </div>
    </div>
    <div class="flex items-center gap-6">
      <button
        @click="toggleDark"
        class="hover:bg-surface-container dark:hover:bg-[var(--d-hover-bg)] p-2 rounded-full transition-colors press-scale"
        :title="isDark ? '切换亮色模式' : '切换深色模式'"
      >
        <span class="material-symbols-outlined text-primary dark:text-[var(--d-primary)]">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
      </button>
      <button
        @click="router.push('/notifications')"
        class="relative hover:bg-surface-container dark:hover:bg-[var(--d-hover-bg)] p-2 rounded-full transition-colors press-scale"
      >
        <span class="material-symbols-outlined text-primary dark:text-[var(--d-primary)]">notifications</span>
        <span
          v-if="notificationStore.hasUnread"
          class="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center"
        >
          {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
        </span>
      </button>
      <!-- Avatar dropdown -->
      <div class="relative">
        <button
          @click="showMenu = !showMenu"
          class="w-10 h-10 bg-primary-container dark:bg-[var(--d-primary-container)] text-on-primary-container dark:text-[var(--d-primary)] rounded-full flex items-center justify-center text-sm font-bold border-2 border-white dark:border-[var(--d-outline-variant)] shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          {{ auth.user?.displayName?.charAt(0)?.toUpperCase() || '?' }}
        </button>
        <!-- Dropdown -->
        <div
          v-if="showMenu"
          class="absolute right-0 mt-2 w-40 bg-surface-container-lowest dark:bg-[var(--d-surface-container-high)] rounded-xl shadow-xl ring-1 ring-outline-variant/15 dark:ring-[var(--d-outline-variant)] py-2 z-50"
        >
          <div class="px-4 py-2 text-xs text-on-surface-variant dark:text-[var(--d-on-surface-variant)] border-b border-outline-variant/10 dark:border-[var(--d-outline-variant)]">
            {{ auth.user?.displayName }}
          </div>
          <button
            @click="showMenu = false; router.push('/profile')"
            class="w-full text-left px-4 py-2.5 text-sm text-on-surface dark:text-[var(--d-on-surface)] hover:bg-surface-container dark:hover:bg-[var(--d-hover-bg)] flex items-center gap-2 transition-colors"
          >
            <span class="material-symbols-outlined text-lg">person</span>
            个人主页
          </button>
          <button
            @click="handleLogout"
            class="w-full text-left px-4 py-2.5 text-sm text-error dark:text-[var(--d-error)] hover:bg-error/5 dark:hover:bg-[var(--d-hover-bg)] flex items-center gap-2 transition-colors"
          >
            <span class="material-symbols-outlined text-lg">logout</span>
            退出登录
          </button>
        </div>
      </div>
    </div>
  </header>
  <!-- Click outside to close -->
  <div v-if="showMenu" class="fixed inset-0 z-40" @click="showMenu = false"></div>
</template>
