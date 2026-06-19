import { privateApiClient } from '@/lib/http/privateApiClient'
import { del, get, patch, request } from '@/lib/http/request'

// 현재 로그인한 사용자의 정보를 조회한다.
export async function getUserInfo() {
  return get(privateApiClient, '/api/users/me')
}

// 현재 사용자가 즐겨찾기한 장소 목록을 조회한다.
export async function getUserFavorites() {
  return get(privateApiClient, '/api/users/me/favorite')
}

export async function getUserCourses() {
  return get(privateApiClient, '/api/users/me/course')
}

export async function getUserCourseDetail(courseId) {
  return get(privateApiClient, `/api/users/me/course/${courseId}`)
}

export async function patchUserInfo(body) {
  return patch(privateApiClient, '/api/users/me', body)
}

// 현재 로그인한 사용자의 계정을 삭제한다.
export async function deleteUser(body) {
  return request(privateApiClient, {
    method: 'delete',
    url: '/api/users/me',
    data: body,
  })
}
