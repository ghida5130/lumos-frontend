import { privateApiClient } from '@/lib/http/privateApiClient'
import { publicApiClient } from '@/lib/http/publicApiClient'
import { get, post } from '@/lib/http/request'

// 로그인 후 Access Token과 사용자 정보를 받아온다.
export async function postLogin(body) {
  return post(publicApiClient, '/api/auth/login', body, {
    withCredentials: true,
  })
}

// HttpOnly Refresh Token 쿠키를 이용해 Access Token을 재발급한다.
export async function postRefreshToken() {
  return post(publicApiClient, '/api/auth/refresh', undefined, {
    withCredentials: true,
  })
}

// 서버의 Refresh Token을 제거해 로그인 세션을 종료한다.
export async function postLogout() {
  return post(privateApiClient, '/api/auth/logout', undefined, {
    withCredentials: true,
  })
}

// 회원가입 정보를 서버에 전송한다.
export async function postNewUser(body) {
  return post(publicApiClient, '/api/auth/signup', body)
}

export async function getEmailDuplicate(email) {
  return get(publicApiClient, '/api/auth/check-email', {
    params: { email },
  })
}

// 닉네임의 중복 여부를 조회한다.
export async function getNicknameDuplicate(nickname) {
  return get(publicApiClient, '/api/auth/check-nickname', {
    params: { nickname },
  })
}
