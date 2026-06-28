import { privateApiClient } from "@/lib/http/privateApiClient";
import { publicApiClient } from "@/lib/http/publicApiClient";
import { del, get, post } from "@/lib/http/request";

// 장소 목록 조회 [get: /api/place]
export async function getPlaceList({ category, keyword, page, size } = {}) {
  return get(publicApiClient, "/api/place", {
    params: { category, keyword, page, size },
  });
}

// 장소 상세 정보 조회 [get: /api/place/{placeId}]
export async function getPlaceDetail(placeId) {
  return get(privateApiClient, `/api/place/${placeId}`);
}

// 장소 즐겨찾기 추가 [post: /api/place/{placeId}/favorite]
export async function postNewFavorite(placeId) {
  return post(privateApiClient, `/api/place/${placeId}/favorite`, undefined);
}

// 장소 즐겨찾기 삭제
export async function deleteFavorite(placeId) {
  return del(privateApiClient, `/api/place/${placeId}/favorite`, undefined);
}
