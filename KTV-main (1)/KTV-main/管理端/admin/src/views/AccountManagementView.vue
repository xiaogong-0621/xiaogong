<template>
  <div class="p-8 flex flex-col gap-8">
    <!-- Page Header -->
    <div class="flex items-end justify-between">
      <div>
        <h1 class="font-display text-4xl font-extrabold text-on-surface tracking-tight">账户管理</h1>
        <p class="text-on-surface-variant mt-2 font-body">管理用户账户及访问状态。</p>
      </div>
      <button @click="openAddDialog" class="bg-primary text-on-primary px-6 py-3 rounded-full font-headline font-semibold flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity press-scale">
        <span class="material-symbols-outlined text-xl">add</span>
        新增账户
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="bg-surface-container rounded-lg p-4 flex flex-wrap gap-4 items-center shadow-sm ring-1 ring-outline-variant/15">
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
        <input
          v-model="searchQuery"
          @input="onSearch"
          class="w-full bg-surface-container-lowest border-none rounded-lg py-3 pl-12 pr-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/50 transition-shadow font-body text-sm outline-none"
          placeholder="搜索用户名..."
          type="text"
        />
      </div>
      <div class="relative min-w-[160px]">
        <select
          v-model="selectedStatus"
          class="w-full bg-surface-container-lowest border-none rounded-lg py-3 pl-4 pr-10 text-on-surface focus:ring-2 focus:ring-primary/50 transition-shadow font-body text-sm appearance-none outline-none"
        >
          <option value="">全部状态</option>
          <option value="active">启用</option>
          <option value="disabled">禁用</option>
        </select>
        <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">arrow_drop_down</span>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-surface-container-lowest rounded-xl shadow-sm ring-1 ring-outline-variant/15">
      <div class="overflow-x-auto">
        <table class="w-full text-left font-body text-sm">
          <thead class="bg-surface-container-low text-on-surface-variant font-headline uppercase tracking-wider text-xs border-b border-surface-container-highest">
            <tr>
              <th class="py-4 px-6 font-semibold">用户名（含头像）</th>
              <th class="py-4 px-6 font-semibold">状态</th>
              <th class="py-4 px-6 font-semibold">在线</th>
              <th class="py-4 px-6 font-semibold">所在房间</th>
              <th class="py-4 px-6 font-semibold">创建时间</th>
              <th class="py-4 px-6 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-container-highest">
            <tr
              v-for="user in accounts"
              :key="user.id"
              class="hover:bg-surface-container transition-colors group"
            >
              <td class="py-4 px-6" :class="user.status === 'disabled' ? 'opacity-60' : ''">
                <div class="flex items-center gap-3">
                  <img
                    v-if="user.avatarUrl"
                    :src="BACKEND_BASE + user.avatarUrl"
                    class="w-8 h-8 rounded-full object-cover shrink-0 cursor-pointer transition-transform duration-200 hover:scale-[2.5] hover:shadow-lg"
                    :alt="user.username"
                    @error="($event.target as HTMLImageElement).src = BACKEND_BASE + DEFAULT_AVATAR"
                  />
                  <div
                    v-else
                    class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0"
                    :class="user.status === 'active'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-surface-variant text-on-surface-variant'"
                  >{{ user.username.charAt(0).toUpperCase() }}</div>
                  <span class="font-medium text-on-surface">{{ user.username }}</span>
                </div>
              </td>
              <td class="py-4 px-6">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="user.status === 'active'
                    ? 'bg-secondary-container/20 text-secondary-container'
                    : 'bg-surface-variant text-on-surface-variant'"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="user.status === 'active' ? 'bg-secondary-container' : 'bg-outline'"
                  ></span>
                  {{ formatUserStatus(user.status) }}
                </span>
              </td>
              <td class="py-4 px-6">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="user.isOnline
                    ? 'bg-primary/10 text-primary'
                    : 'bg-surface-variant text-on-surface-variant'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="user.isOnline ? 'bg-primary' : 'bg-outline'"></span>
                  {{ user.isOnline ? '在线' : '离线' }}
                </span>
              </td>
              <td class="py-4 px-6">
                <span v-if="user.roomCode" class="font-mono font-semibold text-sm text-primary">{{ user.roomCode }}</span>
                <span v-else class="text-on-surface-variant/50 text-sm">--</span>
              </td>
              <td class="py-4 px-6 text-on-surface-variant">{{ formatDate(user.createdAt) }}</td>
              <td class="py-4 px-6 text-right">
                <div class="relative inline-block">
                  <button
                    @click.stop="toggleMenu(user.id)"
                    class="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
                    title="操作"
                  >
                    <span class="material-symbols-outlined text-xl">more_vert</span>
                  </button>
                  <Transition name="menu-fade">
                    <div
                      v-if="openMenuId === user.id"
                      class="absolute right-0 top-full mt-1 w-40 bg-surface-container-lowest rounded-lg shadow-xl ring-1 ring-outline-variant/20 z-[100] overflow-hidden"
                    >
                      <button
                        @click="openEditDialog(user)"
                        class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors"
                      >
                        <span class="material-symbols-outlined text-lg text-on-surface-variant">edit</span>
                        编辑
                      </button>
                      <button
                        @click="openPasswordDialog(user)"
                        class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors"
                      >
                        <span class="material-symbols-outlined text-lg text-on-surface-variant">lock_reset</span>
                        更改密码
                      </button>
                      <button
                        @click="handleToggleStatus(user.id)"
                        class="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-container transition-colors"
                        :class="user.status === 'active' ? 'text-error' : 'text-secondary-container'"
                      >
                        <span class="material-symbols-outlined text-lg">
                          {{ user.status === 'active' ? 'block' : 'check_circle' }}
                        </span>
                        {{ user.status === 'active' ? '禁用' : '启用' }}
                      </button>
                      <button
                        @click="handleDelete(user)"
                        class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                      >
                        <span class="material-symbols-outlined text-lg">delete</span>
                        删除用户
                      </button>
                    </div>
                  </Transition>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="accounts.length === 0" class="py-16 text-center text-on-surface-variant">
        <span class="material-symbols-outlined text-4xl text-outline-variant">manage_accounts</span>
        <p class="mt-2">暂无账户数据</p>
      </div>

      <!-- Pagination -->
      <div class="bg-surface-container-lowest px-6 py-4 border-t border-surface-container-highest flex items-center justify-between">
        <div class="text-sm text-on-surface-variant font-body">
          显示第 <span class="font-medium text-on-surface">{{ (currentPage - 1) * pageSize + 1 }}</span>
          到 <span class="font-medium text-on-surface">{{ Math.min(currentPage * pageSize, total) }}</span>
          条，共 <span class="font-medium text-on-surface">{{ total }}</span> 条结果
        </div>
        <div class="flex items-center gap-1">
          <button
            class="p-2 rounded-lg text-outline hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            v-for="page in Math.min(totalPages, 3)"
            :key="page"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
            :class="page === currentPage
              ? 'bg-primary text-on-primary'
              : 'text-on-surface hover:bg-surface-container'"
            @click="currentPage = page"
          >{{ page }}</button>
          <span v-if="totalPages > 4" class="px-2 text-outline">...</span>
          <button
            v-if="totalPages > 3"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
            @click="currentPage = totalPages"
          >{{ totalPages }}</button>
          <button
            class="p-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Add Account Dialog -->
    <div v-if="showAddDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showAddDialog = false">
      <div class="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg p-8 space-y-6">
        <h3 class="text-xl font-display font-bold text-on-surface">新增账户</h3>
        <form @submit.prevent="handleAdd" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">用户名</label>
            <input v-model="addForm.username" required class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">密码</label>
            <input v-model="addForm.password" type="password" required class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">显示名称</label>
            <input v-model="addForm.displayName" required class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">手机号</label>
            <input v-model="addForm.phone" class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
          <!-- Avatar Upload -->
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">头像（可选）</label>
            <div class="flex items-center gap-3">
              <div v-if="addAvatarPreview" class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                <img :src="addAvatarPreview" class="w-full h-full object-cover" />
              </div>
              <label class="flex-1 flex items-center gap-3 px-4 py-3 bg-surface-container-high rounded-lg cursor-pointer hover:bg-surface-container-highest transition-colors">
                <span class="material-symbols-outlined text-on-surface-variant">image</span>
                <span class="text-sm text-on-surface-variant truncate">
                  {{ addAvatarFile ? addAvatarFile.name : '选择头像图片（JPG/PNG/WebP，最大 2MB）' }}
                </span>
                <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp" class="hidden" @change="onAddAvatarSelected" />
              </label>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showAddDialog = false" class="px-6 py-3 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container transition-colors">取消</button>
            <button type="submit" :disabled="saving" class="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
              {{ saving ? '创建中...' : '创建' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Account Dialog -->
    <div v-if="showEditDialog && editingUser" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showEditDialog = false">
      <div class="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg p-8 space-y-6">
        <h3 class="text-xl font-display font-bold text-on-surface">编辑账户</h3>
        <form @submit.prevent="handleEdit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">用户名</label>
            <div class="w-full px-4 py-3 bg-surface-container-highest rounded-lg text-on-surface-variant">{{ editingUser.username }}</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">显示名称</label>
            <input v-model="editForm.displayName" class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">手机号</label>
            <input v-model="editForm.phone" class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
          <!-- Avatar Upload -->
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">头像</label>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-surface-container-high">
                <img :src="editAvatarPreview || (editingUser.avatarUrl ? BACKEND_BASE + editingUser.avatarUrl : BACKEND_BASE + DEFAULT_AVATAR)" class="w-full h-full object-cover" />
              </div>
              <label class="flex-1 flex items-center gap-3 px-4 py-3 bg-surface-container-high rounded-lg cursor-pointer hover:bg-surface-container-highest transition-colors">
                <span class="material-symbols-outlined text-on-surface-variant">image</span>
                <span class="text-sm text-on-surface-variant truncate">
                  {{ editAvatarFile ? editAvatarFile.name : '更换头像（JPG/PNG/WebP，最大 2MB）' }}
                </span>
                <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp" class="hidden" @change="onEditAvatarSelected" />
              </label>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showEditDialog = false" class="px-6 py-3 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container transition-colors">取消</button>
            <button type="submit" :disabled="saving" class="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Change Password Dialog -->
    <div v-if="showPasswordDialog && passwordUser" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showPasswordDialog = false">
      <div class="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg p-8 space-y-6">
        <h3 class="text-xl font-display font-bold text-on-surface">更改密码</h3>
        <p class="text-sm text-on-surface-variant">为用户 <span class="font-medium text-on-surface">{{ passwordUser.username }}</span> 设置新密码</p>
        <form @submit.prevent="handlePasswordChange" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">新密码</label>
            <input v-model="passwordForm.newPassword" type="password" required class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">确认密码</label>
            <input v-model="passwordForm.confirmPassword" type="password" required class="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showPasswordDialog = false" class="px-6 py-3 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container transition-colors">取消</button>
            <button type="submit" :disabled="saving" class="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
              {{ saving ? '修改中...' : '确认修改' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Avatar Cropper Dialog -->
    <div v-if="showCropper && cropperSource" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
      <div class="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 class="text-lg font-display font-bold text-on-surface">裁剪头像</h3>
        <div class="w-full aspect-square rounded-lg overflow-hidden bg-surface-container-high">
          <Cropper
            ref="cropperRef"
            :src="cropperSource"
            :stencil-props="{ aspectRatio: 1, handlers: {}, movable: true, resizable: true }"
            :canvas="{ width: 256, height: 256 }"
            class="h-full"
          />
        </div>
        <div class="flex justify-end gap-3">
          <button @click="onCropperCancel" class="px-6 py-3 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container transition-colors">取消</button>
          <button @click="onCropperConfirm" class="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-colors">确认</button>
        </div>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { accountsApi, uploadApi } from '@/api'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import type { User } from '@/types'
import { formatUserStatus } from '@/utils/format'
import { useToast } from '@/composables/useToast'

const BACKEND_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'https://localhost:5001'
const DEFAULT_AVATAR = '/uploads/avatars/default.jpg'

const accounts = ref<User[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const selectedStatus = ref('')
const saving = ref(false)
const openMenuId = ref<number | null>(null)
let searchTimer: ReturnType<typeof setTimeout>

// Add dialog
const showAddDialog = ref(false)
const addForm = ref({ username: '', password: '', displayName: '', phone: '' })
const addAvatarFile = ref<File | null>(null)
const addAvatarPreview = ref<string | null>(null)

// Edit dialog
const showEditDialog = ref(false)
const editingUser = ref<User | null>(null)
const editForm = ref({ displayName: '', phone: '' })
const editAvatarFile = ref<File | null>(null)
const editAvatarPreview = ref<string | null>(null)

// Avatar cropper
const showCropper = ref(false)
const cropperSource = ref<string | null>(null)
const cropperTarget = ref<'add' | 'edit'>('add')
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null)

// Password dialog
const showPasswordDialog = ref(false)
const passwordUser = ref<User | null>(null)
const passwordForm = ref({ newPassword: '', confirmPassword: '' })

// Toast
const { toastMsg, showToast } = useToast()

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchAccounts()
  }, 300)
}

async function fetchAccounts() {
  const res = await accountsApi.getList({
    search: searchQuery.value || undefined,
    status: selectedStatus.value || undefined,
    page: currentPage.value,
    pageSize: pageSize.value,
  })
  accounts.value = res.data.items
  total.value = res.data.total
}

async function handleToggleStatus(id: number) {
  const user = accounts.value.find(u => u.id === id)
  if (!user) return

  const action = user.status === 'active' ? '禁用' : '启用'
  if (!confirm(`确认${action}该用户？`)) { closeMenu(); return }
  closeMenu()

  try {
    if (user.status === 'active') {
      await accountsApi.disable(id)
    } else {
      await accountsApi.toggleStatus(id)
    }
    await fetchAccounts()
  } catch (err: any) {
    showToast(err.response?.data?.message || '操作失败')
  }
}

function toggleMenu(id: number) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function closeMenu() {
  openMenuId.value = null
}

function onClickOutside(e: MouseEvent) {
  if (openMenuId.value !== null) {
    const target = e.target as HTMLElement
    if (!target.closest('.relative.inline-block')) {
      closeMenu()
    }
  }
}

async function handleDelete(user: User) {
  if (!confirm(`确认删除用户"${user.username}"？该操作不可恢复。`)) { closeMenu(); return }
  closeMenu()

  try {
    await accountsApi.delete(user.id)
    await fetchAccounts()
  } catch (err: any) {
    showToast(err.response?.data?.message || '删除失败')
  }
}

function openAddDialog() {
  addForm.value = { username: '', password: '', displayName: '', phone: '' }
  addAvatarFile.value = null
  addAvatarPreview.value = null
  showAddDialog.value = true
}

function onAddAvatarSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  cropperSource.value = URL.createObjectURL(file)
  cropperTarget.value = 'add'
  showCropper.value = true
  ;(e.target as HTMLInputElement).value = ''
}

