<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getReviews, postReviewLike } from '@/api/review'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const PAGE_SIZE = 10

const authStore = useAuthStore()
const toastStore = useToastStore()

const reviews = ref([])
const page = ref(0)
const isInitialLoading = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const errorMessage = ref('')
const pendingReviewLikes = ref(new Set())
const loadMoreTarget = ref(null)
let observer = null

const canLoadMore = computed(
  () => hasMore.value && !isInitialLoading.value && !isLoadingMore.value && !errorMessage.value,
)

function formatCreatedAt(createdAt) {
  if (!createdAt) {
    return ''
  }

  return createdAt.replace('T', ' ').slice(0, 16)
}

function getFallbackAvatarName(nickname) {
  return nickname?.trim()?.slice(0, 1) || '?'
}

function normalizeImages(imageUrls) {
  return Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : []
}

function mapReview(reviewData, pageNumber, index) {
  const images = normalizeImages(reviewData.imageUrls)

  return {
    feedKey: `${pageNumber}-${reviewData.reviewId}-${index}`,
    id: reviewData.reviewId,
    placeName: reviewData.placeName || '장소 정보 없음',
    author: reviewData.nickname || '익명',
    profileImageUrl: reviewData.profileImageUrl || reviewData.profileImage || '',
    avatar: getFallbackAvatarName(reviewData.nickname),
    content: reviewData.content || '',
    likeCount: reviewData.likeCount ?? 0,
    createdAt: formatCreatedAt(reviewData.createdAt),
    createdAtDateTime: reviewData.createdAt,
    images,
    currentImageIndex: 0,
    touchStartX: 0,
  }
}

async function loadReviews(targetPage = 0) {
  const isFirstPage = targetPage === 0

  if (isFirstPage) {
    isInitialLoading.value = true
    errorMessage.value = ''
  } else {
    if (!canLoadMore.value) {
      return
    }

    isLoadingMore.value = true
  }

  try {
    const result = await getReviews({
      page: targetPage,
      size: PAGE_SIZE,
      authenticated: authStore.isLoggedIn,
    })
    const nextReviews = (result.content ?? []).map((review, index) =>
      mapReview(review, targetPage, index),
    )

    reviews.value = isFirstPage ? nextReviews : [...reviews.value, ...nextReviews]
    page.value = targetPage

    hasMore.value = nextReviews.length > 0
  } catch {
    if (isFirstPage) {
      reviews.value = []
    }

    errorMessage.value = '리뷰를 불러오지 못했습니다.'
  } finally {
    isInitialLoading.value = false
    isLoadingMore.value = false
  }
}

function loadNextPage() {
  if (!canLoadMore.value) {
    return
  }

  loadReviews(page.value + 1)
}

function showPreviousImage(review) {
  review.currentImageIndex = Math.max(review.currentImageIndex - 1, 0)
}

function showNextImage(review) {
  review.currentImageIndex = Math.min(review.currentImageIndex + 1, review.images.length - 1)
}

function handleTouchStart(review, event) {
  review.touchStartX = event.touches[0]?.clientX ?? 0
}

function handleTouchEnd(review, event) {
  const touchEndX = event.changedTouches[0]?.clientX ?? 0
  const diffX = review.touchStartX - touchEndX

  if (Math.abs(diffX) < 40) {
    return
  }

  if (diffX > 0) {
    showNextImage(review)
  } else {
    showPreviousImage(review)
  }
}

function getLikeErrorMessage(error) {
  if (error.statusCode === 401) {
    return '로그인이 필요합니다.'
  }

  if (error.statusCode === 409) {
    return '이미 좋아요 처리되었습니다.'
  }

  if (error.statusCode === 500) {
    return '서버 내부 오류가 발생했습니다.'
  }

  return '리뷰 좋아요 처리에 실패했습니다.'
}

async function addReviewLike(reviewId) {
  if (pendingReviewLikes.value.has(reviewId)) {
    return
  }

  const targetReviews = reviews.value.filter((review) => review.id === reviewId)

  if (!targetReviews.length) {
    return
  }

  const previousLikeCounts = targetReviews.map((review) => ({
    feedKey: review.feedKey,
    likeCount: review.likeCount,
  }))

  pendingReviewLikes.value = new Set([...pendingReviewLikes.value, reviewId])
  targetReviews.forEach((review) => {
    review.likeCount += 1
  })

  try {
    await postReviewLike(reviewId)
  } catch (error) {
    previousLikeCounts.forEach(({ feedKey, likeCount }) => {
      const review = reviews.value.find((item) => item.feedKey === feedKey)

      if (review) {
        review.likeCount = likeCount
      }
    })
    toastStore.error(getLikeErrorMessage(error))
  } finally {
    const nextPendingLikes = new Set(pendingReviewLikes.value)
    nextPendingLikes.delete(reviewId)
    pendingReviewLikes.value = nextPendingLikes
  }
}

