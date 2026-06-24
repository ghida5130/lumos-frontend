<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { deleteFavorite, getPlaceDetail, postNewFavorite } from "@/api/place";
import {
  deleteReviewLike,
  deleteReview,
  getPlaceReviews,
  patchReview,
  postReview,
  postReviewLike,
  uploadReviewImageToCloudinary,
} from "@/api/review";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { getPlaceImage } from "@/utils/placeImage";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const route = useRoute();
const authStore = useAuthStore();
const toastStore = useToastStore();

const place = ref(null);
const reviews = ref([]);
const reviewTotalCount = ref(0);
const isLoading = ref(false);
const errorMessage = ref("");
const pendingReviewLikes = ref(new Set());
const isUpdatingFavorite = ref(false);
const showReviewDialog = ref(false);
const deletingReview = ref(null);
const showReviewCalendar = ref(false);
const editingReview = ref(null);
const reviewVisitDate = ref("");
const reviewContent = ref("");
const reviewImageFiles = ref([]);
const reviewImagePreviews = ref([]);
const reviewCalendarCursor = ref(new Date());
const isSubmittingReview = ref(false);
const isDeletingReview = ref(false);

const reviewCountLabel = computed(() => reviewTotalCount.value || place.value?.reviewCount || 0);
const isReviewEditMode = computed(() => Boolean(editingReview.value));
const canSubmitReview = computed(
  () =>
    (isReviewEditMode.value || reviewVisitDate.value) &&
    reviewContent.value.trim().length > 0 &&
    !isSubmittingReview.value,
);
const reviewCalendarTitle = computed(() =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(reviewCalendarCursor.value),
);
const reviewCalendarDays = computed(() => {
  const year = reviewCalendarCursor.value.getFullYear();
  const month = reviewCalendarCursor.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    days.push(null);
  }

  for (let date = 1; date <= lastDay.getDate(); date += 1) {
    const day = new Date(year, month, date);

    days.push({
      date,
      value: formatDate(day),
      isToday: formatDate(day) === formatDate(new Date()),
    });
  }

  return days;
});

function formatHours(openingTime, closingTime) {
  if (!openingTime && !closingTime) {
    return "영업시간 정보 없음";
  }

  return `${openingTime ?? "-"} - ${closingTime ?? "-"}`;
}

function getAvatarName(nickname) {
  return nickname?.trim()?.slice(0, 1) || "?";
}

