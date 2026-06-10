<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const email = ref('example@example.com')
const password = ref('password')

const loading = ref(false)
const logoutLoading = ref(false)

const responseData = ref(null)
const logoutResponse = ref(null)
const errorMessage = ref('')

const login = async () => {
  loading.value = true
  responseData.value = null
  errorMessage.value = ''

  try {
    const res = await fetch('https://api.nighttrip.site/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    })

    const data = await res.json()
    responseData.value = data

    if (!res.ok) {
      errorMessage.value = data.message
      return
    }

    authStore.setAuth({
      token: data.data?.accessToken,
      user: data.data?.user ?? data.data,
    })

    const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirectPath)
  } catch (error) {
    errorMessage.value = '요청 실패 또는 CORS 오류'
    console.error(error)
  } finally {
    loading.value = false
  }
}

const logout = async () => {
  logoutLoading.value = true
  logoutResponse.value = null
  errorMessage.value = ''

  try {
    const res = await fetch('https://api.nighttrip.site/api/auth/logout', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      credentials: 'include',
    })

    const data = await res.json().catch(() => null)
    logoutResponse.value = data

    if (!res.ok) {
      errorMessage.value = data?.message ?? '로그아웃 실패'
      return
    }

    authStore.clearAuth()
  } catch (error) {
    errorMessage.value = '로그아웃 요청 실패 또는 CORS 오류'
    console.error(error)
  } finally {
    logoutLoading.value = false
  }
}
</script>

<template>
  <main class="page">
    <h1>로그인 테스트</h1>

    <form class="form" @submit.prevent="login">
      <label>
        이메일
        <input v-model="email" type="email" />
      </label>

      <label>
        비밀번호
        <input v-model="password" type="password" />
      </label>

      <button type="submit" :disabled="loading">
        {{ loading ? '요청 중...' : '로그인 요청' }}
      </button>
    </form>

    <button
      class="logout-button"
      type="button"
      :disabled="logoutLoading || !authStore.accessToken"
      @click="logout"
    >
      {{ logoutLoading ? '로그아웃 중...' : '로그아웃 요청' }}
    </button>

    <p v-if="authStore.accessToken" class="token">accessToken 있음</p>

    <p v-if="errorMessage" class="error">
      {{ errorMessage }}
    </p>

    <section v-if="responseData" class="result">
      <h2>Login Response</h2>
      <pre>{{ responseData }}</pre>
    </section>

    <section v-if="logoutResponse" class="result">
      <h2>Logout Response</h2>
      <pre>{{ logoutResponse }}</pre>
    </section>
  </main>
</template>

<style scoped>
.page {
  max-width: 520px;
  margin: 40px auto;
  padding: 24px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

button {
  padding: 12px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.logout-button {
  width: 100%;
  margin-top: 12px;
}

.token {
  margin-top: 16px;
  color: green;
}

.error {
  margin-top: 16px;
  color: red;
}

.result {
  margin-top: 24px;
}

pre {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  overflow-x: auto;
}
</style>