onMounted(() => {
  loadReviews(0)

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        loadNextPage()
      }
    },
    {
      rootMargin: '240px 0px',
    },
  )

  if (loadMoreTarget.value) {
    observer.observe(loadMoreTarget.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <main class="feed-view">
    <section class="feed-list">
      <h2 class="section-title">여행자들의 새로운 이야기</h2>

      <section v-if="isInitialLoading" class="feed-skeleton-list" aria-label="피드 로딩 중">
        <article v-for="index in 3" :key="index" class="feed-skeleton">
          <header>
            <span></span>
            <div>
              <i></i>
              <i></i>
            </div>
          </header>
          <span class="feed-skeleton-media"></span>
          <div class="feed-skeleton-copy">
            <i></i>
            <i></i>
          </div>
        </article>
      </section>
      <p v-else-if="errorMessage" class="status-message">{{ errorMessage }}</p>
      <p v-else-if="!reviews.length" class="status-message">표시할 리뷰가 없습니다.</p>

      <template v-else>
        <article
          v-for="review in reviews"
          :key="review.feedKey"
          class="feed-card"
          :class="{ 'feed-card--text': !review.images.length }"
        >
          <header class="post-header">
            <img
              v-if="review.profileImageUrl"
              class="avatar"
              :src="review.profileImageUrl"
              :alt="`${review.author} 프로필`"
            />
            <span v-else class="avatar avatar-fallback" aria-hidden="true">{{ review.avatar }}</span>

            <div class="author-info">
              <strong>{{ review.author }}</strong>
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
                  <circle cx="12" cy="10" r="2" />
                </svg>
                {{ review.placeName }}
              </span>
            </div>

            <time v-if="review.createdAt" class="created-at" :datetime="review.createdAtDateTime">
              {{ review.createdAt }}
            </time>
          </header>

          <figure
            v-if="review.images.length"
            class="post-media"
            @touchstart.passive="handleTouchStart(review, $event)"
            @touchend.passive="handleTouchEnd(review, $event)"
          >
            <img
              :src="review.images[review.currentImageIndex]"
              :alt="`${review.placeName} 리뷰 이미지 ${review.currentImageIndex + 1}`"
            />

            <button
              class="image-nav image-nav--prev"
              type="button"
              aria-label="이전 이미지"
              :disabled="review.currentImageIndex === 0"
              @click="showPreviousImage(review)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              class="image-nav image-nav--next"
              type="button"
              aria-label="다음 이미지"
              :disabled="review.currentImageIndex >= review.images.length - 1"
              @click="showNextImage(review)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>

            <figcaption class="image-count">
              {{ review.currentImageIndex + 1 }} / {{ review.images.length }}
            </figcaption>
          </figure>

          <div class="post-content">
            <p>{{ review.content }}</p>

            <footer class="post-actions">
              <span class="like-count">{{ review.likeCount }}</span>
              <button
                class="like-button"
                type="button"
                :disabled="pendingReviewLikes.has(review.id)"
                @click="addReviewLike(review.id)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M20.8 4.6c-1.9-1.8-4.9-1.7-6.7.2L12 7l-2.1-2.2C8.1 2.9 5.1 2.8 3.2 4.6 1.1 6.6 1 9.9 3 12l9 8.7 9-8.7c2-2.1 1.9-5.4-.2-7.4Z"
                  />
                </svg>
                좋아요
              </button>
            </footer>
          </div>
        </article>
      </template>

      <p v-if="isLoadingMore" class="status-message status-message--small">리뷰를 더 불러오는 중입니다.</p>
      <div ref="loadMoreTarget" class="load-more-target" aria-hidden="true"></div>
    </section>
  </main>
</template>

<style scoped>
.feed-view {
  min-height: calc(100vh - 3rem);
  padding: 0.75rem 0 6.5rem;
  color: #f7f9fc;
  background: transparent;
}

.feed-list {
  width: min(calc(100% - 1.5rem), 38rem);
  margin: 0 auto;
}

.section-title {
  margin: 0.4rem 0 1rem;
  color: #91a0b4;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-message {
  padding: 3rem 1rem;
  color: #91a0b4;
  text-align: center;
}

.status-message--small {
  padding: 1rem;
  font-size: 0.78rem;
}

.feed-card {
  overflow: hidden;
  margin-bottom: 1.5rem;
  background: #172233;
  border: 1px solid #314258;
  border-radius: 0.75rem;
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.15);
  animation: feedCardIn 0.22s ease both;
}

.feed-card--text {
  border-top-color: #72d3ff;
  border-left: 3px solid #72d3ff;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 3.5rem;
  padding: 0.65rem 0.8rem;
}

.avatar {
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  object-fit: cover;
  border: 1px solid #48cfff;
  border-radius: 50%;
}

.avatar-fallback {
  display: grid;
  place-items: center;
  color: #071321;
  background: #72d3ff;
  font-size: 0.78rem;
  font-weight: 800;
}

.author-info {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 0.3rem;
}

.author-info strong {
  overflow: hidden;
  color: #dce5ee;
  font-size: 0.72rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-info span {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  overflow: hidden;
  color: #72d3ff;
  font-size: 0.64rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-info svg {
  flex: 0 0 auto;
  width: 0.65rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
}

.created-at {
  flex: 0 0 auto;
  color: #77869a;
  font-size: 0.62rem;
}

.post-media {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #0e1826;
  touch-action: pan-y;
}

.post-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-nav {
  position: absolute;
  top: 50%;
  display: grid;
  width: 2.1rem;
  height: 2.1rem;
  place-items: center;
  color: #f7fbff;
  background: rgba(7, 19, 33, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 50%;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.22);
  transform: translateY(-50%);
}

.image-nav--prev {
  left: 0.7rem;
}

.image-nav--next {
  right: 0.7rem;
}

.image-nav svg {
  width: 1.1rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.image-nav:disabled {
  cursor: default;
  opacity: 0.35;
}

.image-count {
  position: absolute;
  right: 0.7rem;
  bottom: 0.7rem;
  padding: 0.25rem 0.5rem;
  color: #f7fbff;
  background: rgba(7, 19, 33, 0.72);
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
}

.post-content {
  padding: 0.85rem;
}

.feed-card--text .post-content {
  margin: 0 0.8rem 0.9rem;
  padding: 0.9rem;
  background: rgba(10, 19, 32, 0.25);
  border: 1px solid #28394f;
  border-radius: 0.5rem;
}

.post-content p {
  color: #b6c0cd;
  font-size: 0.82rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.post-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  margin-top: 0.85rem;
}

.like-count {
  color: #e8f8ff;
  font-size: 0.78rem;
  font-weight: 800;
}

.like-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-width: 4.1rem;
  min-height: 2rem;
  padding: 0 0.7rem;
  color: #071321;
  background: #8cddff;
  border: 1px solid rgba(140, 221, 255, 0.8);
  border-radius: 999px;
  box-shadow: 0 0.35rem 0.9rem rgba(72, 207, 255, 0.22);
  font-size: 0.72rem;
  font-weight: 800;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.like-button svg {
  width: 0.82rem;
  fill: #071321;
}

.like-button:hover {
  background: #a8e7ff;
  box-shadow: 0 0.45rem 1rem rgba(72, 207, 255, 0.3);
}

.like-button:active {
  transform: scale(0.97);
}

.like-button:disabled {
  cursor: wait;
  opacity: 0.68;
  transform: none;
}

.load-more-target {
  height: 1px;
}

.feed-skeleton-list {
  display: grid;
  gap: 1.5rem;
}

.feed-skeleton {
  overflow: hidden;
  background: #172233;
  border: 1px solid #314258;
  border-radius: 0.75rem;
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.15);
}

.feed-skeleton header {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  gap: 0.65rem;
  align-items: center;
  padding: 0.75rem 0.8rem;
}

.feed-skeleton header > span,
.feed-skeleton i,
.feed-skeleton-media {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.075);
}

.feed-skeleton header > span {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
}

.feed-skeleton header div,
.feed-skeleton-copy {
  display: grid;
  gap: 0.5rem;
}

.feed-skeleton i {
  height: 0.72rem;
  border-radius: 0.45rem;
}

.feed-skeleton header i:first-child {
  width: 42%;
}

.feed-skeleton header i:last-child,
.feed-skeleton-copy i:first-child {
  width: 72%;
}

.feed-skeleton-media {
  display: block;
  aspect-ratio: 4 / 3;
}

.feed-skeleton-copy {
  padding: 0.85rem;
}

.feed-skeleton-copy i:last-child {
  width: 48%;
}

.feed-skeleton header > span::after,
.feed-skeleton i::after,
.feed-skeleton-media::after {
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

@keyframes feedCardIn {
  from {
    opacity: 0;
    transform: translateY(0.45rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (min-width: 640px) {
  .feed-view {
    padding-top: 1.25rem;
  }

  .post-media {
    aspect-ratio: 16 / 10;
  }
}
</style>
