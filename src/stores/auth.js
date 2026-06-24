import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref('')
  const userId = ref(null)
  const email = ref('')
  const nickname = ref('')
  const provider = ref('')
  const profileImageUrl = ref('')
  const authStatusMessage = ref('')

  const isLoggedIn = computed(() => Boolean(accessToken.value))
  const isAuthStatusVisible = computed(() => Boolean(authStatusMessage.value))

  function setAccessToken(token) {
    accessToken.value = token ?? ''
  }

  function getUserId(user = {}) {
    return user.userId ?? user.id ?? user.memberId ?? null
  }

  function setUser(user = {}) {
    userId.value = getUserId(user)
    email.value = user.email ?? ''
    nickname.value = user.nickname ?? ''
    provider.value = user.provider ?? ''
    profileImageUrl.value = user.profileImageUrl ?? ''
  }

  function setAuth({ token, accessToken: nextAccessToken, user, ...userFields } = {}) {
    setAccessToken(token ?? nextAccessToken)

    setUser(user ?? userFields)
  }

  function clearAuth() {
    setAccessToken('')
    userId.value = null
    email.value = ''
    nickname.value = ''
    provider.value = ''
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
    userId,
    email,
    nickname,
    provider,
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
