import axios from 'axios'

// 인증이 필요하지 않은 API 요청에 사용하는 Axios 인스턴스다.
export const publicApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
  },
})
