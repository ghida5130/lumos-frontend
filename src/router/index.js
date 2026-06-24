import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { refreshAccessToken } from "../services/authSession";
import { useAuthStore } from "../stores/auth";
import { useToastStore } from "../stores/toast";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0, left: 0 };
  },
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: {
        headerTitle: "Lumos",
        showBackButton: false,
      },
    },
    {
      path: "/list",
      name: "list",
      component: () => import("../views/ListView.vue"),
      meta: {
        headerTitle: "여행지",
      },
    },
    {
      path: "/login",
      alias: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: {
        headerTitle: "로그인",
        showBackButton: false,
      },
    },
    {
      path: "/auth/social/callback",
      name: "social-callback",
      component: () => import("../views/SocialCallbackView.vue"),
      meta: {
        headerTitle: "구글 로그인",
        hideHeader: true,
        hideBottomBar: true,
      },
    },
    {
      path: "/signup",
      name: "signup",
      component: () => import("../views/SignupView.vue"),
      meta: {
        headerTitle: "회원가입",
        showBackButton: true,
      },
    },
    {
      path: "/login-test",
      alias: "/login-test",
      name: "login-test",
      component: () => import("../views-test/LoginTestPage.vue"),
      meta: {
        headerTitle: "로그인 테스트",
        showBackButton: false,
      },
    },
    {
      path: "/ai",
      name: "ai",
      component: () => import("../views/AIView.vue"),
      meta: {
        headerTitle: "AI",
        showBackButton: true,
        hideBottomBar: true,
        requiresAuth: true,
      },
    },
    {
      path: "/feed",
      name: "feed",
      component: () => import("../views/FeedView.vue"),
      meta: {
        headerTitle: "피드",
      },
    },
    {
      path: "/mypage",
      name: "mypage",
      component: () => import("../views/MyPageView.vue"),
      meta: {
        headerTitle: "마이페이지",
        requiresAuth: true,
      },
    },
    {
      path: "/detail",
      name: "detail",
      component: () => import("../views/DetailView.vue"),
      meta: {
        headerTitle: "여행지 상세 정보",
        showBackButton: true,
      },
    },
    {
      path: "/place-map",
      name: "place-map",
      component: () => import("../views/MapView.vue"),
      props: () => ({
        places: window.history.state?.places ?? [],
      }),
      meta: {
        headerTitle: "지도에서 확인하기",
        showBackButton: true,
        hideBottomBar: true,
      },
    },
    {
      path: "/favorites",
      name: "favorites",
      component: () => import("../views/FavoritePlacesView.vue"),
      meta: {
        headerTitle: "여행지 즐겨찾기",
        showBackButton: true,
      },
    },
    {
      path: "/saved-courses",
      name: "saved-courses",
      component: () => import("../views/SavedCoursesView.vue"),
      meta: {
        headerTitle: "저장한 여행 경로",
        showBackButton: true,
        requiresAuth: true,
      },
    },
    {
      path: "/course-edit",
      name: "course-edit",
      component: () => import("../views/CourseEditView.vue"),
      meta: {
        headerTitle: "코스 수정",
        showBackButton: true,
        hideBottomBar: true,
        requiresAuth: true,
      },
    },
    {
      path: "/withdraw",
      name: "withdraw",
      component: () => import("../views/WithdrawView.vue"),
      meta: {
        headerTitle: "회원 탈퇴",
        showBackButton: true,
        requiresAuth: true,
      },
    },
    {
      path: "/edit-profile",
      name: "edit-profile",
      component: () => import("../views/EditProfileView.vue"),
      meta: {
        headerTitle: "프로필 수정",
        showBackButton: true,
        requiresAuth: true,
      },
    },
    {
      path: "/error",
      name: "error",
      component: () => import("../views/ErrorView.vue"),
      meta: {
        headerTitle: "오류",
        showBackButton: true,
        hideBottomBar: true,
      },
    },
    {
      path: "/api-test",
      name: "api-test",
      component: () => import("../views-test/ApiTestView.vue"),
      meta: {
        headerTitle: "API 테스트",
        showBackButton: true,
        hideBottomBar: true,
      },
    },
    {
      path: "/path-api-test",
      name: "path-api-test",
      component: () => import("../views-test/PathApiTestView.vue"),
      meta: {
        headerTitle: "API 경로 테스트",
        showBackButton: true,
        hideBottomBar: true,
      },
    },
    {
      path: "/multipart-api-test",
      name: "multipart-api-test",
      component: () => import("../views-test/MultipartApiTestView.vue"),
      meta: {
        headerTitle: "Multipart API 테스트",
        showBackButton: true,
        hideBottomBar: true,
      },
    },
  ],
});

// 로그인이 필요한 페이지 관리
// 페이지 지정은 각 라우팅 meta에서 관리
router.beforeEach(async (to) => {
  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth);
  const authStore = useAuthStore();

  if (!requiresAuth) {
    authStore.clearAuthStatus();
    return true;
  }

  if (authStore.isLoggedIn) {
    authStore.clearAuthStatus();
    return true;
  }

  const toastStore = useToastStore();
  authStore.setAuthStatus("로그인 상태를 확인하는 중입니다.");

  try {
    await refreshAccessToken();
    authStore.clearAuthStatus();
    return true;
  } catch {
    // Refresh Token까지 사용할 수 없을 때 로그인 페이지로 이동
  }

  authStore.setAuthStatus("로그인 페이지로 이동하는 중입니다.");
  toastStore.warning("로그인이 필요합니다. 로그인 페이지로 이동합니다.", { duration: 2200 });

  return {
    name: "login",
    query: { redirect: to.fullPath },
  };
});

router.afterEach((to) => {
  const authStore = useAuthStore();

  if (to.name === "login" && authStore.authStatusMessage === "로그인 페이지로 이동하는 중입니다.") {
    window.setTimeout(() => {
      authStore.clearAuthStatus();
    }, 500);
    return;
  }

  authStore.clearAuthStatus();
});

export default router;
