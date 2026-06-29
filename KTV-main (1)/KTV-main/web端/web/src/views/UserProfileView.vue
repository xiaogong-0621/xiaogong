<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { profileApi } from '@/api'
import type { UserProfile, RecentSong } from '@/types'
import { ElMessage } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'https://localhost:5001'

const profile = ref<UserProfile | null>(null)
const recentSongs = ref<RecentSong[]>([])

// Dark mode
const isDark = ref(false)
onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  if (isDark.value) document.documentElement.classList.add('dark')
})
function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const showEditDialog = ref(false)
const editForm = ref({ displayName: '', phone: '', email: '' })
const editLoading = ref(false)

const showPasswordDialog = ref(false)
const passwordForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const passwordLoading = ref(false)

async function loadProfile() {
  const { data } = await profileApi.getProfile()
  profile.value = data
}

async function loadRecentSongs() {
  const { data } = await profileApi.getRecentSongs(5)
  recentSongs.value = data
}

function openEditDialog() {
  if (!profile.value) return
  editForm.value = {
    displayName: profile.value.displayName,
    phone: profile.value.phone || '',
    email: profile.value.email || '',
  }
  showEditDialog.value = true
}

async function handleUpdateProfile() {
  if (!editForm.value.displayName.trim()) {
    ElMessage.warning('昵称不能为空')
    return
  }
  editLoading.value = true
  try {
    await profileApi.updateProfile(editForm.value)
    ElMessage.success('资料已更新')
    showEditDialog.value = false
    await loadProfile()
    if (profile.value) {
      auth.updateUser({ displayName: profile.value.displayName, phone: profile.value.phone, email: profile.value.email })
    }
  } catch {
    ElMessage.error('更新失败')
  } finally {
    editLoading.value = false
  }
}

function openPasswordDialog() {
  passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  showPasswordDialog.value = true
}

async function handleChangePassword() {
  if (!passwordForm.value.oldPassword) { ElMessage.warning('请输入原密码'); return }
  if (!passwordForm.value.newPassword) { ElMessage.warning('请输入新密码'); return }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致'); return
  }
  passwordLoading.value = true
  try {
    await profileApi.changePassword(passwordForm.value.oldPassword, passwordForm.value.newPassword)
    ElMessage.success('密码已修改')
    showPasswordDialog.value = false
  } catch {
    ElMessage.error('原密码错误')
  } finally { passwordLoading.value = false }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  // 转换为北京时间 (UTC+8)
  const bj = new Date(d.getTime() + (d.getTimezoneOffset() * 60000) + (8 * 3600000))
  const nowBj = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (8 * 3600000))
  const isToday = bj.toDateString() === nowBj.toDateString()
  const yesterday = new Date(nowBj); yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = bj.toDateString() === yesterday.toDateString()
  const hh = bj.getHours().toString().padStart(2, '0')
  const mm = bj.getMinutes().toString().padStart(2, '0')
  const time = `${hh}:${mm}`
  if (isToday) return `今天 ${time}`
  if (isYesterday) return `昨天 ${time}`
  return `${bj.getMonth() + 1}/${bj.getDate()} ${time}`
}

function formatJoinDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月加入`
}

function generateStars() {
  const container = document.getElementById('stars-layer')
  if (!container) return
  container.innerHTML = ''
  for (let i = 0; i < 180; i++) {
    const star = document.createElement('div')
    star.className = 'star'
    star.style.left = Math.random() * 100 + '%'
    star.style.top = Math.random() * 60 + '%'
    star.style.setProperty('--dur', (1.5 + Math.random() * 3) + 's')
    star.style.setProperty('--delay', (Math.random() * 3) + 's')
    star.style.width = (1 + Math.random() * 2) + 'px'
    star.style.height = star.style.width
    star.style.opacity = String(0.1 + Math.random() * 0.5)
    container.appendChild(star)
  }
}

onMounted(() => {
  loadProfile()
  loadRecentSongs()
  nextTick(generateStars)
})
</script>

<template>
  <div class="profile-page">
    <!-- Background blobs -->
    <div class="bg-layer">
      <div class="blob up-blob-1"></div>
      <div class="blob up-blob-2"></div>
      <div class="blob up-blob-3"></div>
      <div class="blob up-blob-4"></div>
      <div class="blob up-blob-5"></div>
      <div class="blob up-blob-6"></div>
      <div class="blob up-blob-7"></div>
      <div class="blob up-blob-8"></div>
    </div>

    <!-- Aurora layer (dark) -->
    <div class="aurora-layer">
      <div class="aurora-streak"></div>
      <div class="aurora-streak"></div>
      <div class="aurora-streak"></div>
    </div>

    <!-- Stars layer (dark) -->
    <div class="stars-layer" id="stars-layer">
      <div class="shooting-star" style="top: 8%; left: 70%; --r: -30deg;"></div>
      <div class="shooting-star" style="top: 25%; left: 40%; --r: -45deg; width: 80px; animation-delay: -2.5s;"></div>
      <div class="shooting-star" style="top: 15%; left: 80%; --r: -20deg; width: 120px; animation-delay: -4s;"></div>
    </div>

    <div class="page-wrapper">
      <!-- Top bar -->
      <div class="top-bar">
        <div class="top-bar-left">
          <button class="back-btn" @click="router.back()">
            <span class="material-symbols-outlined" style="font-size:22px">arrow_back</span>
          </button>
          <span class="top-bar-title">个人主页</span>
        </div>
        <button class="back-btn" @click="toggleDark" :title="isDark ? '切换亮色模式' : '切换深色模式'">
          <span class="material-symbols-outlined" style="font-size:22px">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
        </button>
      </div>

      <!-- Banner -->
      <div class="banner">
        <div class="cloud"></div>
        <div class="cloud"></div>
        <div class="cloud"></div>
        <div class="aurora-shim"></div>
        <div class="banner-star" style="left: 96.0546%; top: 63.9067%; --dur: 2.963442539033127s; --delay: 1.4248120133484776s; opacity: 0.630848;"></div>
        <div class="banner-star" style="left: 55.4666%; top: 65.7401%; --dur: 2.886505604123874s; --delay: 0.8812505943384836s; opacity: 0.789874;"></div>
        <div class="banner-star" style="left: 74.1264%; top: 41.9466%; --dur: 3.0627367144443767s; --delay: 1.917910418937833s; opacity: 0.389375;"></div>
        <div class="banner-star" style="left: 80.7554%; top: 9.90973%; --dur: 2.144272269818682s; --delay: 0.26717073730869023s; opacity: 0.6447;"></div>
        <div class="banner-star" style="left: 60.7996%; top: 47.8944%; --dur: 2.365291342740904s; --delay: 1.4969962118849536s; opacity: 0.672855;"></div>
        <div class="banner-star" style="left: 3.85387%; top: 56.7639%; --dur: 2.9090270905045355s; --delay: 1.0755282603936014s; opacity: 0.538078;"></div>
        <div class="banner-star" style="left: 41.3006%; top: 4.15441%; --dur: 3.145304019046459s; --delay: 1.0612979668003317s; opacity: 0.370535;"></div>
        <div class="banner-star" style="left: 93.8212%; top: 49.3637%; --dur: 1.070881371604004s; --delay: 0.7550775945319981s; opacity: 0.522996;"></div>
        <div class="banner-star" style="left: 25.3148%; top: 23.0374%; --dur: 2.0719558207642628s; --delay: 1.3778398738407593s; opacity: 0.364642;"></div>
        <div class="banner-star" style="left: 24.0226%; top: 53.5583%; --dur: 2.128979019957783s; --delay: 0.03700798419495244s; opacity: 0.334002;"></div>
        <div class="banner-star" style="left: 39.6514%; top: 78.5313%; --dur: 3.0385595631562996s; --delay: 0.46442248858748325s; opacity: 0.381265;"></div>
        <div class="banner-star" style="left: 28.6087%; top: 61.2608%; --dur: 1.2547391868108073s; --delay: 0.8105232546274239s; opacity: 0.594248;"></div>
        <div class="banner-star" style="left: 45.1877%; top: 62.3986%; --dur: 2.0217383816801497s; --delay: 1.6812226094802891s; opacity: 0.615874;"></div>
        <div class="banner-star" style="left: 29.182%; top: 48.5785%; --dur: 2.5153079625271637s; --delay: 0.06171632575173658s; opacity: 0.578584;"></div>
        <div class="banner-star" style="left: 91.9128%; top: 74.8371%; --dur: 1.0454914227900771s; --delay: 1.4688916313445302s; opacity: 0.227032;"></div>
        <div class="banner-star" style="left: 74.389%; top: 20.964%; --dur: 2.2949302792899746s; --delay: 1.051777784671009s; opacity: 0.490516;"></div>
        <div class="banner-star" style="left: 95.2667%; top: 74.4722%; --dur: 1.2195307287417987s; --delay: 0.7676010904528696s; opacity: 0.680332;"></div>
        <div class="banner-star" style="left: 74.2977%; top: 36.1745%; --dur: 3.41211809164304s; --delay: 1.3190254814960132s; opacity: 0.771714;"></div>
        <div class="banner-star" style="left: 18.7969%; top: 77.7477%; --dur: 2.0489500625174553s; --delay: 1.478225421597258s; opacity: 0.79875;"></div>
        <div class="banner-star" style="left: 24.3062%; top: 31.2773%; --dur: 1.2920824382627303s; --delay: 1.9682638068997305s; opacity: 0.250825;"></div>
        <div class="banner-star" style="left: 83.7559%; top: 26.9978%; --dur: 1.6692265806907316s; --delay: 1.1613938571309814s; opacity: 0.387234;"></div>
        <div class="banner-star" style="left: 93.3943%; top: 73.6839%; --dur: 2.834611074672945s; --delay: 0.4217086083637158s; opacity: 0.566302;"></div>
        <div class="banner-star" style="left: 3.56947%; top: 74.0121%; --dur: 3.2766130727031424s; --delay: 1.252188067887661s; opacity: 0.434311;"></div>
        <div class="banner-star" style="left: 70.635%; top: 68.2066%; --dur: 1.965729280236566s; --delay: 1.6464652327486708s; opacity: 0.694519;"></div>
        <div class="banner-star" style="left: 41.9873%; top: 0.325765%; --dur: 2.359008854040852s; --delay: 1.4831785436041705s; opacity: 0.321096;"></div>
        <div class="banner-star" style="left: 40.0673%; top: 36.1038%; --dur: 3.1666286339007965s; --delay: 0.4326459718459761s; opacity: 0.769073;"></div>
        <div class="banner-star" style="left: 98.979%; top: 23.2585%; --dur: 1.6234504018236577s; --delay: 0.8900355133338409s; opacity: 0.754708;"></div>
        <div class="banner-star" style="left: 25.7951%; top: 72.015%; --dur: 2.1595754827313285s; --delay: 1.5761023094334163s; opacity: 0.29844;"></div>
        <div class="banner-star" style="left: 91.3482%; top: 30.4774%; --dur: 2.008488181362272s; --delay: 0.4210302083465802s; opacity: 0.49615;"></div>
        <div class="banner-star" style="left: 81.5778%; top: 46.261%; --dur: 1.3754319492263967s; --delay: 0.10768066707486534s; opacity: 0.55587;"></div>
        <div class="banner-star" style="left: 6.09782%; top: 56.1458%; --dur: 1.691315274724541s; --delay: 0.6515595320037819s; opacity: 0.600961;"></div>
        <div class="banner-star" style="left: 40.8559%; top: 55.0724%; --dur: 3.4522264815125867s; --delay: 0.7294022641607212s; opacity: 0.738535;"></div>
        <div class="banner-star" style="left: 25.2963%; top: 48.8116%; --dur: 2.0035613121770006s; --delay: 0.07896000360057442s; opacity: 0.370189;"></div>
        <div class="banner-star" style="left: 41.2782%; top: 68.557%; --dur: 1.3131340646066303s; --delay: 1.1271459353428621s; opacity: 0.390623;"></div>
        <div class="banner-star" style="left: 46.7674%; top: 54.9912%; --dur: 2.5754988311364104s; --delay: 1.1153527782010868s; opacity: 0.505699;"></div>
        <div class="banner-star" style="left: 49.4837%; top: 70.3529%; --dur: 3.399238837838334s; --delay: 1.5733695844421243s; opacity: 0.482518;"></div>
        <div class="banner-star" style="left: 41.4881%; top: 68.9328%; --dur: 3.4427606808763023s; --delay: 1.4059215684809276s; opacity: 0.653415;"></div>
        <div class="banner-star" style="left: 92.5354%; top: 9.21152%; --dur: 2.489755446113543s; --delay: 1.3495073473824888s; opacity: 0.339853;"></div>
        <div class="banner-star" style="left: 38.4946%; top: 26.9393%; --dur: 1.5761314616479773s; --delay: 1.1260008315054602s; opacity: 0.390061;"></div>
        <div class="banner-star" style="left: 96.6717%; top: 61.433%; --dur: 1.2648775396821277s; --delay: 1.78987465769242s; opacity: 0.359702;"></div>
        <div class="banner-star" style="left: 90.898%; top: 51.6249%; --dur: 2.593238215284871s; --delay: 1.9941635107898839s; opacity: 0.266457;"></div>
        <div class="banner-star" style="left: 49.5172%; top: 47.3933%; --dur: 2.3950483803213025s; --delay: 1.605554917295748s; opacity: 0.57315;"></div>
        <div class="banner-star" style="left: 60.3013%; top: 29.4117%; --dur: 1.072745005909395s; --delay: 1.6441471938517076s; opacity: 0.273552;"></div>
        <div class="banner-star" style="left: 83.611%; top: 62.9296%; --dur: 2.884325248686908s; --delay: 1.6235154064945987s; opacity: 0.27118;"></div>
        <div class="banner-star" style="left: 58.2535%; top: 8.52373%; --dur: 1.6671934553688041s; --delay: 1.7429572959018584s; opacity: 0.296647;"></div>
        <div class="banner-star" style="left: 55.8932%; top: 75.2136%; --dur: 1.1515660971375674s; --delay: 1.5926292398832869s; opacity: 0.643691;"></div>
        <div class="banner-star" style="left: 66.7881%; top: 75.0935%; --dur: 2.2235971633245306s; --delay: 0.03008236630359118s; opacity: 0.624004;"></div>
        <div class="banner-star" style="left: 18.7579%; top: 77.9789%; --dur: 2.9983291775386514s; --delay: 1.7000689567033107s; opacity: 0.246562;"></div>
        <div class="banner-star" style="left: 34.4254%; top: 49.2168%; --dur: 2.6830449842852917s; --delay: 1.8665226399293429s; opacity: 0.685793;"></div>
        <div class="banner-star" style="left: 15.5164%; top: 13.6633%; --dur: 2.0594825160959647s; --delay: 0.3471648508447671s; opacity: 0.728145;"></div>
      </div>

      <!-- Profile header -->
      <div class="profile-header">
        <div class="avatar-wrapper">
          <div class="avatar-glow"></div>
          <div class="avatar">
            <img v-if="profile?.avatarUrl" :src="API_BASE + profile.avatarUrl" class="avatar-img" :alt="profile?.displayName" />
            <span v-else>{{ profile?.displayName?.charAt(0)?.toUpperCase() || '?' }}</span>
          </div>
        </div>
        <div class="user-name">{{ profile?.displayName || '...' }}</div>
        <div class="user-handle">@{{ profile?.username }}</div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon"><span class="material-symbols-outlined">music_note</span></div>
          <div class="stat-value">{{ profile?.songCount ?? 0 }}</div>
          <div class="stat-label">点歌数</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><span class="material-symbols-outlined">favorite</span></div>
          <div class="stat-value">{{ profile?.favoriteCount ?? 0 }}</div>
          <div class="stat-label">收藏</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions-row">
        <button class="action-btn action-btn-primary" @click="openEditDialog">
          <span class="material-symbols-outlined">edit</span> 编辑资料
        </button>
        <button class="action-btn action-btn-secondary" @click="openPasswordDialog">
          <span class="material-symbols-outlined">lock</span> 修改密码
        </button>
      </div>

      <!-- Recent songs -->
      <div class="section-card">
        <div class="section-title">
          <span class="material-symbols-outlined">history</span> 最近点歌
        </div>
        <div v-if="recentSongs.length > 0">
          <div v-for="song in recentSongs" :key="song.songId" class="song-item">
            <img v-if="song.coverUrl" :src="API_BASE + song.coverUrl" class="song-cover" :alt="song.title"
              @error="($event.target as HTMLImageElement).style.display = 'none'" />
            <div v-if="!song.coverUrl" class="song-cover-placeholder">
              <span class="material-symbols-outlined">music_note</span>
            </div>
            <div class="song-info">
              <div class="song-title">{{ song.title }}</div>
              <div class="song-artist">{{ song.artist }}</div>
            </div>
            <div class="song-meta">
              <div class="song-date">{{ formatDate(song.orderedAt) }}</div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-10">
          <span class="material-symbols-outlined" style="font-size:48px; color: var(--text-muted);">music_off</span>
          <p class="text-sm mt-3" style="color: var(--text-muted);">还没有点过歌</p>
        </div>
      </div>

      <!-- Settings -->
      <div class="section-card">
        <div class="section-title">
          <span class="material-symbols-outlined">settings</span> 设置
        </div>
        <div class="setting-item" @click="router.push('/notifications')">
          <div class="setting-icon"><span class="material-symbols-outlined">notifications</span></div>
          <div class="setting-text">
            <div class="setting-label">消息通知</div>
            <div class="setting-desc">管理房间邀请和系统通知</div>
          </div>
          <div class="setting-arrow"><span class="material-symbols-outlined">chevron_right</span></div>
        </div>
        <div class="divider"></div>
        <div class="setting-item" @click="router.push('/privacy')">
          <div class="setting-icon"><span class="material-symbols-outlined">privacy_tip</span></div>
          <div class="setting-text">
            <div class="setting-label">隐私设置</div>
            <div class="setting-desc">控制谁可以看到你的主页</div>
          </div>
          <div class="setting-arrow"><span class="material-symbols-outlined">chevron_right</span></div>
        </div>
        <div class="divider"></div>
        <div class="setting-item" @click="router.push('/about')">
          <div class="setting-icon"><span class="material-symbols-outlined">info</span></div>
          <div class="setting-text">
            <div class="setting-label">关于声域友</div>
            <div class="setting-desc">版本 1.0.0</div>
          </div>
          <div class="setting-arrow"><span class="material-symbols-outlined">chevron_right</span></div>
        </div>
      </div>
    </div>

    <!-- Edit Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑资料" width="420px" class="rounded-2xl">
      <div class="flex flex-col gap-4">
        <div><label class="block text-sm font-semibold mb-1.5" style="color:var(--text)">昵称</label>
          <el-input v-model="editForm.displayName" placeholder="输入昵称" size="large" /></div>
        <div><label class="block text-sm font-semibold mb-1.5" style="color:var(--text)">手机号</label>
          <el-input v-model="editForm.phone" placeholder="输入手机号" size="large" /></div>
        <div><label class="block text-sm font-semibold mb-1.5" style="color:var(--text)">邮箱</label>
          <el-input v-model="editForm.email" placeholder="输入邮箱" size="large" /></div>
      </div>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="handleUpdateProfile">保存</el-button>
      </template>
    </el-dialog>

    <!-- Password Dialog -->
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="420px" class="rounded-2xl">
      <div class="flex flex-col gap-4">
        <div><label class="block text-sm font-semibold mb-1.5" style="color:var(--text)">原密码</label>
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="输入原密码" show-password size="large" /></div>
        <div><label class="block text-sm font-semibold mb-1.5" style="color:var(--text)">新密码</label>
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="输入新密码" show-password size="large" /></div>
        <div><label class="block text-sm font-semibold mb-1.5" style="color:var(--text)">确认新密码</label>
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="再次输入新密码" show-password size="large" /></div>
      </div>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handleChangePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* ═══ Background blobs ═══ */
.bg-layer { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.blob { position: absolute; border-radius: 50%; filter: blur(80px); will-change: transform; }

.up-blob-1 { width: 600px; height: 600px; background: #71fcfe; top: -15%; left: -10%; animation: float-a 8s ease-in-out infinite; }
.up-blob-2 { width: 500px; height: 500px; background: rgba(113, 252, 254, 0.5); top: 35%; right: -15%; animation: float-b 10s ease-in-out infinite; }
.up-blob-3 { width: 450px; height: 450px; background: rgba(200, 240, 255, 0.6); bottom: -10%; left: 25%; animation: float-c 12s ease-in-out infinite; }
.up-blob-4 { width: 350px; height: 350px; background: rgba(79, 179, 255, 0.35); top: 50%; left: 60%; animation: float-a 14s ease-in-out infinite reverse; }
.up-blob-5 { width: 300px; height: 300px; background: rgba(0, 99, 153, 0.15); top: 10%; left: 50%; animation: float-b 9s ease-in-out infinite; filter: blur(90px); }
.up-blob-6 { width: 200px; height: 200px; background: rgba(113, 252, 254, 0.4); top: 70%; left: 10%; animation: float-c 7s ease-in-out infinite; filter: blur(70px); }
.up-blob-7 { width: 180px; height: 180px; background: rgba(0, 150, 200, 0.2); top: 20%; left: 75%; animation: float-a 10s ease-in-out infinite; filter: blur(60px); }
.up-blob-8 { width: 150px; height: 150px; background: rgba(200, 240, 255, 0.5); top: 80%; right: 20%; animation: float-b 8s ease-in-out infinite reverse; filter: blur(65px); }

@keyframes float-a {
  0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
  25% { transform: translate(180px, -120px) scale(1.12) rotate(5deg); }
  50% { transform: translate(-100px, -200px) scale(0.92) rotate(-3deg); }
  75% { transform: translate(140px, 80px) scale(1.08) rotate(4deg); }
}
@keyframes float-b {
  0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
  25% { transform: translate(-160px, 150px) scale(1.1) rotate(-4deg); }
  50% { transform: translate(120px, 100px) scale(0.95) rotate(6deg); }
  75% { transform: translate(-80px, -120px) scale(1.05) rotate(-2deg); }
}
@keyframes float-c {
  0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
  25% { transform: translate(120px, 140px) scale(0.9) rotate(3deg); }
  50% { transform: translate(-180px, -60px) scale(1.15) rotate(-5deg); }
  75% { transform: translate(100px, -130px) scale(0.95) rotate(2deg); }
}

/* ═══ Aurora streaks ═══ */
.aurora-layer { display: none; position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.aurora-streak { position: absolute; width: 140%; height: 180px; left: -20%; filter: blur(50px); opacity: 0.18; animation: aurora-drift 10s ease-in-out infinite; will-change: transform; }
.aurora-streak:nth-child(1) { top: 3%; background: linear-gradient(90deg, transparent, #00ff88, #00ccaa, #00ff88, transparent); animation-duration: 12s; }
.aurora-streak:nth-child(2) { top: 10%; background: linear-gradient(90deg, transparent, #7850ff, #4fb3ff, #7850ff, transparent); animation-duration: 15s; animation-delay: -4s; opacity: 0.12; }
.aurora-streak:nth-child(3) { top: 16%; background: linear-gradient(90deg, transparent, #4fb3ff, #00ff88, transparent); animation-duration: 18s; animation-delay: -8s; opacity: 0.1; }
@keyframes aurora-drift {
  0%, 100% { transform: translateX(-8%) scaleY(1) rotate(-1deg); }
  33% { transform: translateX(4%) scaleY(1.4) rotate(0.5deg); }
  66% { transform: translateX(8%) scaleY(0.8) rotate(-0.5deg); }
}

/* ═══ Stars ═══ */
.stars-layer { display: none; position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.star { position: absolute; width: 2px; height: 2px; background: #fff; border-radius: 50%; animation: twinkle var(--dur) ease-in-out infinite; animation-delay: var(--delay); }
@keyframes twinkle { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.5); } }

/* ═══ Shooting stars ═══ */
.shooting-star { position: absolute; width: 100px; height: 1.5px; background: linear-gradient(90deg, rgba(255,255,255,0.9), transparent); border-radius: 50%; opacity: 0; animation: shoot 6s ease-in-out infinite; transform: rotate(var(--r, -30deg)); will-change: opacity, transform; }
@keyframes shoot { 0%, 85%, 100% { opacity: 0; transform: rotate(var(--r, -30deg)) translateX(0); } 88% { opacity: 1; } 95% { opacity: 0; transform: rotate(var(--r, -30deg)) translateX(-300px); } }

/* ═══ Page wrapper ═══ */
.profile-page { min-height: 100vh; background: #ffffff; transition: background 0.5s; }
.page-wrapper { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; padding: 0 20px 100px; }

/* ═══ Top bar ═══ */
.top-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; margin-bottom: 8px; }
.top-bar-left { display: flex; align-items: center; gap: 12px; }
.back-btn { width: 40px; height: 40px; border-radius: 12px; border: none; background: rgba(255,255,255,0.72); backdrop-filter: blur(20px); color: #191c1e; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 12px 40px -12px rgba(0,0,0,0.05); }
.back-btn:hover { background: rgba(255,255,255,0.88); transform: scale(1.05); }
.top-bar-title { font-weight: 700; font-size: 18px; color: #191c1e; }

/* ═══ Banner ═══ */
.banner {
  position: relative; height: 220px; border-radius: 24px;
  background: linear-gradient(135deg, #004a75, #006399, #0088cc, #4fb3ff, #71fcfe, #4fb3ff, #006399);
  background-size: 300% 300%; animation: banner-shift 8s ease-in-out infinite;
  overflow: hidden; margin-bottom: -60px; box-shadow: 0 32px 64px -15px rgba(25,28,30,0.06);
}
.banner::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, #ffffff 100%); }
@keyframes banner-shift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

/* Clouds (light) */
.cloud { position: absolute; border-radius: 50px; animation: cloud-drift 30s linear infinite; }
.banner .cloud:nth-child(1) { width: 120px; height: 35px; top: 35px; left: -50px; animation-duration: 18s; background: rgba(255,255,255,0.25); box-shadow: 25px -22px 0 10px rgba(255,255,255,0.25), 65px -30px 0 22px rgba(255,255,255,0.22), 105px -15px 0 8px rgba(255,255,255,0.18); }
.banner .cloud:nth-child(2) { width: 90px; height: 28px; top: 85px; left: -30px; animation-duration: 14s; animation-delay: -5s; background: rgba(255,255,255,0.18); box-shadow: 20px -18px 0 8px rgba(255,255,255,0.18), 50px -24px 0 16px rgba(255,255,255,0.15), 80px -12px 0 6px rgba(255,255,255,0.12); }
.banner .cloud:nth-child(3) { width: 100px; height: 30px; top: 55px; left: -40px; animation-duration: 22s; animation-delay: -12s; background: rgba(255,255,255,0.14); box-shadow: 22px -20px 0 9px rgba(255,255,255,0.14), 55px -26px 0 18px rgba(255,255,255,0.12), 88px -14px 0 7px rgba(255,255,255,0.10); }
@keyframes cloud-drift { from { transform: translateX(-100px); } to { transform: translateX(calc(720px + 200px)); } }

/* Aurora shim */
.aurora-shim { position: absolute; width: 200%; height: 100%; left: -50%; opacity: 0; background: linear-gradient(90deg, transparent 0%, rgba(0,255,136,0.06) 20%, rgba(120,80,255,0.08) 40%, rgba(79,179,255,0.06) 60%, rgba(0,255,136,0.04) 80%, transparent 100%); animation: aurora-banner 6s ease-in-out infinite; }
@keyframes aurora-banner { 0%, 100% { transform: translateX(-30%); } 50% { transform: translateX(30%); } }

/* Banner stars */
.banner-star { position: absolute; width: 2px; height: 2px; background: #fff; border-radius: 50%; visibility: hidden; animation: twinkle var(--dur) ease-in-out infinite; animation-delay: var(--delay); }

/* ═══ Profile header ═══ */
.profile-header { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 20px; }
.avatar-wrapper { position: relative; margin-bottom: 16px; }
.avatar { width: 110px; height: 110px; border-radius: 50%; background: linear-gradient(135deg, #006399, #4fb3ff); display: flex; align-items: center; justify-content: center; font-size: 42px; font-weight: 800; color: #fff; position: relative; z-index: 1; box-shadow: 0 0 0 4px #ffffff, 0 0 0 6px rgba(0,99,153,0.3); transition: transform 0.3s, box-shadow 0.3s; }
.avatar:hover { transform: scale(1.08); box-shadow: 0 0 0 4px #ffffff, 0 0 0 8px rgba(0,99,153,0.3), 0 0 40px rgba(113,252,254,0.4); }
.avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.avatar-glow { position: absolute; inset: -10px; border-radius: 50%; background: radial-gradient(circle, rgba(113,252,254,0.4) 0%, transparent 70%); z-index: 0; animation: pulse-glow 3s ease-in-out infinite; }
@keyframes pulse-glow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }
.user-name { font-size: 26px; font-weight: 800; color: #191c1e; margin-bottom: 4px; }
.user-handle { font-size: 14px; color: #6f7882; margin-bottom: 6px; }

/* ═══ Stats ═══ */
.stats-row { display: flex; gap: 8px; width: 100%; margin-bottom: 20px; }
.stat-card { flex: 1; padding: 16px 12px; border-radius: 16px; background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.5); text-align: center; box-shadow: 0 12px 40px -12px rgba(0,0,0,0.05); transition: all 0.3s; cursor: default; }
.stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 16px -4px rgba(0,99,153,0.2); }
.stat-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(0,99,153,0.08); display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; transition: transform 0.3s; }
.stat-card:hover .stat-icon { transform: scale(1.15) rotate(-5deg); }
.stat-icon .material-symbols-outlined { font-size: 20px; color: #006399; }
.stat-value { font-size: 22px; font-weight: 800; color: #191c1e; line-height: 1.2; }
.stat-label { font-size: 12px; color: #6f7882; margin-top: 2px; }

/* ═══ Actions ═══ */
.actions-row { display: flex; gap: 10px; width: 100%; margin-bottom: 28px; }
.action-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 16px; border-radius: 14px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.25s; }
.action-btn .material-symbols-outlined { font-size: 20px; }
.action-btn-primary { background: linear-gradient(135deg, #006399, #005db7); color: #fff; box-shadow: 0 8px 16px -4px rgba(0,99,153,0.2); }
.action-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -4px rgba(0,99,153,0.35); }
.action-btn-secondary { background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); color: #191c1e; border: 1px solid rgba(191,199,210,0.5); box-shadow: 0 12px 40px -12px rgba(0,0,0,0.05); }
.action-btn-secondary:hover { transform: translateY(-2px); background: rgba(255,255,255,0.88); }

/* ═══ Section cards ═══ */
.section-card { background: rgba(255,255,255,0.65); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.5); border-radius: 20px; padding: 24px; margin-bottom: 16px; box-shadow: 0 12px 40px -12px rgba(0,0,0,0.05); transition: all 0.3s; animation: card-enter 0.5s ease-out both; }
.section-card:nth-child(2) { animation-delay: 0.1s; }
@keyframes card-enter { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: none; } }
.section-card:hover { box-shadow: 0 32px 64px -15px rgba(25,28,30,0.06); }
.section-title { font-size: 16px; font-weight: 700; color: #191c1e; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.section-title .material-symbols-outlined { font-size: 20px; color: #006399; }

/* ═══ Song items ═══ */
.song-item { display: flex; align-items: center; gap: 14px; padding: 12px; border-radius: 14px; transition: all 0.2s; }
.song-item:hover { background: rgba(236,238,240,0.6); }
.song-cover { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; flex-shrink: 0; }
.song-cover-placeholder { width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,99,153,0.08); }
.song-cover-placeholder .material-symbols-outlined { font-size: 22px; color: #6f7882; }
.song-info { flex: 1; min-width: 0; }
.song-title { font-size: 14px; font-weight: 600; color: #191c1e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.song-artist { font-size: 12px; color: #6f7882; margin-top: 2px; }
.song-meta { text-align: right; flex-shrink: 0; }
.song-date { font-size: 11px; color: #6f7882; }

/* ═══ Settings ═══ */
.setting-item { display: flex; align-items: center; gap: 14px; padding: 14px 12px; border-radius: 14px; transition: all 0.2s; cursor: pointer; }
.setting-item:hover { background: rgba(236,238,240,0.6); }
.setting-icon { width: 40px; height: 40px; border-radius: 12px; background: rgba(0,99,153,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.2s; }
.setting-item:hover .setting-icon { transform: scale(1.1); }
.setting-icon .material-symbols-outlined { font-size: 20px; color: #006399; }
.setting-text { flex: 1; }
.setting-label { font-size: 14px; font-weight: 600; color: #191c1e; }
.setting-desc { font-size: 12px; color: #6f7882; margin-top: 2px; }
.setting-arrow .material-symbols-outlined { font-size: 20px; color: #6f7882; transition: transform 0.2s; }
.setting-item:hover .setting-arrow .material-symbols-outlined { transform: translateX(3px); color: #006399; }
.divider { height: 1px; background: rgba(0,0,0,0.06); margin: 12px 0; }
</style>

<!-- Dark mode overrides (non-scoped, relies on .dark class on <html>) -->
<style>
.dark .profile-page { background: #0d1117; }

/* Blobs */
.dark .up-blob-1 { width: 700px; height: 700px; background: rgba(0, 255, 136, 0.08); top: -20%; right: -20%; filter: blur(120px); opacity: 0.6; animation: float-b 9s ease-in-out infinite; }
.dark .up-blob-2 { width: 600px; height: 600px; background: rgba(120, 80, 255, 0.06); bottom: -15%; left: -15%; filter: blur(110px); opacity: 0.5; animation: float-c 11s ease-in-out infinite; }
.dark .up-blob-3 { width: 500px; height: 500px; background: rgba(79, 179, 255, 0.05); top: 30%; left: 20%; filter: blur(100px); opacity: 0.4; animation: float-a 12s ease-in-out infinite; }
.dark .up-blob-4 { width: 400px; height: 400px; background: rgba(0, 255, 136, 0.06); top: 60%; right: 10%; filter: blur(100px); animation: float-b 15s ease-in-out infinite reverse; }
.dark .up-blob-5 { width: 350px; height: 350px; background: rgba(120, 80, 255, 0.05); top: 5%; left: 40%; filter: blur(90px); animation: float-c 8s ease-in-out infinite; }
.dark .up-blob-6 { width: 200px; height: 200px; background: rgba(0, 255, 136, 0.08); top: 75%; left: 15%; filter: blur(70px); animation: float-a 7s ease-in-out infinite; }
.dark .up-blob-7 { width: 180px; height: 180px; background: rgba(79, 179, 255, 0.07); top: 15%; left: 70%; filter: blur(60px); animation: float-c 10s ease-in-out infinite reverse; }
.dark .up-blob-8 { width: 160px; height: 160px; background: rgba(120, 80, 255, 0.06); bottom: 10%; right: 25%; filter: blur(55px); animation: float-b 9s ease-in-out infinite; }

/* Aurora + Stars */
.dark .aurora-layer { display: block; }
.dark .stars-layer { display: block; }

/* Top bar */
.dark .back-btn { background: rgba(20,27,45,0.75); color: #e8edf3; box-shadow: 0 12px 40px -12px rgba(0,0,0,0.3); }
.dark .top-bar-title { color: #e8edf3; }

/* Banner */
.dark .banner {
  background: linear-gradient(135deg, #0a0e27, #1a1040, #0d2137, #152040, #0a1628, #1a1040, #0a0e27);
  box-shadow: 0 32px 64px -15px rgba(0,0,0,0.4);
}
.dark .banner::after { background: linear-gradient(180deg, transparent 30%, #0d1117 100%); }
.dark .cloud { display: none; }
.dark .aurora-shim { opacity: 1; }
.dark .banner-star { visibility: visible; }

/* Profile header */
.dark .avatar { background: linear-gradient(135deg, #4fb3ff, #95ccff); box-shadow: 0 0 0 4px #0d1117, 0 0 0 6px rgba(79,179,255,0.4); }
.dark .avatar:hover { box-shadow: 0 0 0 4px #0d1117, 0 0 0 8px rgba(79,179,255,0.4), 0 0 40px rgba(0,255,136,0.3); }
.dark .avatar-glow { background: radial-gradient(circle, rgba(0,255,136,0.3) 0%, transparent 70%); }
.dark .user-name { color: #e8edf3; }
.dark .user-handle { color: #6b7a8d; }

/* Stats */
.dark .stat-card { background: rgba(15,20,35,0.7); border-color: rgba(79,179,255,0.12); box-shadow: 0 12px 40px -12px rgba(0,0,0,0.3); }
.dark .stat-card:hover { box-shadow: 0 8px 24px -4px rgba(79,179,255,0.25); }
.dark .stat-icon { background: rgba(79,179,255,0.12); }
.dark .stat-icon .material-symbols-outlined { color: #4fb3ff; }
.dark .stat-value { color: #e8edf3; }
.dark .stat-label { color: #6b7a8d; }

/* Actions */
.dark .action-btn-primary { background: linear-gradient(135deg, #4fb3ff, #64a1ff); color: #0a0e1a; }
.dark .action-btn-secondary { background: rgba(20,27,45,0.75); color: #e8edf3; border-color: rgba(255,255,255,0.1); box-shadow: 0 12px 40px -12px rgba(0,0,0,0.3); }

/* Section cards */
.dark .section-card { background: rgba(15,20,35,0.7); border-color: rgba(79,179,255,0.12); box-shadow: 0 12px 40px -12px rgba(0,0,0,0.3); }
.dark .section-card:hover { box-shadow: 0 32px 64px -15px rgba(0,0,0,0.4); }
.dark .section-title { color: #e8edf3; }
.dark .section-title .material-symbols-outlined { color: #4fb3ff; }

/* Song items */
.dark .song-item:hover { background: rgba(25,35,55,0.6); }
.dark .song-cover-placeholder { background: rgba(79,179,255,0.12); }
.dark .song-cover-placeholder .material-symbols-outlined { color: #6b7a8d; }
.dark .song-title { color: #e8edf3; }
.dark .song-artist { color: #6b7a8d; }
.dark .song-date { color: #6b7a8d; }

/* Settings */
.dark .setting-item:hover { background: rgba(25,35,55,0.6); }
.dark .setting-icon { background: rgba(79,179,255,0.12); }
.dark .setting-icon .material-symbols-outlined { color: #4fb3ff; }
.dark .setting-label { color: #e8edf3; }
.dark .setting-desc { color: #6b7a8d; }
.dark .setting-arrow .material-symbols-outlined { color: #6b7a8d; }
.dark .setting-item:hover .setting-arrow .material-symbols-outlined { color: #4fb3ff; }
.dark .divider { background: rgba(255,255,255,0.06); }
</style>