function formatCreatedAt(createdAt) {
  if (!createdAt) {
    return "";
  }

  return createdAt.replace("T", " ").slice(0, 16);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function mapPlace(placeData) {
  const tags = placeData.tags ?? [];
  const categories = [placeData.category, ...tags].filter(Boolean);

  return {
    id: placeData.placeId,
    title: placeData.name,
    image: getPlaceImage(placeData.imageUrl, placeData.category, placeData.placeId),
    categories,
    description: placeData.description,
    address: placeData.roadAddress || placeData.address,
    addressDetail: placeData.roadAddress ? placeData.address : "",
    phone: placeData.phone || "전화번호 정보 없음",
    hours: formatHours(placeData.openingTime, placeData.closingTime),
    likeCount: placeData.likeCount ?? 0,
    reviewCount: placeData.reviewCount ?? 0,
    isFavorite: Boolean(placeData.isFavorite),
  };
}

function getReviewUserId(reviewData = {}) {
  return (
    reviewData.userId ??
    reviewData.memberId ??
    reviewData.writerId ??
    reviewData.authorId ??
    reviewData.user?.userId ??
    reviewData.user?.id ??
    null
  );
}

function mapReview(reviewData) {
  return {
    id: reviewData.reviewId,
    userId: getReviewUserId(reviewData),
    author: reviewData.nickname || "익명",
    avatar: getAvatarName(reviewData.nickname),
    content: reviewData.content,
    likeCount: reviewData.likeCount ?? 0,
    likedByMe: Boolean(reviewData.likedByMe),
    createdAt: formatCreatedAt(reviewData.createdAt),
    createdAtDateTime: reviewData.createdAt,
    imageUrls: reviewData.imageUrls ?? [],
  };
}

function isLocalPreview(preview) {
  return preview.source === "local";
}

function canEditReview(review) {
  return (
    !review.isLocal &&
    authStore.userId !== null &&
    review.userId !== null &&
    String(review.userId) === String(authStore.userId)
  );
}

function resetReviewForm() {
  reviewVisitDate.value = "";
  reviewContent.value = "";
  reviewImageFiles.value = [];
  showReviewCalendar.value = false;
  editingReview.value = null;

  reviewImagePreviews.value
    .filter(isLocalPreview)
    .forEach((preview) => URL.revokeObjectURL(preview.url));
  reviewImagePreviews.value = [];
}

function openReviewDialog() {
  if (!authStore.isLoggedIn) {
    toastStore.warning("로그인이 필요합니다.");
    return;
  }

  resetReviewForm();
  reviewCalendarCursor.value = new Date();
  showReviewDialog.value = true;
}

function openReviewEditDialog(review) {
  if (!authStore.isLoggedIn) {
    toastStore.warning("로그인이 필요합니다.");
    return;
  }

  if (!canEditReview(review)) {
    return;
  }

  resetReviewForm();
  editingReview.value = review;
  reviewContent.value = review.content;
  reviewImagePreviews.value = review.imageUrls.map((imageUrl, index) => ({
    id: `${review.id}-remote-${index}`,
    name: `리뷰 이미지 ${index + 1}`,
    url: imageUrl,
    source: "remote",
  }));
  showReviewDialog.value = true;
}

function openReviewDeleteDialog(review) {
  if (!authStore.isLoggedIn) {
    toastStore.warning("로그인이 필요합니다.");
    return;
  }

  if (!canEditReview(review)) {
    return;
  }

  deletingReview.value = review;
}

function closeReviewDeleteDialog() {
  if (isDeletingReview.value) {
    return;
  }

  deletingReview.value = null;
}

function closeReviewDialog({ force = false } = {}) {
  if (isSubmittingReview.value && !force) {
    return;
  }

  showReviewDialog.value = false;
  resetReviewForm();
}

async function confirmDeleteReview() {
  if (!deletingReview.value || isDeletingReview.value) {
    return;
  }

  const targetReview = deletingReview.value;
  isDeletingReview.value = true;
  toastStore.info("리뷰를 삭제하는 중입니다.");

  try {
    await deleteReview(targetReview.id);

    reviews.value = reviews.value.filter((review) => review.id !== targetReview.id);
    reviewTotalCount.value = Math.max(0, reviewTotalCount.value - 1);

    if (place.value) {
      place.value.reviewCount = Math.max(0, place.value.reviewCount - 1);
    }

    toastStore.success("리뷰가 삭제되었습니다.");
    deletingReview.value = null;
  } catch (error) {
    if (error.statusCode === 401) {
      toastStore.warning("로그인이 필요합니다.");
    } else {
      toastStore.error("리뷰 삭제에 실패했습니다.");
    }
  } finally {
    isDeletingReview.value = false;
  }
}

function moveReviewCalendar(monthOffset) {
  const nextDate = new Date(reviewCalendarCursor.value);

  nextDate.setMonth(nextDate.getMonth() + monthOffset);
  reviewCalendarCursor.value = nextDate;
}

function selectReviewDate(date) {
  reviewVisitDate.value = date;
  showReviewCalendar.value = false;
}

function handleReviewImageChange(event) {
  const files = Array.from(event.target.files ?? []);
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));

  if (files.length !== imageFiles.length) {
    toastStore.warning("이미지 파일만 업로드할 수 있습니다.");
  }

  reviewImagePreviews.value
    .filter(isLocalPreview)
    .forEach((preview) => URL.revokeObjectURL(preview.url));
  reviewImageFiles.value = imageFiles;
  reviewImagePreviews.value = imageFiles.map((file) => ({
    id: `${file.name}-${file.lastModified}-${file.size}`,
    name: file.name,
    url: URL.createObjectURL(file),
    source: "local",
  }));
  event.target.value = "";
}

async function getSubmittedReviewImageUrls() {
  if (!reviewImageFiles.value.length) {
    return reviewImagePreviews.value.map((preview) => preview.url);
  }

  const imageUrls = await Promise.all(
    reviewImageFiles.value.map(async (file) => {
      const uploadResult = await uploadReviewImageToCloudinary(file);

      return uploadResult.secure_url ?? uploadResult.url;
    }),
  );

  return imageUrls.filter(Boolean);
}

async function submitReview() {
  if ((!place.value?.id && !isReviewEditMode.value) || !canSubmitReview.value) {
    return;
  }

  isSubmittingReview.value = true;
  toastStore.info(
    isReviewEditMode.value ? "리뷰를 수정하는 중입니다." : "리뷰를 등록하는 중입니다.",
  );

  try {
    const imageUrls = await getSubmittedReviewImageUrls();
    const trimmedContent = reviewContent.value.trim();

    if (isReviewEditMode.value) {
      const targetReviewId = editingReview.value.id;

      await patchReview(targetReviewId, {
        content: trimmedContent,
        imageUrls,
      });

      reviews.value = reviews.value.map((review) =>
        review.id === targetReviewId
          ? {
              ...review,
              content: trimmedContent,
              imageUrls,
            }
          : review,
      );

      toastStore.success("리뷰가 수정되었습니다.");
      closeReviewDialog({ force: true });
      return;
    }

    await postReview(place.value.id, {
      visitDate: reviewVisitDate.value,
      content: trimmedContent,
      imageUrls,
    });

    reviews.value = [
      {
        id: `local-${Date.now()}`,
        userId: authStore.userId,
        author: authStore.nickname || "익명",
        avatar: getAvatarName(authStore.nickname),
        content: trimmedContent,
        likeCount: 0,
        likedByMe: false,
        createdAt: reviewVisitDate.value,
        createdAtDateTime: reviewVisitDate.value,
        imageUrls,
        isLocal: true,
      },
      ...reviews.value,
    ];
    reviewTotalCount.value += 1;

    if (place.value) {
      place.value.reviewCount += 1;
    }

    toastStore.success("리뷰가 등록되었습니다.");
    closeReviewDialog({ force: true });
  } catch (error) {
    if (error.statusCode === 401) {
      toastStore.warning("로그인이 필요합니다.");
    } else {
      toastStore.error(
        isReviewEditMode.value ? "리뷰 수정에 실패했습니다." : "리뷰 등록에 실패했습니다.",
      );
    }
  } finally {
    isSubmittingReview.value = false;
  }
}

