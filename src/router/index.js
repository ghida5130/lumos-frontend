import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        headerTitle: 'Lumos',
        showBackButton: false,
      },
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/list',
      name: 'list',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/ListView.vue'),
      meta: {
        headerTitle: '여행지',
        showBackButton: true,
      },
    },
    {
      path: '/login',
      alias: '/test',
      name: 'login',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/LoginTestPage.vue'),
    },
    {
      path: '/ai',
      name: 'ai',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AIView.vue'),
      meta: {
        headerTitle: 'AI',
        showBackButton: true,
        prevPath: '/',
        hideBottomBar: true,
      },
    },
    {
      path: '/feed',
      name: 'feed',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/FeedView.vue'),
      meta: {
        headerTitle: '피드',
        showBackButton: true,
        prevPath: '/',
      },
    },
    {
      path: '/mypage',
      name: 'mypage',
      component: () => import('../views/MyPageView.vue'),
      meta: {
        headerTitle: '마이페이지',
        showBackButton: true,
        prevPath: '/',
        requiresAuth: true,
      },
    },
    {
      path: '/detail',
      name: 'detail',
      component: () => import('../views/DetailView.vue'),
      meta: {
        headerTitle: '여행지 상세 정보',
        showBackButton: true,
        prevPath: '/list',
      },
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('../views/FavoritePlacesView.vue'),
      meta: {
        headerTitle: '여행지 즐겨찾기',
        showBackButton: true,
        prevPath: '/mypage',
      },
    },
  ],
})

router.beforeEach((to) => {
  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth)

  if (!requiresAuth) {
    return true
  }

  const authStore = useAuthStore()

  if (authStore.isLoggedIn) {
    return true
  }

  return {
    name: 'login',
    query: { redirect: to.fullPath },
  }
})

export default router
