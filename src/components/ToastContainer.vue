<script setup>
import { useToastStore } from "@/stores/toast";

const toastStore = useToastStore();

const typeLabels = {
  success: "성공",
  error: "오류",
  warning: "주의",
  info: "알림",
};
</script>

<template>
  <Teleport to="body">
    <TransitionGroup
      name="toast"
      tag="section"
      class="toast-container"
      aria-live="polite"
      aria-label="알림"
    >
      <article
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="toast"
        :class="`toast-${toast.type}`"
        role="status"
        tabindex="0"
        @click="toastStore.remove(toast.id)"
        @keydown.enter="toastStore.remove(toast.id)"
        @keydown.space.prevent="toastStore.remove(toast.id)"
      >
        <div class="toast-content">
          <span class="toast-indicator" aria-hidden="true"></span>
          <!-- <strong class="toast-title">{{ toast.title || typeLabels[toast.type] }}</strong> -->
          <p class="toast-message">{{ toast.message }}</p>
        </div>
      </article>
    </TransitionGroup>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: calc(1rem + env(safe-area-inset-top));
  left: 50%;
  z-index: 11000;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  width: min(calc(100vw - 2rem), 21rem);
  transform: translateX(-50%);
  pointer-events: none;
}

.toast {
  position: relative;
  overflow: hidden;
  padding: 0.72rem 0.9rem;
  color: #f8fbff;
  background: rgba(23, 34, 51, 0.88);
  border: 1px solid rgba(49, 66, 88, 0.9);
  border-radius: 0.7rem;
  box-shadow: 0 0.45rem 1.1rem rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: pointer;
  pointer-events: auto;
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.toast:focus {
  outline: none;
}

.toast:focus-visible {
  outline: 2px solid var(--toast-accent, #48cfff);
  outline-offset: 0.18rem;
}

.toast-success {
  --toast-accent: #69b4a5;
  --toast-accent-glow: rgba(105, 180, 165, 0.18);
}

.toast-error {
  --toast-accent: #e58b91;
  --toast-accent-glow: rgba(229, 139, 145, 0.18);
}

.toast-warning {
  --toast-accent: #d0b96f;
  --toast-accent-glow: rgba(208, 185, 111, 0.18);
}

.toast-info {
  --toast-accent: #72d3ff;
  --toast-accent-glow: rgba(114, 211, 255, 0.18);
}

.toast-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.toast-indicator {
  flex: 0 0 auto;
  width: 0.48rem;
  height: 0.48rem;
  background: var(--toast-accent, #48cfff);
  border-radius: 50%;
  box-shadow: 0 0 0.35rem var(--toast-accent-glow, rgba(72, 207, 255, 0.18));
  animation: indicatorPulse 1.8s ease-in-out infinite;
}

.toast-title {
  flex: 0 0 auto;
  color: #f7f9fc;
  font-size: 0.74rem;
  font-weight: 800;
  line-height: 1.2;
}

.toast-title::after {
  color: rgba(245, 249, 255, 0.42);
  content: "·";
  margin-left: 0.45rem;
}

.toast-message {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #c7d1de;
  font-size: 0.78rem;
  font-weight: 500;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toast-enter-active,
.toast-leave-active,
.toast-move {
  transition: transform 0.52s cubic-bezier(0.19, 1, 0.22, 1);
}

.toast-enter-from,
.toast-leave-to {
  transform: translateY(calc(-100% - 2rem - env(safe-area-inset-top)));
}

.toast-leave-active {
  position: absolute;
  width: 100%;
}

@keyframes indicatorPulse {
  0%,
  100% {
    opacity: 0.72;
    transform: scale(0.94);
  }

  50% {
    opacity: 0.96;
    transform: scale(1.02);
  }
}

@media (max-width: 480px) {
  .toast-container {
    width: calc(100vw - 3rem);
  }
}
</style>
