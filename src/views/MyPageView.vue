<script setup>
import { computed } from "vue";
import { useMutation } from "@tanstack/vue-query";
import { RouterLink, useRouter } from "vue-router";
import { postLogout } from "@/api/auth";
import { clearAuthSession } from "@/services/authSession";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const logoutMutation = useMutation({
  mutationFn: postLogout,
  meta: {
    errorMode: "local",
  },
  onMutate: () => {
    authStore.setAuthStatus("로그아웃 처리 중입니다.");
    toastStore.info("로그아웃 처리 중입니다.", { duration: 1800 });
  },
  onSuccess: () => {
    clearAuthSession();
    toastStore.success("로그아웃되었습니다.");
    router.replace("/").finally(() => {
      authStore.clearAuthStatus();
    });
  },
  onError: () => {
    authStore.clearAuthStatus();
    toastStore.error("로그아웃에 실패했습니다.");
  },
});

const logoutErrorMessage = computed(() => logoutMutation.error.value?.message ?? "");
const logout = () => logoutMutation.mutate();
const showToastTest = () => {
  toastStore.success("토스트가 정상적으로 표시됩니다.");
};

const menuGroups = [
  [
    { id: "saved-routes", label: "저장한 여행 경로", routeName: "saved-courses" },
    { id: "favorite-places", label: "여행지 즐겨찾기", routeName: "favorites" },
  ],
  [
    { id: "settings", label: "설정" },
    { id: "edit-profile", label: "프로필 수정하기", routeName: "edit-profile" },
    { id: "notifications", label: "알림 설정" },
    { id: "withdraw", label: "회원 탈퇴", routeName: "withdraw" },
    { id: "logout", label: "로그아웃", action: logout },
  ],
];
</script>

<template>
  <main class="mypage-view">
    <section class="profile-section">
      <div class="profile-summary">
        <div class="profile-avatar" aria-hidden="true">
          <img v-if="authStore.profileImageUrl" :src="authStore.profileImageUrl" alt="" />
        </div>
        <div class="profile-copy">
          <h2>{{ authStore.nickname || "이름" }}</h2>
          <p>{{ authStore.email }}</p>
        </div>
      </div>

      <RouterLink class="edit-profile-button" :to="{ name: 'edit-profile' }"
        >프로필 수정하기</RouterLink
      >
      <button class="toast-test-button" type="button" @click="showToastTest">토스트 테스트</button>
    </section>

    <nav class="mypage-menu">
      <ul v-for="(group, groupIndex) in menuGroups" :key="groupIndex" class="menu-group">
        <li v-for="item in group" :key="item.id">
          <RouterLink v-if="item.routeName" :to="{ name: item.routeName }" class="menu-item">
            <span>{{ item.label }}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </RouterLink>
          <button
            v-else
            type="button"
            class="menu-item"
            :disabled="item.id === 'logout' && logoutMutation.isPending.value"
            @click="item.action?.()"
          >
            <span>{{
              item.id === "logout" && logoutMutation.isPending.value ? "로그아웃 중..." : item.label
            }}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </li>
      </ul>

      <p v-if="logoutErrorMessage" class="logout-error">{{ logoutErrorMessage }}</p>
      <p v-if="logoutMutation.isPending.value" class="logout-status">로그아웃 처리 중입니다.</p>
    </nav>
  </main>
</template>

<style scoped>
.mypage-view {
  position: relative;
  min-height: calc(100vh - 3rem);
  padding: 1.4rem 1rem 7rem;
  overflow: hidden;
  color: #f7f9fc;
  background: transparent;
}

.profile-section,
.mypage-menu {
  position: relative;
  z-index: 1;
  width: min(100%, 38rem);
  margin: 0 auto;
}

.logout-error {
  color: #ffbaba;
  font-size: 0.78rem;
  text-align: center;
}

.logout-status {
  color: #bdebe3;
  font-size: 0.78rem;
  text-align: center;
}

.profile-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.65rem 1.1rem 1rem;
}

.profile-avatar {
  flex: 0 0 4.25rem;
  width: 4.25rem;
  height: 4.25rem;
  display: grid;
  place-items: center;
  color: #dff8f2;
  background: #69b4a5;
  border-radius: 50%;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.profile-avatar svg {
  width: 2rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.25;
}

.profile-copy {
  min-width: 0;
}

.profile-copy h2 {
  font-size: 1rem;
  font-weight: 700;
}

.profile-copy p {
  margin-top: 0.4rem;
  overflow: hidden;
  color: #d6dfeb;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-profile-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 2.55rem;
  color: #eef7ff;
  background: #304d7c;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.toast-test-button {
  width: 100%;
  min-height: 2.55rem;
  margin-top: 0.75rem;
  color: #071321;
  background: #48cfff;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.edit-profile-button:active {
  background: #3a5d93;
  transform: scale(0.99);
}

.toast-test-button:active {
  background: #7edfff;
  transform: scale(0.99);
}

.mypage-menu {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.75rem;
}

.menu-group {
  overflow: hidden;
  background: #20262d;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 0.8rem;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.14);
}

.menu-group li + li {
  border-top: 1px solid #3b4148;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 2.65rem;
  padding: 0 1rem;
  color: #e5eaf0;
  text-align: left;
}

.menu-item span {
  font-size: 0.76rem;
}

.menu-item svg {
  width: 1rem;
  fill: none;
  stroke: #738092;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

@media (min-width: 640px) {
  .mypage-view {
    padding-top: 2rem;
  }

  .profile-summary {
    padding-right: 1.5rem;
    padding-left: 1.5rem;
  }
}
</style>
