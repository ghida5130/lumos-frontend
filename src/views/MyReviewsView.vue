<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getUserReviews } from '@/api/users'

const reviews = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const totalElements = ref(0)
const failedImageIds = ref(new Set())

const reviewCountLabel = computed(() => totalElements.value || reviews.value.length)

function formatDate(dateText) {
  if (!dateText) return ''
  return dateText.replace('T', ' ').slice(0, 10)
}

function formatDateTime(dateText) {
  if (!dateText) return ''
  return dateText.replace('T', ' ').slice(0, 16)
}

function getFallbackInitial(name) {
  return name?.trim()?.slice(0, 1) || '?'
}

function mapReview(review) {
  return {
    id: review.reviewId,
    placeId: review.placeId,
    placeName: review.placeName,
    imageUrl: review.placeImageUrl,
    content: review.content,
    visitDate: formatDate(review.visitDate),
    likeCount: review.likeCount ?? 0,
    createdAt: formatDateTime(review.createdAt),
  }
}

function markImageFailed(reviewId) {
  failedImageIds.value = new Set([...failedImageIds.value, reviewId])
}

async function loadReviews() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await getUserReviews()

    reviews.value = (result.content ?? []).map(mapReview)
    totalElements.value = result.totalElements ?? reviews.value.length
  } catch {
    reviews.value = []
    totalElements.value = 0
    errorMessage.value = '내가 쓴 리뷰 목록을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadReviews()
})
</script>

<template>
  <main class="my-reviews-view">
    <section class="review-content">
      <header class="review-heading">
        <p>내가 남긴 기록</p>
        <h2>작성한 리뷰 {{ reviewCountLabel }}개</h2>
      </header>

      <p v-if="isLoading" class="status-message">내가 쓴 리뷰를 불러오는 중입니다.</p>
      <p v-else-if="errorMessage" class="status-message">{{ errorMessage }}</p>

      <ul v-else-if="reviews.length" class="review-list" aria-label="내가 쓴 리뷰 목록">
        <li v-for="review in reviews" :key="review.id">
          <RouterLink :to="{ name: 'detail', query: { id: review.placeId } }" class="review-item">
            <div class="place-thumbnail">
              <img
                v-if="review.imageUrl && !failedImageIds.has(review.id)"
                :src="review.imageUrl"
                :alt="review.placeName"
                @error="markImageFailed(review.id)"
              />
              <span v-else>{{ getFallbackInitial(review.placeName) }}</span>
            </div>

            <div class="review-copy">
              <div class="review-title-row">
                <h3>{{ review.placeName }}</h3>
                <span>{{ review.likeCount }} likes</span>
              </div>
              <p>{{ review.content }}</p>
              <div class="review-meta">
                <span v-if="review.visitDate">방문 {{ review.visitDate }}</span>
                <span v-if="review.createdAt">작성 {{ review.createdAt }}</span>
              </div>
            </div>

            <svg class="chevron-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </RouterLink>
        </li>
      </ul>

      <section v-else class="empty-state">
        <h2>아직 작성한 리뷰가 없습니다</h2>
        <p>다녀온 장소에 리뷰를 남기면 이곳에서 모아볼 수 있습니다.</p>
      </section>
    </section>
  </main>
</template>

<style scoped>
.my-reviews-view {
  min-height: calc(100vh - 3rem);
  padding: 0.75rem 0 6.5rem;
  color: #f7f9fc;
}

.review-content {
  width: min(100%, 44rem);
  margin: 0 auto;
}

.review-heading {
  width: calc(100% - 2rem);
  margin: 0.45rem auto 0.75rem;
}

.review-heading p {
  margin-bottom: 0.4rem;
  color: #91a0b4;
  font-size: 0.78rem;
}

.review-heading h2 {
  font-size: 1.35rem;
  font-weight: 700;
}

.status-message {
  width: calc(100% - 2rem);
  margin: 3rem auto 0;
  color: #91a0b4;
  font-size: 0.9rem;
  text-align: center;
}

.review-list {
  display: grid;
  overflow: hidden;
  width: 100%;
  background: rgba(15, 23, 34, 0.46);
  border-top: 1px solid rgba(126, 143, 165, 0.16);
  border-bottom: 1px solid rgba(126, 143, 165, 0.16);
}

.review-list li + li {
  border-top: 1px solid rgba(126, 143, 165, 0.12);
}

.review-item {
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  min-height: 5.6rem;
  padding: 0.72rem 1rem;
  transition:
    background 0.2s ease,
    padding 0.2s ease;
}

.review-item:hover,
.review-item:focus-visible {
  background: rgba(33, 45, 59, 0.76);
  outline: none;
  padding-left: 1.08rem;
}

.place-thumbnail {
  display: grid;
  width: 4rem;
  aspect-ratio: 1;
  overflow: hidden;
  color: #dff7f0;
  background: #101a26;
  border: 1px solid rgba(126, 143, 165, 0.18);
  border-radius: 0.55rem;
  font-size: 1.1rem;
  font-weight: 800;
  place-items: center;
}

.place-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review-copy {
  min-width: 0;
}

.review-title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.review-title-row h3 {
  min-width: 0;
  overflow: hidden;
  color: #eef4fb;
  font-size: 0.9rem;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-title-row span {
  flex: 0 0 auto;
  color: #8fe6c8;
  font-size: 0.66rem;
  font-weight: 800;
}

.review-copy p {
  display: -webkit-box;
  margin-top: 0.3rem;
  overflow: hidden;
  color: #a6b3c4;
  font-size: 0.76rem;
  line-height: 1.42;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.review-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.42rem;
  color: #7f8da0;
  font-size: 0.64rem;
}

.chevron-icon {
  width: 0.95rem;
  fill: none;
  stroke: #728196;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.empty-state {
  width: calc(100% - 2rem);
  margin: 4rem auto 0;
  padding: 2rem 1rem;
  color: #91a0b4;
  background: rgba(23, 34, 51, 0.82);
  border: 1px solid #314258;
  border-radius: 0.75rem;
  text-align: center;
}

.empty-state h2 {
  color: #dce5ee;
  font-size: 1rem;
  font-weight: 600;
}

.empty-state p {
  margin-top: 0.6rem;
  font-size: 0.78rem;
  line-height: 1.5;
}

@media (max-width: 380px) {
  .review-item {
    grid-template-columns: 3.45rem minmax(0, 1fr) auto;
    gap: 0.55rem;
    padding-right: 0.75rem;
    padding-left: 0.75rem;
  }

  .place-thumbnail {
    width: 3.45rem;
  }
}
</style>
