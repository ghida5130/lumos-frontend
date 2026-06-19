import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { refreshAccessToken } from '../services/authSession'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0, left: 0 }
  },
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
      meta: {
        headerTitle: '로그인',
        showBackButton: false,
      },
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
        hideBottomBar: true,
        requiresAuth: true,
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
      },
    },
    {
      path: '/mypage',
      name: 'mypage',
      component: () => import('../views/MyPageView.vue'),
      meta: {
        headerTitle: '마이페이지',
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
      },
    },
    {
      path: '/place-map',
      name: 'place-map',
      component: () => import('../views/MapView.vue'),
      props: () => ({
        places: window.history.state?.places ?? [],
      }),
      meta: {
        headerTitle: '지도에서 확인하기',
        showBackButton: true,
        hideBottomBar: true,
      },
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('../views/FavoritePlacesView.vue'),
      meta: {
        headerTitle: '여행지 즐겨찾기',
        showBackButton: true,
      },
    },
    {
      path: '/saved-courses',
      name: 'saved-courses',
      component: () => import('../views/SavedCoursesView.vue'),
      meta: {
        headerTitle: '저장한 여행 경로',
        showBackButton: true,
        requiresAuth: true,
      },
    },
    {
      path: '/withdraw',
      name: 'withdraw',
      component: () => import('../views/WithdrawView.vue'),
      meta: {
        headerTitle: '회원 탈퇴',
        showBackButton: true,
        requiresAuth: true,
      },
    },
    {
      path: '/edit-profile',
      name: 'edit-profile',
      component: () => import('../views/EditProfileView.vue'),
      meta: {
        headerTitle: '프로필 수정',
        showBackButton: true,
        requiresAuth: true,
      },
    },
    {
      path: '/error',
      name: 'error',
      component: () => import('../views/ErrorView.vue'),
      meta: {
        headerTitle: '오류',
        showBackButton: true,
        hideBottomBar: true,
      },
    },
    {
      path: '/api-test',
      name: 'api-test',
      component: () => import('../views/ApiTestView.vue'),
      meta: {
        headerTitle: 'API 테스트',
        showBackButton: true,
        hideBottomBar: true,
      },
    },
    {
      path: '/path-api-test',
      name: 'path-api-test',
      component: () => import('../views/PathApiTestView.vue'),
      meta: {
        headerTitle: 'API 경로 테스트',
        showBackButton: true,
        hideBottomBar: true,
      },
    },
    {
      path: '/multipart-api-test',
      name: 'multipart-api-test',
      component: () => import('../views/MultipartApiTestView.vue'),
      meta: {
        headerTitle: 'Multipart API 테스트',
        showBackButton: true,
        hideBottomBar: true,
      },
    },
  ],
})

router.beforeEach(async (to) => {
  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth)

  if (!requiresAuth) {
    return true
  }

  const authStore = useAuthStore()

  if (authStore.isLoggedIn) {
    return true
  }

  try {
    await refreshAccessToken()
    return true
  } catch {
    // Refresh Token까지 사용할 수 없을 때 로그인 페이지로 이동한다.
  }

  return {
    name: 'login',
    query: { redirect: to.fullPath },
  }
})

export default router
