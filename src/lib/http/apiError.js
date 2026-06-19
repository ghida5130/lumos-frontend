import axios from 'axios'
import { ERROR_CODE_MESSAGES, STATUS_MESSAGES } from './errorMessages'

// 컴포넌트와 TanStack Query에서 공통으로 사용하는 API 에러 객체다.
export class ApiError extends Error {
  constructor({ type = 'API_ERROR', statusCode = null, errorCode, message }) {
    super(message)
    this.name = 'ApiError'
    this.type = type
    this.statusCode = statusCode
    this.errorCode = errorCode
  }
}

// Axios 및 일반 오류를 앱에서 사용하는 ApiError 형태로 변환한다.
export function normalizeApiError(error) {
  if (error instanceof ApiError) {
    return error
  }

  if (!axios.isAxiosError(error)) {
    return new ApiError({
      type: 'CLIENT_ERROR',
      errorCode: 'CLIENT_ERROR',
      message: '화면 처리 중 오류가 발생했습니다.',
    })
  }

  if (axios.isCancel(error)) {
    return new ApiError({
      type: 'CANCELED_ERROR',
      errorCode: 'REQUEST_CANCELED',
      message: '요청이 취소되었습니다.',
    })
  }

  if (!error.response) {
    return new ApiError({
      type: 'NETWORK_ERROR',
      errorCode: 'NETWORK_ERROR',
      message: '서버에 연결할 수 없습니다.',
    })
  }

  const responseData = error.response.data
  const statusCode = responseData?.statusCode ?? error.response.status
  const errorCode =
    (typeof responseData?.error === 'string' ? responseData.error : responseData?.error?.code) ??
    'UNKNOWN_ERROR'

  return new ApiError({
    statusCode,
    errorCode,
    message:
      ERROR_CODE_MESSAGES[errorCode] ||
      responseData?.message ||
      STATUS_MESSAGES[statusCode] ||
      '알 수 없는 오류입니다.',
  })
}