async function loadPlaceDetails(id) {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const [placeData, reviewData] = await Promise.all([
      getPlaceDetail(id),
      getPlaceReviews(id, { authenticated: authStore.isLoggedIn }),
    ]);

    place.value = mapPlace(placeData);
    reviews.value = (reviewData.content ?? []).map(mapReview);
    reviewTotalCount.value = reviewData.totalElements ?? reviews.value.length;
  } catch {
    place.value = null;
    reviews.value = [];
    reviewTotalCount.value = 0;
    errorMessage.value = "여행지 상세 정보를 불러오지 못했습니다.";
  } finally {
    isLoading.value = false;
  }
}

async function togglePlaceFavorite() {
  if (!place.value?.id || isUpdatingFavorite.value) {
    return;
  }

  isUpdatingFavorite.value = true;

  try {
    if (place.value.isFavorite) {
      await deleteFavorite(place.value.id);
      place.value.isFavorite = false;
      place.value.likeCount = Math.max(0, place.value.likeCount - 1);
      toastStore.success("즐겨찾기에서 제거되었습니다.");
      return;
    }

    await postNewFavorite(place.value.id);
    place.value.isFavorite = true;
    place.value.likeCount += 1;
    toastStore.success("즐겨찾기에 추가되었습니다.");
  } catch (error) {
    if (error.statusCode === 401) {
      toastStore.warning("로그인이 필요합니다.");
    } else if (error.statusCode === 409) {
      place.value.isFavorite = true;
      toastStore.info("이미 즐겨찾기에 추가된 장소입니다.");
    } else if (error.statusCode === 404) {
      toastStore.error("존재하지 않는 장소입니다.");
    } else {
      toastStore.error(
        place.value.isFavorite ? "즐겨찾기 제거에 실패했습니다." : "즐겨찾기 추가에 실패했습니다.",
      );
    }
  } finally {
    isUpdatingFavorite.value = false;
  }
}

async function toggleReviewLike(reviewId) {
  if (pendingReviewLikes.value.has(reviewId)) {
    return;
  }

  const targetReview = reviews.value.find((review) => review.id === reviewId);

  if (!targetReview) {
    return;
  }

  const previousLikeCount = targetReview.likeCount;
  const previousLikedByMe = targetReview.likedByMe;
  pendingReviewLikes.value = new Set([...pendingReviewLikes.value, reviewId]);
  targetReview.likedByMe = !previousLikedByMe;
  targetReview.likeCount = Math.max(0, targetReview.likeCount + (previousLikedByMe ? -1 : 1));

  try {
    if (previousLikedByMe) {
      await deleteReviewLike(reviewId);
      toastStore.success("리뷰 좋아요가 취소되었습니다.");
    } else {
      await postReviewLike(reviewId);
      toastStore.success("리뷰 좋아요가 추가되었습니다.");
    }
  } catch (error) {
    targetReview.likeCount = previousLikeCount;
    targetReview.likedByMe = previousLikedByMe;

    if (error.statusCode === 401) {
      toastStore.warning("로그인이 필요합니다.");
    } else if (error.statusCode === 409) {
      toastStore.info(
        previousLikedByMe ? "이미 좋아요가 취소되었습니다." : "이미 좋아요 처리되었습니다.",
      );
    } else if (error.statusCode === 500) {
      toastStore.error("서버 내부 오류가 발생했습니다.");
    } else {
      toastStore.error(
        previousLikedByMe ? "리뷰 좋아요 취소에 실패했습니다." : "리뷰 좋아요 처리에 실패했습니다.",
      );
    }
  } finally {
    const nextPendingLikes = new Set(pendingReviewLikes.value);
    nextPendingLikes.delete(reviewId);
    pendingReviewLikes.value = nextPendingLikes;
  }
}

