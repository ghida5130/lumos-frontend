import axios from "axios";
import { privateApiClient } from "@/lib/http/privateApiClient";
import { publicApiClient } from "@/lib/http/publicApiClient";
import { del, get, patch, post } from "@/lib/http/request";

export async function getPlaceReviews(placeId, { authenticated = false } = {}) {
  const client = authenticated ? privateApiClient : publicApiClient;

  return get(client, `/api/review/place/${placeId}`);
}

export async function getReviews({ page, size, authenticated = false } = {}) {
  const client = authenticated ? privateApiClient : publicApiClient;

  return get(client, "/api/review", {
    params: { page, size },
  });
}

export async function postReviewLike(reviewId) {
  return post(privateApiClient, `/api/review/${reviewId}/like`, undefined);
}

export async function deleteReviewLike(reviewId) {
  return del(privateApiClient, `/api/review/${reviewId}/like`);
}

export async function postReview(placeId, body) {
  return post(privateApiClient, `/api/review/${placeId}`, body);
}

export async function patchReview(reviewId, body) {
  return patch(privateApiClient, `/api/review/${reviewId}`, body);
}

export async function deleteReview(reviewId) {
  return del(privateApiClient, `/api/review/${reviewId}`);
}

export async function uploadReviewImageToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dqjlznwtu";
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_REVIEW_UPLOAD_PRESET || "review_image";
  const folder = import.meta.env.VITE_CLOUDINARY_REVIEW_FOLDER || "review_image";
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    formData,
  );

  return response.data;
}
