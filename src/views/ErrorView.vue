<script setup>
import { computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useErrorStore } from '@/stores/error'

const router = useRouter()
const errorStore = useErrorStore()

const statusCode = computed(() => {
  return errorStore.currentError?.statusCode || '연결 오류'
})

const errorCode = computed(() => {
  return errorStore.currentError?.errorCode || 'UNKNOWN_ERROR'
})

const message = computed(() => {
  return errorStore.currentError?.message || '요청을 처리하는 중 오류가 발생했습니다.'
})

const previousPath = computed(() => {
  return errorStore.currentError?.from || '/'
})

const goHome = () => {
  errorStore.clearError()
  router.replace('/')
}

const retryPreviousPage = () => {
  const path = previousPath.value
  errorStore.clearError()
  router.replace(path)
}

onUnmounted(() => {
  errorStore.clearError()
})
</script>

<template>
  <main class="error-view">
    <section class="error-card">
      <p class="eyebrow">Something went wrong</p>
      <h1>요청을 완료하지 못했습니다</h1>
      <p class="message">{{ message }}</p>

      <dl>
        <div>
          <dt>상태</dt>
          <dd>{{ statusCode }}</dd>
        </div>
        <div>
          <dt>에러 코드</dt>
          <dd>{{ errorCode }}</dd>
        </div>
      </dl>

      <div class="actions">
        <button type="button" class="primary" @click="retryPreviousPage">이전 화면에서 다시 시도</button>
        <button type="button" @click="goHome">홈으로 이동</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.error-view {
  display: grid;
  min-height: calc(100vh - 4rem);
  padding: 2rem 1rem;
  place-items: center;
}

.error-card {
  width: min(100%, 32rem);
  padding: 2rem;
  background: rgba(27, 42, 60, 0.95);
  border: 1px solid rgba(117, 215, 255, 0.16);
  border-radius: 1.2rem;
  box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.24);
}

.eyebrow {
  color: #75d7ff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin-top: 0.5rem;
  font-size: 1.55rem;
}

.message {
  margin-top: 0.8rem;
  color: #c7d4e2;
  line-height: 1.6;
}

dl {
  display: grid;
  margin-top: 1.5rem;
  padding: 0.9rem 1rem;
  gap: 0.65rem;
  background: #0c1927;
  border-radius: 0.75rem;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

dt {
  color: #8fa2b6;
}

dd {
  color: #e1f7ff;
  font-weight: 700;
  text-align: right;
}

.actions {
  display: grid;
  margin-top: 1.5rem;
  gap: 0.65rem;
}

button {
  min-height: 2.8rem;
  color: #dbeaf5;
  background: #34475c;
  border-radius: 0.7rem;
  font-weight: 700;
}

button.primary {
  color: #06131f;
  background: #83ddff;
}
</style>