watch(
  () => route.query.id,
  (id) => loadPlaceDetails(String(id ?? "1")),
  { immediate: true },
);

onBeforeUnmount(() => {
  reviewImagePreviews.value
    .filter(isLocalPreview)
    .forEach((preview) => URL.revokeObjectURL(preview.url));
});
</script>

<template>
  <main class="detail-view">
    <section v-if="isLoading" class="detail-skeleton" aria-label="여행지 상세 로딩 중">
      <span class="detail-skeleton-hero"></span>
      <div class="detail-skeleton-content">
        <article class="detail-skeleton-card">
          <i></i>
          <i></i>
          <i></i>
          <i></i>
        </article>
        <article v-for="index in 2" :key="index" class="review-skeleton-card">
          <span></span>
          <div>
            <i></i>
            <i></i>
          </div>
        </article>
      </div>
    </section>
    <p v-else-if="errorMessage" class="state-message">{{ errorMessage }}</p>

    <template v-else-if="place">
      <figure class="hero-image">
        <img v-if="place.image" :src="place.image" :alt="place.title" />
      </figure>

      <div class="detail-content">
        <article class="place-detail-card">
          <ul class="category-list">
            <li v-for="category in place.categories" :key="category">#{{ category }}</li>
          </ul>

          <div class="title-row">
            <h2>{{ place.title }}</h2>
            <span class="place-like-count" aria-label="좋아요 수">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M20.8 4.6c-1.9-1.8-4.9-1.7-6.7.2L12 7l-2.1-2.2C8.1 2.9 5.1 2.8 3.2 4.6 1.1 6.6 1 9.9 3 12l9 8.7 9-8.7c2-2.1 1.9-5.4-.2-7.4Z"
                />
              </svg>
              {{ place.likeCount }}
            </span>
          </div>

          <section class="description-section">
            <h3>소개</h3>
            <p>{{ place.description }}</p>
          </section>

          <address class="place-information">
            <div>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
                <circle cx="12" cy="10" r="2" />
              </svg>
              <span>
                <strong>주소</strong>
                {{ place.address }}
                <small v-if="place.addressDetail">{{ place.addressDetail }}</small>
              </span>
            </div>
            <div>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6.6 3h3l1.5 4-2 1.2a15 15 0 0 0 6.7 6.7l1.2-2 4 1.5v3c0 .9-.7 1.6-1.6 1.6C11.4 19 5 12.6 5 4.6 5 3.7 5.7 3 6.6 3Z"
                />
              </svg>
              <span>
                <strong>전화번호</strong>
                {{ place.phone }}
              </span>
            </div>
            <div>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 7v5l3 2" />
              </svg>
              <span>
                <strong>영업시간</strong>
                {{ place.hours }}
              </span>
            </div>
          </address>
        </article>
        <button
          class="favorite-button"
          :class="{ 'favorite-button--remove': place.isFavorite }"
          type="button"
          :disabled="isUpdatingFavorite"
          @click="togglePlaceFavorite"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-4-7 4V4Z" />
          </svg>
          {{ place.isFavorite ? "즐겨찾기 제거" : "즐겨찾기 추가" }}
        </button>

        <section class="review-section">
          <header class="review-heading">
            <h2>
              리뷰 <span>({{ reviewCountLabel }})</span>
            </h2>
            <button class="review-write-button" type="button" @click="openReviewDialog">
              리뷰 작성
            </button>
          </header>

          <p v-if="!reviews.length" class="empty-review-message">등록된 리뷰가 없습니다.</p>

          <article v-for="review in reviews" :key="review.id" class="review-card">
            <header>
              <span class="review-avatar">{{ review.avatar }}</span>
              <div class="review-meta">
                <strong>{{ review.author }}</strong>
                <time v-if="review.createdAt" :datetime="review.createdAtDateTime">{{
                  review.createdAt
                }}</time>
              </div>
              <div class="review-like-actions" aria-label="리뷰 좋아요">
                <button
                  v-if="canEditReview(review)"
                  class="review-edit-button"
                  type="button"
                  @click="openReviewEditDialog(review)"
                >
                  수정
                </button>
                <button
                  v-if="canEditReview(review)"
                  class="review-delete-button"
                  type="button"
                  @click="openReviewDeleteDialog(review)"
                >
                  삭제
                </button>
                <span class="review-like-count">{{ review.likeCount }}</span>
                <button
                  class="review-like-button"
                  :class="{ 'review-like-button--active': review.likedByMe }"
                  type="button"
                  :disabled="review.isLocal || pendingReviewLikes.has(review.id)"
                  @click="toggleReviewLike(review.id)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M20.8 4.6c-1.9-1.8-4.9-1.7-6.7.2L12 7l-2.1-2.2C8.1 2.9 5.1 2.8 3.2 4.6 1.1 6.6 1 9.9 3 12l9 8.7 9-8.7c2-2.1 1.9-5.4-.2-7.4Z"
                    />
                  </svg>
                </button>
              </div>
            </header>
            <p>{{ review.content }}</p>
            <ul v-if="review.imageUrls.length" class="review-image-list">
              <li v-for="imageUrl in review.imageUrls" :key="imageUrl">
                <img :src="imageUrl" alt="리뷰 이미지" />
              </li>
            </ul>
          </article>
        </section>
      </div>
    </template>

    <div v-if="showReviewDialog" class="review-dialog-backdrop" @click.self="closeReviewDialog">
      <article class="review-dialog" role="dialog" aria-modal="true">
        <header class="review-dialog-header">
          <div>
            <h3>{{ isReviewEditMode ? "리뷰 수정" : "리뷰 작성" }}</h3>
            <p>
              {{ isReviewEditMode ? "리뷰 내용과 이미지를 수정할 수 있습니다." : place?.title }}
            </p>
          </div>
          <button type="button" aria-label="닫기" @click="closeReviewDialog">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div class="review-dialog-body">
          <section v-if="!isReviewEditMode" class="review-form-field">
            <span>방문 날짜</span>
            <button
              class="date-select-button"
              type="button"
              @click="showReviewCalendar = !showReviewCalendar"
            >
              {{ reviewVisitDate || "날짜 선택" }}
            </button>

            <section v-if="showReviewCalendar" class="review-calendar-panel">
              <header class="review-calendar-header">
                <button type="button" aria-label="이전 달" @click="moveReviewCalendar(-1)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <strong>{{ reviewCalendarTitle }}</strong>
                <button type="button" aria-label="다음 달" @click="moveReviewCalendar(1)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </header>

              <div class="review-calendar-weekdays">
                <span v-for="weekday in WEEKDAY_LABELS" :key="weekday">{{ weekday }}</span>
              </div>

              <div class="review-calendar-grid">
                <template
                  v-for="(day, index) in reviewCalendarDays"
                  :key="day?.value ?? `empty-${index}`"
                >
                  <span v-if="!day"></span>
                  <button
                    v-else
                    type="button"
                    :class="{ today: day.isToday, selected: day.value === reviewVisitDate }"
                    @click="selectReviewDate(day.value)"
                  >
                    {{ day.date }}
                  </button>
                </template>
              </div>
            </section>
          </section>

          <label class="review-form-field">
            <span>내용</span>
            <textarea
              v-model="reviewContent"
              rows="5"
              placeholder="이 장소에서의 경험을 남겨주세요."
              :disabled="isSubmittingReview"
            ></textarea>
          </label>

          <label class="review-form-field">
            <span>이미지</span>
            <input
              type="file"
              accept="image/*"
              multiple
              :disabled="isSubmittingReview"
              @change="handleReviewImageChange"
            />
          </label>

          <ul v-if="reviewImagePreviews.length" class="review-preview-list">
            <li v-for="preview in reviewImagePreviews" :key="preview.id">
              <img :src="preview.url" :alt="preview.name" />
            </li>
          </ul>
        </div>

        <footer class="review-dialog-footer">
          <button type="button" class="review-cancel-button" @click="closeReviewDialog">
            취소
          </button>
          <button
            type="button"
            class="review-submit-button"
            :disabled="!canSubmitReview"
            @click="submitReview"
          >
            {{
              isSubmittingReview
                ? isReviewEditMode
                  ? "수정 중..."
                  : "등록 중..."
                : isReviewEditMode
                  ? "수정하기"
                  : "등록하기"
            }}
          </button>
        </footer>
      </article>
    </div>

    <div v-if="deletingReview" class="review-delete-backdrop" @click.self="closeReviewDeleteDialog">
      <article class="review-delete-dialog" role="dialog" aria-modal="true">
        <header>
          <h3>리뷰 삭제</h3>
          <p>이 리뷰를 삭제하시겠습니까?</p>
        </header>
        <p class="review-delete-preview">{{ deletingReview.content }}</p>
        <footer>
          <button type="button" class="review-cancel-button" @click="closeReviewDeleteDialog">
            취소
          </button>
          <button
            type="button"
            class="review-delete-confirm-button"
            :disabled="isDeletingReview"
            @click="confirmDeleteReview"
          >
            {{ isDeletingReview ? "삭제 중..." : "삭제" }}
          </button>
        </footer>
      </article>
    </div>
  </main>
