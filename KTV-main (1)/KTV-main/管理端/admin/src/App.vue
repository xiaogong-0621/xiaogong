<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SideNavBar from '@/components/layout/SideNavBar.vue'
import TopNavBar from '@/components/layout/TopNavBar.vue'

const route = useRoute()
const isLoginPage = computed(() => route.name === 'Login')
</script>

<template>
  <template v-if="isLoginPage">
    <router-view />
  </template>
  <template v-else>
    <div class="app-shell flex min-h-screen w-full bg-surface">
      <SideNavBar />
      <div class="flex-1 ml-64 flex flex-col min-h-screen">
        <TopNavBar />
        <main class="flex-1">
          <router-view />
        </main>
      </div>
    </div>
  </template>
</template>
