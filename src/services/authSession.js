import { useAuthStore } from '@/stores/auth'
import { postRefreshToken } from '@/api/auth'

let refreshPromise = null

// 로그인 또는 재발급 응답을 Pinia 메모리에 저장한다.
export function setAuthSession({ accessToken, user }) {
  useAuthStore().setAuth({
    token: accessToken,
    user,
  })
}

// Pinia에 저장된 인증 정보를 제거한다.
export function clearAuthSession() {
  useAuthStore().clearAuth()
}

// 동시에 여러 갱신 요청이 발생해도 하나의 요청만 사용한다.
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = postRefreshToken()
      .then((data) => {
        setAuthSession(data)
        return data.accessToken
      })
      .catch((error) => {
        clearAuthSession()
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

// 앱 시작 시 Refresh Token으로 기존 로그인 세션 복구를 시도한다.
export async function initializeAuthSession() {
  try {
    await refreshAccessToken()
  } catch {
    // Refresh Token이 없거나 만료된 경우 비로그인 상태로 앱을 시작한다.
  }
}