</template>

<style scoped>
.detail-view {
  min-height: calc(100vh - 3rem);
  padding-bottom: 6.5rem;
  color: #f7f9fc;
}

.state-message {
  padding: 3rem 1rem;
  color: #91a0b4;
  text-align: center;
}

.detail-skeleton {
  animation: detailIn 0.22s ease both;
}

.detail-skeleton-hero {
  display: block;
  width: min(100%, 48rem);
  aspect-ratio: 16 / 8;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.075);
}

.detail-skeleton-content {
  display: grid;
  gap: 0.75rem;
  width: min(calc(100% - 1.25rem), 38rem);
  margin: 1rem auto 0;
}

.detail-skeleton-card,
.review-skeleton-card {
  background: rgba(9, 13, 20, 0.92);
  border: 1px solid #24303f;
  border-radius: 0.75rem;
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.15);
}

.detail-skeleton-card {
  display: grid;
  gap: 0.65rem;
  padding: 1rem;
}

.detail-skeleton-card i,
.review-skeleton-card span,
.review-skeleton-card i,
.detail-skeleton-hero {
  position: relative;
  overflow: hidden;
}

.detail-skeleton-card i,
.review-skeleton-card i {
  height: 0.75rem;
  background: rgba(255, 255, 255, 0.075);
  border-radius: 0.45rem;
}

