import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
    },
    { path: '/', redirect: '/dashboard' },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: '仪表盘', icon: 'dashboard', requiresAuth: true },
    },
    {
      path: '/rooms',
      name: 'Rooms',
      component: () => import('@/views/RoomManagementView.vue'),
      meta: { title: '房间监控', icon: 'meeting_room', requiresAuth: true },
    },
    {
      path: '/songs',
      name: 'Songs',
      component: () => import('@/views/SongManagementView.vue'),
      meta: { title: '歌曲管理', icon: 'library_music', requiresAuth: true },
    },
    {
      path: '/songs/:id',
      name: 'SongDetail',
      component: () => import('@/views/SongDetailView.vue'),
      meta: { title: '歌曲详情', requiresAuth: true },
    },
    {
      path: '/feedbacks',
      name: 'Feedbacks',
      component: () => import('@/views/FeedbackManagementView.vue'),
      meta: { title: '反馈管理', icon: 'feedback', requiresAuth: true },
    },
    {
      path: '/accounts',
      name: 'Accounts',
      component: () => import('@/views/AccountManagementView.vue'),
      meta: { title: '账户管理', icon: 'manage_accounts', requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/SystemSettingsView.vue'),
      meta: { title: '系统设置', icon: 'settings', requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    return { name: 'Login' }
  }
  if (to.name === 'Login' && token) {
    return { name: 'Dashboard' }
  }
})

export default router
