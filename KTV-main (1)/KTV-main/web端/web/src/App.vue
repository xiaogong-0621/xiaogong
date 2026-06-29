<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SideNavBar from '@/components/layout/SideNavBar.vue'
import TopNavBar from '@/components/layout/TopNavBar.vue'
import BottomPlayerBar from '@/components/layout/BottomPlayerBar.vue'

const route = useRoute()
const router = useRouter()
const isAuthPage = computed(() => ['Login', 'Register', 'Profile', 'Notifications', 'Privacy', 'About'].includes(route.name as string))
const sidebarCollapsed = ref(false)
const isDark = ref(false)

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  const observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

function onAuthExpired() {
  const authStore = useAuthStore()
  authStore.logout()
  router.push('/login')
}

onMounted(() => window.addEventListener('auth:expired', onAuthExpired))
onUnmounted(() => window.removeEventListener('auth:expired', onAuthExpired))
</script>

<template>
  <!-- 流光背景色块 -->
  <div class="blob-container dark:opacity-20 transition-opacity duration-500">
    <div class="blob blob-1" />
    <div class="blob blob-2" />
    <div class="blob blob-3" />
    <div class="blob blob-4" />
    <div class="blob blob-5" />
  </div>

  <template v-if="isAuthPage">
    <router-view />
  </template>
  <template v-else>
    <div class="app-shell" style="position: relative; z-index: 1;">
      <TopNavBar />
      <SideNavBar :collapsed="sidebarCollapsed" @toggle="sidebarCollapsed = !sidebarCollapsed" />
      <main class="pt-24 px-10 pb-28 transition-all duration-300" :class="sidebarCollapsed ? 'ml-20' : 'ml-64'">
        <div class="max-w-6xl mx-auto">
          <router-view />
        </div>
      </main>
      <BottomPlayerBar />
    </div>
  </template>
</template>

<style>
.blob-container {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}
.blob {
  position: absolute;
  border-radius: 9999px;
}

/* 大色块 — 活动范围小（10~50vw / 10~50vh），慢速，稳重 */
.blob-1 {
  width: 600px; height: 600px;
  top: 20%; left: 20%;
  background: #71fcfe;
  filter: blur(100px);
  animation: blob1 15s ease-in-out infinite;
}
.blob-2 {
  width: 500px; height: 500px;
  top: 25%; left: 30%;
  background: rgba(113, 252, 254, 0.7);
  filter: blur(90px);
  animation: blob2 15s ease-in-out infinite;
}

/* 中色块 — 活动范围适中（5~70vw / 5~70vh），中速 */
.blob-3 {
  width: 450px; height: 450px;
  top: 20%; left: 20%;
  background: #71fcfe;
  filter: blur(110px);
  animation: blob3 10s ease-in-out infinite;
}
.blob-4 {
  width: 400px; height: 400px;
  top: 15%; right: 15%;
  background: rgba(200, 240, 255, 0.8);
  filter: blur(80px);
  animation: blob4 10s ease-in-out infinite;
}

/* 小色块 — 活动范围大（-5~90vw / -5~90vh），快速，可跑出屏幕 */
.blob-5 {
  width: 350px; height: 350px;
  top: 30%; left: 30%;
  background: rgba(113, 252, 254, 0.6);
  filter: blur(100px);
  animation: blob5 8s ease-in-out infinite;
}

/* 大色块 keyframes：活动范围 ±20vw / ±20vh */
@keyframes blob1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(15vw, -12vh) scale(1.08); }
  50% { transform: translate(-10vw, 15vh) scale(0.94); }
  75% { transform: translate(12vw, 8vh) scale(1.05); }
}
@keyframes blob2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(-12vw, 10vh) scale(1.06); }
  50% { transform: translate(10vw, -12vh) scale(0.92); }
  75% { transform: translate(-8vw, -10vh) scale(1.04); }
}

/* 中色块 keyframes：活动范围 ±30vw / ±30vh */
@keyframes blob3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(25vw, -20vh) scale(1.1); }
  50% { transform: translate(-20vw, 22vh) scale(0.9); }
  75% { transform: translate(15vw, -18vh) scale(1.06); }
}
@keyframes blob4 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  20% { transform: translate(-22vw, -18vh) scale(1.06); }
  40% { transform: translate(28vw, 15vh) scale(0.92); }
  60% { transform: translate(-15vw, 25vh) scale(1.1); }
  80% { transform: translate(20vw, -12vh) scale(0.95); }
}

/* 小色块 keyframes：活动范围 ±45vw / ±45vh，可跑出屏幕 */
@keyframes blob5 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  20% { transform: translate(-40vw, -30vh) scale(1.1); }
  40% { transform: translate(35vw, 40vh) scale(0.88); }
  60% { transform: translate(-30vw, 20vh) scale(1.08); }
  80% { transform: translate(40vw, -25vh) scale(0.93); }
}
</style>