.detail-skeleton-card i:nth-child(1) {
  width: 34%;
}

.detail-skeleton-card i:nth-child(2) {
  width: 72%;
  height: 1rem;
}

.detail-skeleton-card i:nth-child(3) {
  width: 100%;
}

.detail-skeleton-card i:nth-child(4) {
  width: 58%;
}

.review-skeleton-card {
  display: grid;
  grid-template-columns: 1.65rem minmax(0, 1fr);
  gap: 0.65rem;
  padding: 0.8rem;
}

.review-skeleton-card span {
  width: 1.45rem;
  height: 1.45rem;
  background: rgba(255, 255, 255, 0.075);
  border-radius: 50%;
}

.review-skeleton-card div {
  display: grid;
  gap: 0.55rem;
}

.review-skeleton-card i:first-child {
  width: 42%;
}

.review-skeleton-card i:last-child {
  width: 88%;
}

.detail-skeleton-hero::after,
.detail-skeleton-card i::after,
.review-skeleton-card span::after,
.review-skeleton-card i::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  content: "";
  animation: skeletonSweep 1.25s ease-in-out infinite;
}

@keyframes skeletonSweep {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
}

@keyframes detailIn {
  from {
    opacity: 0;
    transform: translateY(0.35rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-image {
  width: min(100%, 48rem);
  aspect-ratio: 16 / 8;
  margin: 0 auto;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(70, 103, 130, 0.2), rgba(12, 22, 35, 0.06)), #0e1826;
}

.hero-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-content {
  width: min(calc(100% - 1.25rem), 38rem);
  margin: 1rem auto 0;
}

.place-detail-card,
.review-card {
  background: rgba(9, 13, 20, 0.92);
  border: 1px solid #24303f;
  border-radius: 0.75rem;
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.15);
}

.place-detail-card {
  padding: 1rem;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.category-list li {
  padding: 0.3rem 0.55rem;
  background: rgba(72, 207, 255, 0.1);
  border-radius: 999px;
  font-size: 0.68rem;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.85rem;
}

.title-row h2 {
  min-width: 0;
  font-size: 1.3rem;
  font-weight: 700;
}

.place-like-count,
.review-like-button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.3rem;
}

.place-like-count {
  color: #e8f8ff;
  font-size: 0.9rem;
  font-weight: 700;
}

.place-like-count svg,
.review-like-button svg {
  width: 0.95rem;
  fill: #ff6f9f;
}

.description-section {
  margin-top: 0.85rem;
}

.description-section h3,
.place-information strong {
  display: block;
  margin-bottom: 0.45rem;
  color: #72d3ff;
  font-size: 0.72rem;
  font-weight: 600;
}

.description-section p {
  color: #c4ced9;
  font-size: 0.86rem;
  line-height: 1.65;
}

.place-information {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #314258;
  font-style: normal;
}

.place-information div {
  display: flex;
  gap: 0.65rem;
  color: #d1dae4;
  font-size: 0.78rem;
  line-height: 1.45;
}

.place-information svg {
  flex: 0 0 auto;
  width: 1rem;
  fill: none;
  stroke: #72d3ff;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.place-information small {
  display: block;
  margin-top: 0.2rem;
  color: #7e8b9d;
  font-size: 0.66rem;
}

.review-section {
  margin-top: 1.2rem;
}

.review-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.7rem;
}

.review-heading h2 {
  color: #8cddff;
  font-size: 1.15rem;
  font-weight: 600;
}

.review-heading h2 span {
  color: #91a0b4;
  font-size: 0.75rem;
  font-weight: 400;
}

.review-write-button {
  flex: 0 0 auto;
  min-height: 2.2rem;
  padding: 0 0.85rem;
  color: #071321;
  background: #8cddff;
  border-radius: 999px;
  box-shadow: 0 0.35rem 0.9rem rgba(72, 207, 255, 0.18);
  font-size: 0.74rem;
  font-weight: 800;
}

.empty-review-message {
  padding: 1rem;
  color: #91a0b4;
  font-size: 0.82rem;
  text-align: center;
}

