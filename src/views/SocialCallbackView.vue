<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { postSocialExchange } from '@/api/auth'
import { setAuthSession } from '@/services/authSession'
import { useToastStore } from '@/stores/toast'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const isLoading = ref(true)
const errorMessage = ref('')

const code = computed(() => {
  const queryCode = route.query.code

  return Array.isArray(queryCode) ? (queryCode[0] ?? '') : (queryCode ?? '')
})

async function exchangeSocialCode() {
  if (!code.value) {
    errorMessage.value = '구글 로그인 인증 코드가 없습니다. 다시 시도해주세요.'
    isLoading.value = false
    return
  }

  try {
    const data = await postSocialExchange({
      code: code.value,
    })

    setAuthSession(data)
    toastStore.success('구글 로그인에 성공했습니다.')
    router.replace({ name: 'home' })
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ?? error.message ?? '구글 로그인에 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  exchangeSocialCode()
})
</script>

<template>
  <main class="social-callback-view">
    <section class="callback-panel" aria-labelledby="callback-title">
      <span v-if="isLoading" class="spinner" aria-hidden="true"></span>
      <p class="eyebrow">Google Login</p>
      <h1 id="callback-title">
        {{ isLoading ? '구글 로그인을 수행 중입니다' : '구글 로그인 처리 결과' }}
      </h1>
      <p v-if="isLoading" class="description">
        인증 정보를 확인하고 있어요. 잠시만 기다려주세요.
      </p>
      <p v-else-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      <RouterLink v-if="!isLoading && errorMessage" class="login-link" :to="{ name: 'login' }">
        로그인으로 돌아가기
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.social-callback-view {
  display: grid;
  min-height: 100vh;
  padding: 2rem 1rem;
  place-items: center;
  color: #f7f9fc;
}

.callback-panel {
  display: grid;
  justify-items: center;
  width: min(100%, 24rem);
  padding: 2rem 1.25rem;
  text-align: center;
}

.spinner {
  width: 2.4rem;
  height: 2.4rem;
  margin-bottom: 1.25rem;
  border: 0.2rem solid rgba(247, 249, 252, 0.18);
  border-top-color: #69b4a5;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

.eyebrow {
  color: #69b4a5;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin-top: 0.45rem;
  font-size: 1.55rem;
  font-weight: 800;
}

.description,
.error-message {
  margin-top: 0.85rem;
  font-size: 0.88rem;
  line-height: 1.5;
}

.description {
  color: #c7d1de;
}

.error-message {
  color: #ffbaba;
}

.login-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 2.75rem;
  margin-top: 1.25rem;
  color: #071321;
  background: #69b4a5;
  border-radius: 0.7rem;
  font-size: 0.86rem;
  font-weight: 800;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
