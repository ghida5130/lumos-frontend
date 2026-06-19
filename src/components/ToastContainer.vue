<script setup>
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()

const typeLabels = {
  success: '성공',
  error: '오류',
  warning: '주의',
  info: '알림',
}
</script>

<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="section" class="toast-container" aria-live="polite" aria-label="알림">
      <article
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="toast"
        :class="`toast-${toast.type}`"
        role="status"
      >
        <div class="toast-content">
          <strong class="toast-title">{{ toast.title || typeLabels[toast.type] }}</strong>
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
  padding: 0.62rem 0.8rem 0.62rem 0.85rem;
  color: #f8fbff;
  background: rgba(16, 27, 39, 0.96);
  border: 1px solid rgba(199, 214, 229, 0.18);
  border-left: 0.18rem solid #48cfff;
  border-radius: 0.45rem;
  box-shadow: 0 0.7rem 1.5rem rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(14px);
  pointer-events: auto;
}

.toast-success {
  border-left-color: #3ddc97;
}

.toast-error {
  border-left-color: #ff6b6b;
}

.toast-warning {
  border-left-color: #ffd166;
}

.toast-info {
  border-left-color: #48cfff;
}

.toast-content {
  min-width: 0;
}

.toast-title {
  display: block;
  margin-bottom: 0.12rem;
  color: #ffffff;
  font-size: 0.76rem;
  font-weight: 850;
  line-height: 1.2;
}

.toast-message {
  margin: 0;
  color: rgba(232, 240, 249, 0.9);
  font-size: 0.78rem;
  font-weight: 500;
  line-height: 1.32;
  overflow-wrap: anywhere;
}

.toast-enter-active,
.toast-leave-active,
.toast-move {
  transition:
    opacity 0.24s ease,
    transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-1rem);
}

.toast-leave-active {
  position: absolute;
  width: 100%;
}

@media (max-width: 480px) {
  .toast-container {
    width: calc(100vw - 2rem);
  }
}
</style>
