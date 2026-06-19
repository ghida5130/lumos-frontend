import { privateApiClient } from '@/lib/http/privateApiClient'
import { publicApiClient } from '@/lib/http/publicApiClient'
import { get, post } from '@/lib/http/request'

export async function getPlaceReviews(placeId) {
  return get(publicApiClient, `/api/review/place/${placeId}`)
}

export async function getReviews({ page, size } = {}) {
  return get(publicApiClient, '/api/review', {
    params: { page, size },
  })
}

export async function postReviewLike(reviewId) {
  return post(privateApiClient, `/api/review/${reviewId}/like`, undefined)
}
