import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref('')
  const email = ref('')
  const nickname = ref('')
  const profileImageUrl = ref('')

  const isLoggedIn = computed(() => Boolean(accessToken.value))

  function setAccessToken(token) {
    accessToken.value = token ?? ''
  }

  function setUser(user = {}) {
    email.value = user.email ?? ''
    nickname.value = user.nickname ?? ''
    profileImageUrl.value = user.profileImageUrl ?? ''
  }

  function setAuth({ token, user } = {}) {
    setAccessToken(token)
    setUser(user)
  }

  function clearAuth() {
    accessToken.value = ''
    email.value = ''
    nickname.value = ''
    profileImageUrl.value = ''
  }

  return {
    accessToken,
    email,
    nickname,
    profileImageUrl,
    isLoggedIn,
    setAccessToken,
    setUser,
    setAuth,
    clearAuth,
  }
})
