import axios from 'axios'
import { refreshAccessToken } from '@/services/authSession'
import { useAuthStore } from '@/stores/auth'

// 인증이 필요한 API 요청에 사용하는 Axios 인스턴스다.
export const privateApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
  },
})

// 토큰이 없다면 먼저 재발급하고 Authorization 헤더에 추가한다.
privateApiClient.interceptors.request.use(async (config) => {
  const authStore = useAuthStore()
  const token = authStore.accessToken || (await refreshAccessToken())

  config.headers.Authorization = `Bearer ${token}`

  return config
})

// 만료된 토큰으로 401이 발생하면 재발급 후 기존 요청을 한 번만 재시도한다.
privateApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const token = await refreshAccessToken()
      originalRequest.headers.Authorization = `Bearer ${token}`

      return privateApiClient(originalRequest)
    } catch (refreshError) {
      return Promise.reject(refreshError)
    }
  },
)
