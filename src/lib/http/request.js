import { normalizeApiError } from './apiError'

// Axios 요청을 실행하고 공통 응답의 data를 반환한다.
// 실패한 요청은 ApiError로 정규화해 다시 던진다.
export async function request(client, config, { unwrapData = true } = {}) {
  try {
    const response = await client(config)
    const responseBody = response.data

    if (import.meta.env.DEV) {
      console.log('[API RESPONSE]', {
        method: config.method?.toUpperCase(),
        url: config.url,
        status: response.status,
        body: responseBody,
      })
    }

    if (!unwrapData) {
      return responseBody
    }

    const data =
      responseBody !== null &&
      typeof responseBody === 'object' &&
      Object.hasOwn(responseBody, 'data')
        ? responseBody.data
        : responseBody

    return data
  } catch (error) {
    throw normalizeApiError(error)
  }
}

// GET 요청을 생성하는 공통 함수다.
export function get(client, url, config) {
  return request(client, {
    ...config,
    method: 'get',
    url,
  })
}

// POST 요청을 생성하는 공통 함수다.
export function post(client, url, data, config) {
  return request(client, {
    ...config,
    method: 'post',
    url,
    data,
  })
}

// PUT 요청을 생성하는 공통 함수다.
export function put(client, url, data, config) {
  return request(client, {
    ...config,
    method: 'put',
    url,
    data,
  })
}

// PATCH 요청을 생성하는 공통 함수다.
export function patch(client, url, data, config) {
  return request(client, {
    ...config,
    method: 'patch',
    url,
    data,
  })
}

// DELETE 요청을 생성하는 공통 함수다.
export function del(client, url, config) {
  return request(client, {
    ...config,
    method: 'delete',
    url,
  })
}
