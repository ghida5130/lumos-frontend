import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref('')
  const email = ref('')
  const nickname = ref('')
  const profileImageUrl = ref('')
  const authStatusMessage = ref('')

  const isLoggedIn = computed(() => Boolean(accessToken.value))
  const isAuthStatusVisible = computed(() => Boolean(authStatusMessage.value))

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

    if (user) {
      setUser(user)
    }
  }

  function clearAuth() {
    setAccessToken('')
    email.value = ''
    nickname.value = ''
    profileImageUrl.value = ''
  }

  function setAuthStatus(message) {
    authStatusMessage.value = message
  }

  function clearAuthStatus() {
    authStatusMessage.value = ''
  }

  return {
    accessToken,
    email,
    nickname,
    profileImageUrl,
    authStatusMessage,
    isLoggedIn,
    isAuthStatusVisible,
    setAccessToken,
    setUser,
    setAuth,
    clearAuth,
    setAuthStatus,
    clearAuthStatus,
  }
})
