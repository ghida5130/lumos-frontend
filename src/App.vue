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
  <Header v-if="showHeader" />
  <RouterView v-slot="{ Component, route: currentRoute }">
    <Transition :name="pageTransitionName" mode="out-in">
      <component :is="Component" :key="currentRoute.fullPath" />
    </Transition>
  </RouterView>
  <div v-if="showBottomBar" class="bottom-margin"></div>
  <BottomBar v-if="showBottomBar" />
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
</style>
