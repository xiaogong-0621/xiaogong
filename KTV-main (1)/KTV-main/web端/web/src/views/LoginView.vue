<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  if (!username.value || !password.value) return
  errorMsg.value = ''
  loading.value = true
  try {
    const { data } = await authApi.login(username.value, password.value)
    authStore.setAuth(data.token, data.user)
    router.push('/rooms')
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || '用户名或密码错误'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden">
    <!-- Login card -->
    <div class="relative z-10 w-full max-w-[480px] glass rounded-2xl p-12 shadow-ambient dark:shadow-[0_32px_64px_var(--d-shadow-color)]">
      <!-- Logo section -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 dark:bg-[var(--d-primary-container)] mb-4">
          <span class="material-symbols-outlined text-4xl text-primary dark:text-[var(--d-primary)]">waves</span>
        </div>
        <h1 class="text-3xl font-headline font-bold text-primary dark:text-[var(--d-primary)]">声域友</h1>
        <p class="text-sm text-on-surface-variant dark:text-[var(--d-on-surface-variant)] uppercase tracking-widest mt-2 font-label">Hydro-Sonic Canvas</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-5">
        <!-- Username -->
        <div class="relative">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-[var(--d-on-surface-variant)]">person</span>
          <input
            v-model="username"
            type="text"
            placeholder="用户名 / 手机号 / 邮箱"
            class="w-full bg-surface-container-high dark:bg-[var(--d-input-bg)] border-none rounded-lg py-4 pl-12 pr-4 text-base text-on-surface dark:text-[var(--d-on-surface)] placeholder:text-on-surface-variant dark:placeholder:text-[var(--d-on-surface-variant)] font-body focus:ring-2 focus:ring-primary/30 focus:outline-none dark:ring-1 dark:ring-[var(--d-outline-variant)]"
          />
        </div>

        <!-- Password -->
        <div class="relative">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-[var(--d-on-surface-variant)]">lock</span>
          <input
            v-model="password"
            type="password"
            placeholder="密码"
            class="w-full bg-surface-container-high dark:bg-[var(--d-input-bg)] border-none rounded-lg py-4 pl-12 pr-4 text-base text-on-surface dark:text-[var(--d-on-surface)] placeholder:text-on-surface-variant dark:placeholder:text-[var(--d-on-surface-variant)] font-body focus:ring-2 focus:ring-primary/30 focus:outline-none dark:ring-1 dark:ring-[var(--d-outline-variant)]"
          />
        </div>

        <!-- Error message -->
        <p v-if="errorMsg" class="text-error dark:text-[var(--d-error)] text-sm font-medium">{{ errorMsg }}</p>

        <!-- Login button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-gradient-to-r from-primary to-secondary text-on-primary rounded-full py-4 font-bold font-label text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-150 hover:shadow-ambient-primary disabled:opacity-60"
        >
          <template v-if="loading">
            <span class="material-symbols-outlined animate-spin">progress_activity</span>
          </template>
          <template v-else>
            登录
            <span class="material-symbols-outlined">arrow_forward</span>
          </template>
        </button>
      </form>

      <!-- Register link -->
      <p class="text-center text-sm text-on-surface-variant dark:text-[var(--d-on-surface-variant)] mt-6">
        还没有账号？
        <router-link to="/register" class="text-primary dark:text-[var(--d-primary)] font-medium hover:underline">注册</router-link>
      </p>
    </div>
  </div>
</template>
