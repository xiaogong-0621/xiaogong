<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-screen relative">
    <div class="relative z-10 max-w-2xl mx-auto px-5 flex items-center gap-3 py-4">
      <button
        @click="router.back()"
        class="w-10 h-10 rounded-xl bg-surface-container-lowest/70 backdrop-blur-lg border border-outline-variant/10 shadow-ambient-sm flex items-center justify-center hover:bg-surface-container hover:scale-105 transition-all"
      >
        <span class="material-symbols-outlined text-lg text-on-surface">arrow_back</span>
      </button>
      <span class="text-lg font-bold text-on-surface font-headline">隐私设置</span>
    </div>

    <div class="relative z-10 max-w-2xl mx-auto px-5 pb-16">
      <div class="flex flex-col items-center justify-center py-32">
        <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <span class="material-symbols-outlined text-4xl text-primary">privacy_tip</span>
        </div>
        <p class="text-lg font-bold text-on-surface font-headline mb-1">隐私设置</p>
        <p class="text-sm text-outline">功能开发中，敬请期待</p>
      </div>
    </div>
  </div>
</template>
