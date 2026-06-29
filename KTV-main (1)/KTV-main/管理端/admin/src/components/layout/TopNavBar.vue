<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const pageTitle = computed(() => {
  return (route.meta?.title as string) || ''
})
</script>

<template>
  <header class="w-full h-16 sticky top-0 z-40 bg-white/80 backdrop-blur-xl flex justify-between items-center px-8">
    <div class="flex items-center gap-4">
      <h2 class="text-lg font-bold text-slate-900 font-headline">{{ pageTitle }}</h2>
    </div>
    <div class="flex items-center gap-3">
      <button class="text-slate-500 hover:bg-slate-100 rounded-full p-2 transition-all press-scale">
        <span class="material-symbols-outlined">notifications</span>
      </button>
      <button class="text-slate-500 hover:bg-slate-100 rounded-full p-2 transition-all press-scale">
        <span class="material-symbols-outlined">help_outline</span>
      </button>
      <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center ml-2 cursor-pointer ghost-border">
        <span class="material-symbols-outlined text-on-surface-variant text-sm">person</span>
      </div>
    </div>
  </header>
</template>
