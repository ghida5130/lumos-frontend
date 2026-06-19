import { privateApiClient } from '@/lib/http/privateApiClient'
import { post } from '@/lib/http/request'

export async function postCourseRecommend(body) {
  return post(privateApiClient, '/api/course/recommend', body, {
    timeout: 60000,
  })
}

export async function postCourse(body) {
  return post(privateApiClient, '/api/course', body)
}