.review-card {
  margin-bottom: 0.7rem;
  padding: 0.8rem;
}

.review-card header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.review-avatar {
  display: grid;
  flex: 0 0 auto;
  width: 1.45rem;
  height: 1.45rem;
  place-items: center;
  color: #bcecff;
  background: #263c4b;
  border-radius: 50%;
  font-size: 0.7rem;
}

.review-meta {
  flex: 1;
  min-width: 0;
}

.review-meta strong {
  display: block;
  overflow: hidden;
  font-size: 0.75rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-meta time {
  display: block;
  margin-top: 0.2rem;
  color: #77869a;
  font-size: 0.66rem;
}

.review-like-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  margin-left: auto;
}

.review-like-count {
  color: #e8f8ff;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
}

.review-edit-button {
  min-height: 2rem;
  padding: 0 0.68rem;
  color: #dbe8f2;
  background: rgba(255, 255, 255, 0.075);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
}

.review-delete-button {
  min-height: 2rem;
  padding: 0 0.68rem;
  color: #ffced7;
  background: rgba(255, 111, 159, 0.1);
  border: 1px solid rgba(255, 111, 159, 0.18);
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
}

.review-like-button {
  min-height: 2rem;
  padding: 0 0.7rem;
  color: #071321;
  background: #8cddff;
  border: 1px solid rgba(140, 221, 255, 0.8);
  border-radius: 999px;
  box-shadow: 0 0.35rem 0.9rem rgba(72, 207, 255, 0.22);
  font-size: 0.72rem;
  font-weight: 700;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.review-like-button svg {
  width: 0.82rem;
  fill: #071321;
}

.review-like-button--active {
  color: #fff7fa;
  background: #ff6f9f;
  border-color: rgba(255, 111, 159, 0.85);
  box-shadow: 0 0.45rem 1rem rgba(255, 111, 159, 0.24);
}

.review-like-button--active svg {
  fill: currentColor;
}

.review-like-button:hover {
  background: #a8e7ff;
  box-shadow: 0 0.45rem 1rem rgba(72, 207, 255, 0.3);
}

.review-like-button--active:hover {
  background: #ff86ad;
  box-shadow: 0 0.5rem 1.1rem rgba(255, 111, 159, 0.3);
}

.review-like-button:active {
  transform: scale(0.97);
}

.review-like-button:disabled {
  cursor: wait;
  opacity: 0.68;
  transform: none;
}

.review-card p {
  margin-top: 0.65rem;
  color: #bdc7d2;
  font-size: 0.8rem;
  line-height: 1.55;
}

.review-image-list,
.review-preview-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
  margin-top: 0.7rem;
}

.review-image-list li,
.review-preview-list li {
  overflow: hidden;
  aspect-ratio: 1;
  background: #121a25;
  border: 1px solid #314258;
  border-radius: 0.55rem;
}

.review-image-list img,
.review-preview-list img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.favorite-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  min-height: 2.8rem;
  margin-top: 1.35rem;
  color: #07111d;
  background: #8cddff;
  border-radius: 999px;
  box-shadow: 0 0.5rem 1.5rem rgba(72, 207, 255, 0.22);
  font-size: 0.86rem;
  font-weight: 600;
}

.favorite-button svg {
  width: 0.85rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

.favorite-button--remove {
  color: #ffedf2;
  background: rgba(255, 111, 159, 0.16);
  border: 1px solid rgba(255, 111, 159, 0.26);
  box-shadow: none;
}

.favorite-button:disabled {
  cursor: default;
  opacity: 0.62;
}

.review-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  padding: 1rem;
  background: rgba(3, 8, 14, 0.64);
  place-items: center;
  backdrop-filter: blur(0.35rem);
}

.review-dialog {
  width: min(100%, 32rem);
  max-height: min(90vh, 44rem);
  overflow-y: auto;
  color: #f7f9fc;
  background: #111c29;
  border: 1px solid rgba(199, 214, 229, 0.16);
  border-radius: 1rem;
  box-shadow: 0 1.3rem 3rem rgba(0, 0, 0, 0.38);
  animation: detailIn 0.22s ease both;
}

.review-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1rem 0.8rem;
}

.review-dialog-header h3 {
  font-size: 1rem;
  font-weight: 850;
}

.review-dialog-header p {
  margin-top: 0.35rem;
  color: #91a0b4;
  font-size: 0.72rem;
}

.review-dialog-header > button {
  display: grid;
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  color: #dbe4ee;
  background: rgba(255, 255, 255, 0.075);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  place-items: center;
}

.review-dialog-header svg {
  width: 0.9rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.8;
}

.review-dialog-body {
  display: grid;
  gap: 0.9rem;
  padding: 0 1rem 1rem;
}

.review-form-field {
  display: grid;
  gap: 0.5rem;
}

