import { privateApiClient } from '@/lib/http/privateApiClient'
import { publicApiClient } from '@/lib/http/publicApiClient'
import { get, post, request } from '@/lib/http/request'

// 공통 성공 응답 처리 흐름을 확인하는 테스트 요청이다.
export async function getApiTestSuccess() {
  return get(publicApiClient, '/api/test/success')
}

// 컴포넌트에서 직접 처리하는 비즈니스 에러를 확인한다.
export async function postDuplicateEmailTest(email) {
  return post(publicApiClient, '/api/test/duplicate-email', { email })
}

// 공통 에러 페이지 이동 흐름을 확인한다.
export async function getServerErrorTest() {
  return get(publicApiClient, '/api/test/server-error')
}

// 인증 오류 발생 시 로그인 이동 흐름을 확인한다.
export async function getAuthErrorTest() {
  return get(privateApiClient, '/api/test/auth-error')
}

// 선택한 메서드와 인증 방식으로 임의의 API 요청을 보내 결과를 확인한다.
export async function requestApiTest({ method, path, body, includeBearer }) {
  const client = includeBearer ? privateApiClient : publicApiClient

  return request(client, {
    method,
    url: path,
    data: method === 'get' ? undefined : body,
  }, {
    unwrapData: false,
  })
}

export async function requestMultipartApiTest({ method, path, formData }) {
  // Content-Type은 브라우저가 multipart boundary와 함께 자동으로 설정한다.
  return request(privateApiClient, {
    method,
    url: path,
    data: formData,
  }, {
    unwrapData: false,
  })
}
