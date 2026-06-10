<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const setTestAuth = () => {
  authStore.setAuth({
    token: 'test-access-token',
    user: {
      email: 'test@example.com',
      nickname: 'test-user',
      profileImageUrl: '',
    },
  })
  router.push('/')
}
</script>

<template>
  <button type="button" @click="setTestAuth">테스트 로그인</button>
</template>

<style scoped>
button {
  display: block;
  margin: 0 auto;
  padding: 20px;
  background: black;
  border: 1px solid white;
  margin-top: 50px;
}
</style>
