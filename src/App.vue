<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterView } from "vue-router";
import { useRoute } from "vue-router";
import BottomBar from "./components/BottomBar.vue";
import Header from "./components/Header.vue";
import AppSplash from "./components/AppSplash.vue";
import ToastContainer from "./components/ToastContainer.vue";
import { useAuthStore } from "./stores/auth";

const SPLASH_DURATION_MS = 2000;

const route = useRoute();
const authStore = useAuthStore();
const showSplash = ref(true);
const showHeader = computed(() => !route.meta.hideHeader);
const showBottomBar = computed(() => !route.meta.hideBottomBar);
const pageTransitionName = computed(() => (route.name === "ai" ? "" : "page"));

onMounted(() => {
  window.setTimeout(() => {
    showSplash.value = false;
  }, SPLASH_DURATION_MS);
});
</script>

<template>
  <Transition name="app-splash">
    <AppSplash v-if="showSplash" />
  </Transition>
  <div class="desktop-stage">
    <aside class="brand-panel" aria-label="LUMOS service introduction">
      <img class="brand-panel__logo" src="/icons/web-app-manifest-192x192.png" alt="" />
      <p class="brand-panel__eyebrow">Night travel guide</p>
      <h1 class="brand-panel__title">LUMOS</h1>
      <p class="brand-panel__description">
        밤에도 걱정 없이 떠날 수 있도록 야간 명소, 코스, 리뷰를 한곳에 모아 보여주는
        모바일 여행 서비스입니다.
      </p>
      <ul class="brand-panel__points">
        <li>지역별 야간 관광지 탐색</li>
        <li>지도 기반 장소 확인</li>
        <li>관심 장소 저장과 코스 계획</li>
      </ul>
    </aside>

    <main class="mobile-app-frame" aria-label="LUMOS app preview">
      <Header v-if="showHeader" />
      <RouterView v-slot="{ Component, route: currentRoute }">
        <Transition :name="pageTransitionName" mode="out-in">
          <component :is="Component" :key="currentRoute.fullPath" />
        </Transition>
      </RouterView>
      <div v-if="showBottomBar" class="bottom-margin"></div>
      <BottomBar v-if="showBottomBar" />
    </main>
  </div>
  <Transition name="auth-status">
    <section
      v-if="authStore.isAuthStatusVisible"
      class="auth-status-overlay"
      role="status"
      aria-live="polite"
    >
      <div class="auth-status-panel">
        <span class="auth-status-spinner" aria-hidden="true"></span>
        <p>{{ authStore.authStatusMessage }}</p>
      </div>
    </section>
  </Transition>
  <ToastContainer />
</template>

<style scoped>
.bottom-margin {
  height: 5rem;
}

.brand-panel {
  display: none;
}

.mobile-app-frame {
  min-height: 100vh;
}

.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(0.35rem);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-0.2rem);
}

.auth-status-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: grid;
  padding: 1rem;
  place-items: center;
  background: rgba(7, 19, 33, 0.46);
  backdrop-filter: blur(0.25rem);
}

.auth-status-panel {
  display: flex;
  align-items: center;
  width: min(100%, 19rem);
  min-height: 4rem;
  padding: 0 1rem;
  gap: 0.75rem;
  color: #eef7ff;
  background: #20262d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.8rem;
  box-shadow: 0 1rem 2.5rem rgba(0, 0, 0, 0.28);
}

.auth-status-panel p {
  font-size: 0.88rem;
  font-weight: 700;
}

.auth-status-spinner {
  flex: 0 0 auto;
  width: 1.25rem;
  height: 1.25rem;
  border: 0.16rem solid rgba(238, 247, 255, 0.24);
  border-top-color: #69b4a5;
  border-radius: 50%;
  animation: auth-status-spin 0.75s linear infinite;
}

.auth-status-enter-active,
.auth-status-leave-active {
  transition: opacity 0.16s ease;
}

.auth-status-enter-from,
.auth-status-leave-to {
  opacity: 0;
}

.app-splash-leave-active {
  transition: opacity 0.28s ease;
}

.app-splash-leave-to {
  opacity: 0;
}

@keyframes auth-status-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 900px) {
  .desktop-stage {
    --desktop-brand-width: minmax(18rem, 25rem);
    --desktop-app-width: 32rem;
    --desktop-stage-gap: clamp(3rem, 7vw, 6rem);

    display: grid;
    grid-template-columns: var(--desktop-brand-width) var(--desktop-app-width);
    justify-content: center;
    align-items: start;
    min-height: 100vh;
    padding: 2rem clamp(2rem, 6vw, 5rem);
    gap: var(--desktop-stage-gap);
  }

  .brand-panel {
    position: sticky;
    top: 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: calc(100vh - 4rem);
    padding-bottom: 3rem;
  }

  .brand-panel__logo {
    width: 5.25rem;
    height: 5.25rem;
    margin-bottom: 1.5rem;
    border-radius: 1.35rem;
    box-shadow: 0 1.25rem 2.5rem rgba(0, 0, 0, 0.28);
  }

  .brand-panel__eyebrow {
    margin-bottom: 0.5rem;
    color: #69b4a5;
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .brand-panel__title {
    margin: 0;
    color: #f5faff;
    font-size: 4rem;
    font-weight: 900;
    line-height: 0.95;
  }

  .brand-panel__description {
    width: min(100%, 23rem);
    margin-top: 1.35rem;
    color: rgba(238, 247, 255, 0.78);
    font-size: 1.05rem;
    font-weight: 500;
    line-height: 1.7;
  }

  .brand-panel__points {
    display: grid;
    margin: 1.75rem 0 0;
    padding: 0;
    gap: 0.65rem;
    color: rgba(238, 247, 255, 0.66);
    font-size: 0.95rem;
    font-weight: 650;
    list-style: none;
  }

  .brand-panel__points li {
    position: relative;
    padding-left: 1rem;
  }

  .brand-panel__points li::before {
    position: absolute;
    top: 0.6em;
    left: 0;
    width: 0.35rem;
    height: 0.35rem;
    background: #69b4a5;
    border-radius: 50%;
    content: "";
  }

  .mobile-app-frame {
    position: relative;
    width: 32rem;
    min-height: calc(100vh - 4rem);
    overflow: clip;
    background:
      radial-gradient(circle at 50% 0%, rgba(186, 226, 244, 0.1), rgba(186, 226, 244, 0) 38%),
      #071321;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 2rem;
    box-shadow:
      0 1.5rem 4rem rgba(0, 0, 0, 0.34),
      0 0 0 0.5rem rgba(255, 255, 255, 0.035);
  }

  .auth-status-overlay {
    left: calc(50% + 12.5rem + clamp(1.5rem, 3.5vw, 3rem));
    width: 32rem;
    border-radius: 2rem;
    transform: translateX(-50%);
  }
}
</style>