async function handleAdd() {
  saving.value = true
  try {
    let avatarUrl: string | undefined
    if (addAvatarFile.value) {
      const res = await uploadApi.avatar(addAvatarFile.value)
      avatarUrl = res.data.url
    }
    await accountsApi.create({ ...addForm.value, avatarUrl })
    showAddDialog.value = false
    await fetchAccounts()
  } catch (err: any) {
    showToast(err.response?.data?.message || '创建失败，用户名可能已存在')
  } finally {
    saving.value = false
  }
}

function openEditDialog(user: User) {
  editingUser.value = user
  editForm.value = { displayName: user.displayName || '', phone: '' }
  editAvatarFile.value = null
  editAvatarPreview.value = null
  showEditDialog.value = true
}

function onEditAvatarSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  cropperSource.value = URL.createObjectURL(file)
  cropperTarget.value = 'edit'
  showCropper.value = true
  ;(e.target as HTMLInputElement).value = ''
}

function onCropperConfirm() {
  if (!cropperRef.value) return
  const { canvas } = cropperRef.value.getResult()
  if (!canvas) return
  canvas.toBlob((blob: Blob | null) => {
    if (!blob) return
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    const url = URL.createObjectURL(blob)
    if (cropperTarget.value === 'add') {
      addAvatarFile.value = file
      addAvatarPreview.value = url
    } else {
      editAvatarFile.value = file
      editAvatarPreview.value = url
    }
    showCropper.value = false
    cropperSource.value = null
  }, 'image/jpeg', 0.9)
}

