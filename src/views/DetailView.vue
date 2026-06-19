<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { getPlaceDetail } from "@/api/place";
import { getPlaceReviews, postReviewLike } from "@/api/review";
import { useToastStore } from "@/stores/toast";

const REVIEW_PLACE_ID = 1;

const route = useRoute();
const toastStore = useToastStore();

const place = ref(null);
const reviews = ref([]);
const reviewTotalCount = ref(0);
const isLoading = ref(false);
const errorMessage = ref("");
const pendingReviewLikes = ref(new Set());

const reviewCountLabel = computed(() => reviewTotalCount.value || place.value?.reviewCount || 0);

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

function mapPlace(placeData) {
  const tags = placeData.tags ?? [];
  const categories = [placeData.category, ...tags].filter(Boolean);

  return {
    id: placeData.placeId,
    title: placeData.name,
    image: placeData.imageUrl,
    categories,
    description: placeData.description,
    address: placeData.roadAddress || placeData.address,
    addressDetail: placeData.roadAddress ? placeData.address : "",
    phone: placeData.phone || "전화번호 정보 없음",
    hours: formatHours(placeData.openingTime, placeData.closingTime),
    likeCount: placeData.likeCount ?? 0,
    reviewCount: placeData.reviewCount ?? 0,
  };
}

function mapReview(reviewData) {
  return {
    id: reviewData.reviewId,
    author: reviewData.nickname || "익명",
    avatar: getAvatarName(reviewData.nickname),
    content: reviewData.content,
    likeCount: reviewData.likeCount ?? 0,
    createdAt: formatCreatedAt(reviewData.createdAt),
    createdAtDateTime: reviewData.createdAt,
    imageUrls: reviewData.imageUrls ?? [],
  };
}

async function loadPlaceDetails(id) {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const [placeData, reviewData] = await Promise.all([
      getPlaceDetail(id),
      getPlaceReviews(REVIEW_PLACE_ID),
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

async function addReviewLike(reviewId) {
  if (pendingReviewLikes.value.has(reviewId)) {
    return;
  }

  const targetReview = reviews.value.find((review) => review.id === reviewId);

  if (!targetReview) {
    return;
  }

  const previousLikeCount = targetReview.likeCount;
  pendingReviewLikes.value = new Set([...pendingReviewLikes.value, reviewId]);
  targetReview.likeCount += 1;

  try {
    await postReviewLike(reviewId);
    toastStore.success("리뷰 좋아요가 추가되었습니다.");
  } catch (error) {
    targetReview.likeCount = previousLikeCount;

    if (error.statusCode === 401) {
      toastStore.warning("로그인이 필요합니다.");
    } else if (error.statusCode === 409) {
      toastStore.info("이미 좋아요 처리되었습니다.");
    } else if (error.statusCode === 500) {
      toastStore.error("서버 내부 오류가 발생했습니다.");
    } else {
      toastStore.error("리뷰 좋아요 처리에 실패했습니다.");
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

        <section class="review-section">
          <header class="review-heading">
            <h2>
              리뷰 <span>({{ reviewCountLabel }})</span>
            </h2>
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
                <span class="review-like-count">{{ review.likeCount }}</span>
                <button
                  class="review-like-button"
                  type="button"
                  :disabled="pendingReviewLikes.has(review.id)"
                  @click="addReviewLike(review.id)"
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
          </article>
        </section>

        <button class="favorite-button" type="button">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-4-7 4V4Z" />
          </svg>
          즐겨찾기 추가
        </button>
      </div>
    </template>
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
  content: '';
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

.review-like-button:hover {
  background: #a8e7ff;
  box-shadow: 0 0.45rem 1rem rgba(72, 207, 255, 0.3);
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

@media (min-width: 640px) {
  .hero-image {
    border-radius: 0 0 1rem 1rem;
  }
}
</style>
