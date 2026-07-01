import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory('/web/'),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { requiresAuth: false },
    },
    { path: '/', redirect: '/explore' },
    {
      path: '/explore',
      name: 'Explore',
      component: () => import('@/views/ExploreSongsView.vue'),
      meta: { title: '探索歌曲', icon: 'explore', requiresAuth: true },
    },
    {
      path: '/charts',
      name: 'Charts',
      component: () => import('@/views/TopChartsView.vue'),
      meta: { title: '热门榜单', icon: 'trending_up', requiresAuth: true },
    },
    {
      path: '/favorites',
      name: 'Favorites',
      component: () => import('@/views/MyFavoritesView.vue'),
      meta: { title: '我的收藏', icon: 'favorite', requiresAuth: true },
    },
    {
      path: '/room',
      name: 'Room',
      component: () => import('@/views/CurrentRoomView.vue'),
      meta: { title: '当前房间', icon: 'meeting_room', requiresAuth: true },
    },
    {
      path: '/rooms',
      name: 'RoomList',
      component: () => import('@/views/RoomListView.vue'),
      meta: { title: '房间列表', icon: 'meeting_room', requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/UserProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/notifications',
      name: 'Notifications',
      component: () => import('@/views/NotificationsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/privacy',
      name: 'Privacy',
      component: () => import('@/views/PrivacyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/about',
      name: 'About',
      component: () => import('@/views/AboutView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/explore',
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: '/login' }
  }
  if ((to.name === 'Login' || to.name === 'Register') && auth.isLoggedIn) {
    return { path: '/explore' }
  }
})

export default router
