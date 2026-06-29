<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { toastMsg, showToast } = useToast()

const registerMethod = ref<'username' | 'phone' | 'email'>('username')
const username = ref('')
const phone = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const displayName = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleRegister() {
  errorMsg.value = ''

  if (!password.value || !displayName.value) {
    errorMsg.value = '密码和昵称不能为空'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }
  if (registerMethod.value === 'username' && !username.value) {
    errorMsg.value = '请输入用户名'
    return
  }
  if (registerMethod.value === 'phone' && !phone.value) {
    errorMsg.value = '请输入手机号'
    return
  }
  if (registerMethod.value === 'email' && !email.value) {
    errorMsg.value = '请输入邮箱'
    return
  }

  loading.value = true
  try {
    await authApi.register({
      username: username.value || undefined,
      phone: phone.value || undefined,
      email: email.value || undefined,
      password: password.value,
      displayName: displayName.value,
    })
    showToast('注册成功，请登录', 3000)
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden">
    <!-- Toast notification -->
    <Transition name="toast">
      <div v-if="toastMsg" class="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium">
        {{ toastMsg }}
      </div>
    </Transition>

    <!-- Register card -->
    <div class="relative z-10 w-full max-w-[480px] glass rounded-2xl p-12 shadow-ambient">
      <!-- Logo section -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <span class="material-symbols-outlined text-4xl text-primary">waves</span>
        </div>
        <h1 class="text-3xl font-headline font-bold text-primary">声域友</h1>
        <p class="text-sm text-on-surface-variant uppercase tracking-widest mt-2 font-label">注册账号</p>
      </div>

      <!-- Register method tabs -->
      <div class="flex gap-2 mb-6">
        <button
          v-for="m in [
            { key: 'username', label: '用户名' },
            { key: 'phone', label: '手机号' },
            { key: 'email', label: '邮箱' },
          ]"
          :key="m.key"
          @click="registerMethod = m.key as any"
          class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
          :class="registerMethod === m.key
            ? 'bg-primary text-on-primary'
            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'"
        >
          {{ m.label }}
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleRegister" class="space-y-4">
        <!-- Username / Phone / Email input -->
        <div class="relative" v-if="registerMethod === 'username'">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">person</span>
          <input v-model="username" type="text" placeholder="用户名" class="w-full bg-surface-container-high border-none rounded-lg py-4 pl-12 pr-4 text-base text-on-surface placeholder:text-on-surface-variant font-body focus:ring-2 focus:ring-primary/30 focus:outline-none" />
        </div>
        <div class="relative" v-if="registerMethod === 'phone'">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">phone</span>
          <input v-model="phone" type="tel" placeholder="手机号" class="w-full bg-surface-container-high border-none rounded-lg py-4 pl-12 pr-4 text-base text-on-surface placeholder:text-on-surface-variant font-body focus:ring-2 focus:ring-primary/30 focus:outline-none" />
        </div>
        <div class="relative" v-if="registerMethod === 'email'">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">mail</span>
          <input v-model="email" type="email" placeholder="邮箱" class="w-full bg-surface-container-high border-none rounded-lg py-4 pl-12 pr-4 text-base text-on-surface placeholder:text-on-surface-variant font-body focus:ring-2 focus:ring-primary/30 focus:outline-none" />
        </div>

        <!-- Display name -->
        <div class="relative">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">badge</span>
          <input v-model="displayName" type="text" placeholder="昵称" class="w-full bg-surface-container-high border-none rounded-lg py-4 pl-12 pr-4 text-base text-on-surface placeholder:text-on-surface-variant font-body focus:ring-2 focus:ring-primary/30 focus:outline-none" />
        </div>

        <!-- Password -->
        <div class="relative">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">lock</span>
          <input v-model="password" type="password" placeholder="密码" class="w-full bg-surface-container-high border-none rounded-lg py-4 pl-12 pr-4 text-base text-on-surface placeholder:text-on-surface-variant font-body focus:ring-2 focus:ring-primary/30 focus:outline-none" />
        </div>

        <!-- Confirm password -->
        <div class="relative">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">lock_reset</span>
          <input v-model="confirmPassword" type="password" placeholder="确认密码" class="w-full bg-surface-container-high border-none rounded-lg py-4 pl-12 pr-4 text-base text-on-surface placeholder:text-on-surface-variant font-body focus:ring-2 focus:ring-primary/30 focus:outline-none" />
        </div>

        <!-- Error message -->
        <p v-if="errorMsg" class="text-error text-sm font-medium">{{ errorMsg }}</p>

        <!-- Register button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-gradient-to-r from-primary to-secondary text-on-primary rounded-full py-4 font-bold font-label text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-150 hover:shadow-ambient-primary disabled:opacity-60"
        >
          <template v-if="loading">
            <span class="material-symbols-outlined animate-spin">progress_activity</span>
          </template>
          <template v-else>
            注册
            <span class="material-symbols-outlined">arrow_forward</span>
          </template>
        </button>
      </form>

      <!-- Login link -->
      <p class="text-center text-sm text-on-surface-variant mt-6">
        已有账号？
        <router-link to="/login" class="text-primary font-medium hover:underline">去登录</router-link>
      </p>
    </div>
  </div>
</template>

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
</style>