function onCropperCancel() {
  showCropper.value = false
  cropperSource.value = null
}

function openPasswordDialog(user: User) {
  passwordUser.value = user
  passwordForm.value = { newPassword: '', confirmPassword: '' }
  showPasswordDialog.value = true
  closeMenu()
}

async function handlePasswordChange() {
  if (!passwordUser.value) return
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showToast('两次输入的密码不一致')
    return
  }
  if (passwordForm.value.newPassword.length < 3) {
    showToast('密码长度不能少于 3 位')
    return
  }
  saving.value = true
  try {
    await accountsApi.changePassword(passwordUser.value.id, passwordForm.value.newPassword)
    showPasswordDialog.value = false
  } catch (err: any) {
    showToast(err.response?.data?.message || '修改失败')
  } finally {
    saving.value = false
  }
}

async function handleEdit() {
  if (!editingUser.value) return
  saving.value = true
  try {
    const updateData: Record<string, any> = { ...editForm.value }
    if (editAvatarFile.value) {
      const res = await uploadApi.avatar(editAvatarFile.value)
      updateData.avatarUrl = res.data.url
    }
    await accountsApi.update(editingUser.value.id, updateData)
    showEditDialog.value = false
    await fetchAccounts()
  } finally {
    saving.value = false
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await fetchAccounts()
  pollTimer = setInterval(fetchAccounts, 3000)
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  document.removeEventListener('click', onClickOutside)
})

watch([currentPage, selectedStatus], () => {
  fetchAccounts()
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
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
