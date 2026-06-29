<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: '仪表盘' },
  { path: '/rooms', icon: 'meeting_room', label: '房间监控' },
  { path: '/songs', icon: 'library_music', label: '歌曲管理' },
  { path: '/feedbacks', icon: 'feedback', label: '反馈管理' },
  { path: '/accounts', icon: 'manage_accounts', label: '账户管理' },
  { path: '/settings', icon: 'settings', label: '系统设置' },
]

const isActive = (path: string) => route.path === path
</script>

<template>
  <nav class="h-screen w-64 fixed left-0 top-0 bg-slate-950 shadow-xl shadow-black/20 z-50 flex flex-col py-6 font-headline text-sm tracking-wide">
    <!-- Brand -->
    <div class="px-8 mb-8 flex items-center gap-3">
      <div class="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
        <span class="material-symbols-outlined text-white">graphic_eq</span>
      </div>
      <div>
        <div class="text-2xl font-bold tracking-tight text-white">声域友</div>
        <div class="text-xs text-slate-400 mt-1">Admin Console</div>
      </div>
    </div>
    <!-- Nav Links -->
    <div class="flex-1 flex flex-col gap-2 overflow-y-auto mt-4">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-4 mx-3 px-4 py-3 transition-all duration-200 press-scale"
        :class="isActive(item.path)
          ? 'bg-sky-900/40 text-sky-400 font-semibold rounded-xl'
          : 'text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl group'"
      >
        <span
          class="material-symbols-outlined"
          :class="!isActive(item.path) ? 'group-hover:text-sky-400' : ''"
        >{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </router-link>
    </div>
    <!-- Profile -->
    <div class="mt-auto pt-6 px-4">
      <div class="flex items-center gap-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
        <div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-500 overflow-hidden leading-tight text-center px-1">
          管理员头像
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-semibold text-white">管理员</span>
          <span class="text-xs">退出登录</span>
        </div>
      </div>
    </div>
  </nav>
</template>