.review-form-field > span {
  color: #d6dfeb;
  font-size: 0.72rem;
  font-weight: 750;
}

.date-select-button,
.review-form-field textarea,
.review-form-field input[type="file"] {
  width: 100%;
  color: #f7f9fc;
  background: #121a25;
  border: 1px solid #314258;
  border-radius: 0.65rem;
  font-size: 0.82rem;
}

.date-select-button {
  min-height: 2.75rem;
  padding: 0 0.85rem;
  text-align: left;
}

.review-form-field textarea {
  min-height: 8rem;
  padding: 0.8rem 0.85rem;
  line-height: 1.5;
  resize: vertical;
}

.review-form-field textarea::placeholder {
  color: #657286;
}

.review-form-field input[type="file"] {
  min-height: 2.75rem;
  padding: 0.7rem 0.85rem;
}

.review-calendar-panel {
  padding: 0.8rem;
  background: rgba(7, 19, 33, 0.54);
  border: 1px solid rgba(126, 143, 165, 0.16);
  border-radius: 0.85rem;
}

.review-calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.review-calendar-header strong {
  color: #eef4fb;
  font-size: 0.9rem;
  font-weight: 800;
}

.review-calendar-header button {
  display: grid;
  width: 2rem;
  height: 2rem;
  color: #dbe4ee;
  background: rgba(255, 255, 255, 0.065);
  border-radius: 50%;
  place-items: center;
}

.review-calendar-header svg {
  width: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.review-calendar-weekdays,
.review-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.35rem;
}

.review-calendar-weekdays {
  margin-top: 0.8rem;
  color: #7f8da0;
  font-size: 0.66rem;
  font-weight: 700;
  text-align: center;
}

.review-calendar-grid {
  margin-top: 0.45rem;
}

.review-calendar-grid button,
.review-calendar-grid span {
  display: grid;
  min-height: 2.2rem;
  place-items: center;
  border-radius: 0.55rem;
  font-size: 0.76rem;
}

.review-calendar-grid button {
  color: #dbe7f2;
  background: rgba(255, 255, 255, 0.055);
}

.review-calendar-grid button.today {
  color: #8cddff;
  border: 1px solid rgba(140, 221, 255, 0.4);
}

.review-calendar-grid button.selected,
.review-calendar-grid button:hover {
  color: #071321;
  background: #8cddff;
}

.review-dialog-footer {
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
  padding: 0.85rem 1rem 1rem;
  background: linear-gradient(180deg, rgba(17, 28, 41, 0), #111c29 26%);
}

.review-cancel-button,
.review-submit-button {
  min-height: 2.75rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 850;
}

.review-cancel-button {
  color: #dbe4ee;
  background: rgba(255, 255, 255, 0.075);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.review-submit-button {
  color: #071321;
  background: #8cddff;
  box-shadow: 0 0.5rem 1.2rem rgba(72, 207, 255, 0.18);
}

.review-submit-button:disabled,
.review-cancel-button:disabled {
  cursor: default;
  opacity: 0.55;
}

.review-delete-backdrop {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: grid;
  padding: 1rem;
  background: rgba(3, 8, 14, 0.66);
  place-items: center;
  backdrop-filter: blur(0.35rem);
}

.review-delete-dialog {
  width: min(100%, 25rem);
  color: #f7f9fc;
  background: #111c29;
  border: 1px solid rgba(199, 214, 229, 0.16);
  border-radius: 1rem;
  box-shadow: 0 1.3rem 3rem rgba(0, 0, 0, 0.38);
  animation: detailIn 0.22s ease both;
}

.review-delete-dialog header {
  padding: 1rem 1rem 0.65rem;
}

.review-delete-dialog h3 {
  font-size: 1rem;
  font-weight: 850;
}

.review-delete-dialog header p {
  margin-top: 0.4rem;
  color: #b8c3d1;
  font-size: 0.78rem;
}

.review-delete-preview {
  max-height: 7rem;
  margin: 0 1rem;
  overflow: hidden;
  color: #91a0b4;
  background: #121a25;
  border: 1px solid #314258;
  border-radius: 0.7rem;
  padding: 0.8rem;
  font-size: 0.78rem;
  line-height: 1.5;
}

.review-delete-dialog footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
  padding: 0.9rem 1rem 1rem;
}

.review-delete-confirm-button {
  min-height: 2.75rem;
  color: #fff7fa;
  background: #d94f76;
  border-radius: 999px;
  box-shadow: 0 0.5rem 1.2rem rgba(217, 79, 118, 0.2);
  font-size: 0.82rem;
  font-weight: 850;
}

.review-delete-confirm-button:disabled {
  cursor: wait;
  opacity: 0.58;
}

@media (min-width: 640px) {
  .hero-image {
    border-radius: 0 0 1rem 1rem;
  }
}
</style>
