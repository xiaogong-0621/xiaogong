<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-container-lowest">
    <div class="w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-xl ring-1 ring-outline-variant/15 p-8 space-y-6">
      <div class="text-center">
        <span class="material-symbols-outlined text-5xl text-primary">admin_panel_settings</span>
        <h1 class="mt-3 text-2xl font-display font-bold text-on-surface">管理端登录</h1>
        <p class="mt-1 text-sm text-on-surface-variant">声域友后台管理系统</p>
      </div>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-on-surface-variant mb-1">用户名</label>
          <input v-model="username" required class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-on-surface-variant mb-1">密码</label>
          <input v-model="password" type="password" required class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
        </div>
        <p v-if="error" class="text-error text-sm">{{ error }}</p>
        <button type="submit" :disabled="loading" class="w-full py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001'

const username = ref('admin')
const password = ref('demo_hash_admin')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || '登录失败')
    }
    const data = await res.json()
    auth.setAuth(data.token, data.user)
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err.message || '网络错误，请重试'
  } finally {
    loading.value = false
  }
}
</script>
