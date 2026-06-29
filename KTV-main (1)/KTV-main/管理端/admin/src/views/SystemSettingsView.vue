<template>
  <div class="p-8 max-w-5xl mx-auto w-full">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-extrabold font-headline text-on-surface tracking-tight">系统设置</h1>
        <p class="text-outline mt-2 text-sm">配置平台基础信息与安全偏好。</p>
      </div>
      <button
        class="bg-primary text-on-primary px-6 py-3 rounded-full flex items-center gap-2 hover:bg-secondary transition-colors press-scale shadow-lg shadow-primary/20"
        @click="handleSave"
      >
        <span class="material-symbols-outlined">save</span>
        <span class="font-semibold">保存设置</span>
      </button>
    </div>

    <div class="space-y-8 pb-20">
      <!-- Section 1: Admin Account -->
      <section class="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-surface-variant">
          <span class="material-symbols-outlined text-primary">admin_panel_settings</span>
          <h2 class="text-xl font-bold font-headline text-on-surface">管理员账号</h2>
        </div>
        <div class="space-y-6">
          <div class="flex items-center justify-between p-4 bg-surface rounded-lg">
            <div>
              <h3 class="font-semibold text-on-surface">管理员用户名</h3>
              <p class="text-sm text-outline mt-1">{{ adminUsername || '加载中...' }}</p>
            </div>
            <button @click="openChangeUsernameDialog" class="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
              修改用户名
            </button>
          </div>
          <div class="flex items-center justify-between p-4 bg-surface rounded-lg">
            <div>
              <h3 class="font-semibold text-on-surface">管理员密码</h3>
              <p class="text-sm text-outline mt-1">定期更新密码以保证系统安全</p>
            </div>
            <button @click="openChangePasswordDialog" class="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
              修改密码
            </button>
          </div>
        </div>
      </section>

      <!-- Section 2: Basic Info -->
      <section class="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-surface-variant">
          <span class="material-symbols-outlined text-primary">storefront</span>
          <h2 class="text-xl font-bold font-headline text-on-surface">基本信息</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-on-surface-variant">平台名称</label>
            <input
              v-model="settings.platformName"
              class="w-full bg-surface-container-high text-on-surface placeholder-outline border-none rounded-lg focus:ring-2 focus:ring-primary h-12 px-4 transition-all"
              placeholder="声域友"
              type="text"
            />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-on-surface-variant">联系方式</label>
            <input
              v-model="settings.contactInfo"
              class="w-full bg-surface-container-high text-on-surface placeholder-outline border-none rounded-lg focus:ring-2 focus:ring-primary h-12 px-4 transition-all"
              placeholder="联系方式..."
              type="text"
            />
          </div>
        </div>
      </section>

      <!-- Section 3: Security -->
      <section class="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-surface-variant">
          <span class="material-symbols-outlined text-primary">security</span>
          <h2 class="text-xl font-bold font-headline text-on-surface">安全设置</h2>
        </div>
        <div class="space-y-8">
          <div class="space-y-2 max-w-md">
            <label class="block text-sm font-semibold text-on-surface-variant">操作日志保留期限</label>
            <div class="relative">
              <select
                v-model="settings.logRetentionDays"
                class="w-full bg-surface-container-high text-on-surface border-none rounded-lg focus:ring-2 focus:ring-primary h-12 px-4 appearance-none cursor-pointer"
              >
                <option :value="30">30 天</option>
                <option :value="90">90 天</option>
                <option :value="180">180 天</option>
                <option :value="0">永久保留</option>
              </select>
              <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
            </div>
          </div>
          <div class="space-y-3">
            <h3 class="font-semibold text-on-surface">敏感操作二次验证</h3>
            <p class="text-sm text-outline">勾选后对应操作需输入管理员密码二次确认</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <label v-for="item in verificationItems" :key="item.key" class="flex items-center gap-3 p-3 bg-surface rounded-lg cursor-pointer hover:bg-surface-container transition-colors">
                <input type="checkbox" v-model="(settings as any)[item.key]" class="w-4 h-4 rounded text-primary focus:ring-primary/30" />
                <span class="text-sm font-medium text-on-surface">{{ item.label }}</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 4: Operation Logs -->
      <section class="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-surface-variant">
          <span class="material-symbols-outlined text-primary">history</span>
          <h2 class="text-xl font-bold font-headline text-on-surface">操作日志</h2>
        </div>
        <div class="space-y-4">
          <!-- Filters -->
          <div class="flex flex-wrap gap-3 items-center">
            <div class="relative min-w-[160px]">
              <select
                v-model="logFilters.operationType"
                @change="loadLogs(1)"
                class="w-full bg-surface-container-high text-on-surface border-none rounded-lg focus:ring-2 focus:ring-primary h-10 px-4 pr-8 appearance-none cursor-pointer text-sm"
              >
                <option value="">全部类型</option>
                <option value="create">新建</option>
                <option value="update">修改</option>
                <option value="delete">删除</option>
                <option value="disable">禁用用户</option>
                <option value="toggle_status">切换状态</option>
                <option value="balance_adjust">余额调整</option>
                <option value="update_status">房间状态</option>
                <option value="end_session">结束会话</option>
                <option value="change_username">改用户名</option>
                <option value="change_password">改密码</option>
              </select>
              <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-base">expand_more</span>
            </div>
            <input
              v-model="logFilters.username"
              @input="debounceLogSearch"
              placeholder="搜索操作人..."
              class="bg-surface-container-high text-on-surface placeholder-outline border-none rounded-lg focus:ring-2 focus:ring-primary h-10 px-4 text-sm w-40"
            />
            <input
              v-model="logFilters.fromDate"
              @change="loadLogs(1)"
              type="date"
              class="bg-surface-container-high text-on-surface border-none rounded-lg focus:ring-2 focus:ring-primary h-10 px-3 text-sm"
            />
            <span class="text-outline text-sm">至</span>
            <input
              v-model="logFilters.toDate"
              @change="loadLogs(1)"
              type="date"
              class="bg-surface-container-high text-on-surface border-none rounded-lg focus:ring-2 focus:ring-primary h-10 px-3 text-sm"
            />
          </div>

          <!-- Log table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-on-surface-variant border-b border-surface-variant">
                  <th class="py-3 px-2 font-medium">时间</th>
                  <th class="py-3 px-2 font-medium">操作人</th>
                  <th class="py-3 px-2 font-medium">操作类型</th>
                  <th class="py-3 px-2 font-medium">操作对象</th>
                  <th class="py-3 px-2 font-medium">详情</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="logsLoading">
                  <td colspan="5" class="py-8 text-center text-outline">加载中...</td>
                </tr>
                <tr v-else-if="logs.length === 0">
                  <td colspan="5" class="py-8 text-center text-outline">暂无操作记录</td>
                </tr>
                <tr v-for="log in logs" :key="log.id" class="border-b border-surface-variant/50 hover:bg-surface-container-lowest/50 transition-colors">
                  <td class="py-3 px-2 whitespace-nowrap text-on-surface-variant">{{ formatDate(log.createdAt) }}</td>
                  <td class="py-3 px-2 font-medium text-on-surface">{{ log.username }}</td>
                  <td class="py-3 px-2">
                    <span class="px-2 py-1 rounded-full text-xs font-medium" :class="getLogTypeClass(log.operationType)">
                      {{ getLogTypeLabel(log.operationType) }}
                    </span>
                  </td>
                  <td class="py-3 px-2 text-on-surface-variant">{{ getObjectTypeLabel(log.objectType) }} {{ log.objectId ? '#' + log.objectId : '' }}</td>
                  <td class="py-3 px-2 text-on-surface-variant max-w-[200px] truncate" :title="log.details || ''">{{ log.details || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="logTotal > logPageSize" class="flex items-center justify-between pt-2">
            <span class="text-xs text-outline">共 {{ logTotal }} 条记录</span>
            <div class="flex items-center gap-1">
              <button
                @click="loadLogs(logPage - 1)"
                :disabled="logPage <= 1"
                class="px-3 py-1.5 rounded-lg text-sm bg-surface-container-high text-on-surface disabled:opacity-30 hover:bg-surface-container-highest transition-colors"
              >
                上一页
              </button>
              <span class="text-sm text-on-surface-variant px-2">{{ logPage }} / {{ Math.ceil(logTotal / logPageSize) }}</span>
              <button
                @click="loadLogs(logPage + 1)"
                :disabled="logPage >= Math.ceil(logTotal / logPageSize)"
                class="px-3 py-1.5 rounded-lg text-sm bg-surface-container-high text-on-surface disabled:opacity-30 hover:bg-surface-container-highest transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Change Admin Username Dialog -->
    <div v-if="showUsernameDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showUsernameDialog = false">
      <div class="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg p-8 space-y-6">
        <h3 class="text-xl font-display font-bold text-on-surface">修改管理员用户名</h3>
        <form @submit.prevent="handleChangeUsername" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">新用户名</label>
            <input v-model="adminForm.newUsername" required class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">当前密码（验证身份）</label>
            <input v-model="adminForm.password" type="password" required class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
          <p v-if="adminFormError" class="text-xs text-error font-semibold">{{ adminFormError }}</p>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showUsernameDialog = false" class="px-6 py-3 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container transition-colors">取消</button>
            <button type="submit" :disabled="adminSaving" class="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
              {{ adminSaving ? '修改中...' : '确认修改' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Change Admin Password Dialog -->
    <div v-if="showPasswordDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showPasswordDialog = false">
      <div class="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg p-8 space-y-6">
        <h3 class="text-xl font-display font-bold text-on-surface">修改管理员密码</h3>
        <form @submit.prevent="handleChangePassword" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">当前密码</label>
            <input v-model="passwordForm.currentPassword" type="password" required class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">新密码</label>
            <input v-model="passwordForm.newPassword" type="password" required class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">确认新密码</label>
            <input v-model="passwordForm.confirmPassword" type="password" required class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
          <p v-if="adminFormError" class="text-xs text-error font-semibold">{{ adminFormError }}</p>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showPasswordDialog = false" class="px-6 py-3 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container transition-colors">取消</button>
            <button type="submit" :disabled="adminSaving" class="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
              {{ adminSaving ? '修改中...' : '确认修改' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Verification Dialog -->
    <div v-if="showVerifyDialog" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" @click.self="showVerifyDialog = false">
      <div class="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm p-8 space-y-4">
        <h3 class="text-lg font-display font-bold text-on-surface">二次验证</h3>
        <p class="text-sm text-on-surface-variant">请输入管理员密码确认操作</p>
        <form @submit.prevent="submitVerify" class="space-y-4">
          <input v-model="verifyInput" type="password" required autofocus placeholder="输入密码" class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
          <p v-if="verifyError" class="text-xs text-error font-semibold">{{ verifyError }}</p>
          <div class="flex justify-end gap-3">
            <button type="button" @click="showVerifyDialog = false" class="px-6 py-3 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container transition-colors">取消</button>
            <button type="submit" class="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-colors">确认</button>
          </div>
        </form>
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

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { settingsApi, operationLogsApi, authApi } from '@/api'
import type { SystemSettings, OperationLog } from '@/types'
import { useToast } from '@/composables/useToast'

// Toast
const { toastMsg, showToast } = useToast()

const settings = ref<SystemSettings>({
  platformName: '',
  contactInfo: '',
  logRetentionDays: 30,
  sensitiveOpVerification: false,
  verifyDisableUser: true,
  verifyCloseRoom: true,
  verifyModifySettings: true,
  verifyModifyAdmin: true,
})

// Admin account
const adminUsername = ref('')
const showUsernameDialog = ref(false)
const showPasswordDialog = ref(false)
const adminSaving = ref(false)
const adminFormError = ref('')
const adminForm = ref({ newUsername: '', password: '' })
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })

// Verification items config
const verificationItems = [
  { key: 'verifyDisableUser', label: '禁用/启用用户' },
  { key: 'verifyCloseRoom', label: '关闭房间' },
  { key: 'verifyModifySettings', label: '修改系统设置' },
  { key: 'verifyModifyAdmin', label: '修改管理员账号' },
]

// Operation Logs
const logs = ref<OperationLog[]>([])
const logsLoading = ref(false)
const logPage = ref(1)
const logTotal = ref(0)
const logPageSize = 20
const logFilters = ref({ operationType: '', username: '', fromDate: '', toDate: '' })
let logSearchTimer: ReturnType<typeof setTimeout> | null = null

// Password verification dialog
const showVerifyDialog = ref(false)
const verifyInput = ref('')
const verifyError = ref('')
const verifyCallback = ref<(() => Promise<void>) | null>(null)

// --- Admin Account ---
async function fetchAdminAccount() {
  try {
    const res = await settingsApi.getAdminAccount()
    adminUsername.value = res.data.username
  } catch {
    adminUsername.value = '加载失败'
  }
}

function openChangeUsernameDialog() {
  adminForm.value = { newUsername: adminUsername.value, password: '' }
  adminFormError.value = ''
  showUsernameDialog.value = true
}

function openChangePasswordDialog() {
  passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  adminFormError.value = ''
  showPasswordDialog.value = true
}

// --- Operation Logs ---
async function loadLogs(page = 1) {
  logsLoading.value = true
  logPage.value = page
  try {
    const params: any = { page, pageSize: logPageSize }
    if (logFilters.value.operationType) params.operationType = logFilters.value.operationType
    if (logFilters.value.username) params.username = logFilters.value.username
    if (logFilters.value.fromDate) params.fromDate = logFilters.value.fromDate
    if (logFilters.value.toDate) params.toDate = logFilters.value.toDate
    const res = await operationLogsApi.getList(params)
    logs.value = res.data.items
    logTotal.value = res.data.total
  } catch { /* ignore */ }
  logsLoading.value = false
}

function debounceLogSearch() {
  if (logSearchTimer) clearTimeout(logSearchTimer)
  logSearchTimer = setTimeout(() => loadLogs(1), 300)
}

function getLogTypeLabel(type: string) {
  const map: Record<string, string> = {
    create: '新建', update: '修改', delete: '删除',
    disable: '禁用用户', toggle_status: '切换状态',
    balance_adjust: '余额调整', update_status: '房间状态',
    end_session: '结束会话', change_username: '改用户名',
    change_password: '改密码',
  }
  return map[type] || type
}

function getLogTypeClass(type: string) {
  if (['delete', 'disable'].includes(type)) return 'bg-error/10 text-error'
  if (['balance_adjust', 'change_password', 'change_username'].includes(type)) return 'bg-warning/10 text-warning'
  if (['create', 'toggle_status'].includes(type)) return 'bg-primary/10 text-primary'
  if (type === 'update') return 'bg-outline/10 text-outline'
  return 'bg-surface-container-high text-on-surface-variant'
}

function getObjectTypeLabel(objType: string) {
  const map: Record<string, string> = {
    user: '用户', song: '歌曲', room: '房间',
    settings: '系统设置', admin: '管理员',
  }
  return map[objType] || objType
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// --- Save & Init ---
async function handleSave() {
  const doSave = async () => {
    const payload: Record<string, any> = {
      platform_name: settings.value.platformName,
      contact_info: settings.value.contactInfo,
      log_retention_days: String(settings.value.logRetentionDays),
      verify_disable_user: String(settings.value.verifyDisableUser),
      verify_close_room: String(settings.value.verifyCloseRoom),
      verify_modify_settings: String(settings.value.verifyModifySettings),
      verify_modify_admin: String(settings.value.verifyModifyAdmin),
    }
    try {
      await settingsApi.update(payload)
      showToast('设置已保存')
    } catch (err: any) {
      showToast(err?.response?.data?.message || '保存失败，请重试')
    }
  }
  // Verify if modify_settings is enabled
  if (settings.value.verifyModifySettings) {
    openVerifyDialog(doSave)
  } else {
    await doSave()
  }
}

async function handleChangeUsername() {
  const doChange = async () => {
    adminFormError.value = ''
    adminSaving.value = true
    try {
      await settingsApi.updateAdminUsername(adminForm.value)
      showUsernameDialog.value = false
      showToast('用户名已修改')
      await fetchAdminAccount()
    } catch (err: any) {
      adminFormError.value = err.response?.data?.message || err.response?.data || '修改失败'
    } finally {
      adminSaving.value = false
    }
  }
  if (!adminForm.value.newUsername || !adminForm.value.password) {
    adminFormError.value = '请填写所有字段'
    return
  }
  showUsernameDialog.value = false
  openVerifyDialog(doChange)
}

async function handleChangePassword() {
  const doChange = async () => {
    adminFormError.value = ''
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
      adminFormError.value = '两次输入的密码不一致'
      return
    }
    adminSaving.value = true
    try {
      await settingsApi.updateAdminPassword(passwordForm.value)
      showPasswordDialog.value = false
      showToast('密码已修改')
    } catch (err: any) {
      adminFormError.value = err.response?.data?.message || err.response?.data || '修改失败'
    } finally {
      adminSaving.value = false
    }
  }
  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
    adminFormError.value = '请填写所有字段'
    return
  }
  showPasswordDialog.value = false
  openVerifyDialog(doChange)
}

function openVerifyDialog(callback: () => Promise<void>) {
  verifyInput.value = ''
  verifyError.value = ''
  verifyCallback.value = callback
  showVerifyDialog.value = true
}

async function submitVerify() {
  verifyError.value = ''
  try {
    await authApi.verifyPassword(verifyInput.value)
  } catch {
    verifyError.value = '密码错误'
    return
  }
  showVerifyDialog.value = false
  if (verifyCallback.value) await verifyCallback.value()
}

onMounted(async () => {
  try {
    const res = await settingsApi.get()
    const data = res.data as any
    settings.value.platformName = data.platformName || data.platform_name || ''
    settings.value.contactInfo = data.contactInfo || data.contact_info || ''
    settings.value.logRetentionDays = Number(data.logRetentionDays || data.log_retention_days || 30)
    settings.value.verifyDisableUser = (data.verifyDisableUser ?? data.verify_disable_user ?? 'true') === 'true'
    settings.value.verifyCloseRoom = (data.verifyCloseRoom ?? data.verify_close_room ?? 'true') === 'true'
    settings.value.verifyModifySettings = (data.verifyModifySettings ?? data.verify_modify_settings ?? 'true') === 'true'
    settings.value.verifyModifyAdmin = (data.verifyModifyAdmin ?? data.verify_modify_admin ?? 'true') === 'true'
  } catch (err) {
    console.error('[Settings] Failed to load:', err)
  }
  await fetchAdminAccount()
  await loadLogs()
  pollTimer = setInterval(() => loadLogs(logPage.value), 3000)
})

let pollTimer: ReturnType<typeof setInterval> | null = null

onUnmounted(() => {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
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
</style>
