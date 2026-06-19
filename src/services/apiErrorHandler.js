import router from '@/router'
import { useErrorStore } from '@/stores/error'
import { clearAuthSession } from './authSession'
import { normalizeApiError } from '@/lib/http/apiError'

const SESSION_ERROR_CODES = new Set([
  'AUTH_001',
  'AUTH_003',
  'AUTH_004',
  'AUTH_005',
  'AUTH_008',
  'AUTH_009',
])

// 정규화된 에러를 인증 이동, 로컬 처리, 에러 페이지 이동으로 분기한다.
export function handleApiError(error, { mode = 'page' } = {}) {
  const apiError = normalizeApiError(error)

  if (apiError.type === 'CANCELED_ERROR' || mode === 'silent') {
    return apiError
  }

  const isSessionError =
    SESSION_ERROR_CODES.has(apiError.errorCode) || (apiError.statusCode === 401 && mode !== 'local')

  if (isSessionError) {
    clearAuthSession()

    if (router.currentRoute.value.name !== 'login') {
      router.replace({
        name: 'login',
        query: { redirect: router.currentRoute.value.fullPath },
      })
    }

    return apiError
  }

  if (mode === 'local') {
    return apiError
  }

  useErrorStore().setError({
    statusCode: apiError.statusCode,
    errorCode: apiError.errorCode,
    message: apiError.message,
    from: router.currentRoute.value.fullPath,
  })

  if (router.currentRoute.value.name !== 'error') {
    router.replace({ name: 'error' })
  }

  return apiError
}
