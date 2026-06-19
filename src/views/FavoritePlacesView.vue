<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getUserFavorites } from '@/api/users'

const favoritePlaces = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const totalElements = ref(0)
const failedImageIds = ref(new Set())

const favoriteCountLabel = computed(() => favoritePlaces.value.length || totalElements.value)

function formatDate(dateText) {
  if (!dateText) return ''
  return dateText.replace('T', ' ').slice(0, 16)
}

function formatCategory(category) {
  const labels = {
    NIGHT_VIEW: '야경',
    TOURIST_SPOT: '관광지',
    RESTAURANT: '식당',
    ACCOMMODATION: '숙소',
  }

  return labels[category] ?? category ?? ''
}

function getFallbackInitial(name) {
  return name?.trim()?.slice(0, 1) || '?'
}

function mapFavoritePlace(place) {
  return {
    id: place.placeId,
    favoriteId: place.favoriteId,
    name: place.name,
    category: formatCategory(place.category),
    imageUrl: place.imageUrl,
    summary: place.summary,
    createdAt: formatDate(place.createdAt),
  }
}

function markImageFailed(placeId) {
  failedImageIds.value = new Set([...failedImageIds.value, placeId])
}

async function loadFavoritePlaces() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await getUserFavorites()

    favoritePlaces.value = (result.content ?? []).map(mapFavoritePlace)
    totalElements.value = result.totalElements ?? favoritePlaces.value.length
  } catch {
    favoritePlaces.value = []
    totalElements.value = 0
    errorMessage.value = '즐겨찾기 목록을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadFavoritePlaces()
})
</script>

<template>
  <main class="favorite-places-view">
    <section class="favorite-content">
      <header class="favorite-heading">
        <p>저장한 여행지</p>
        <h2>즐겨찾기 {{ favoriteCountLabel }}개</h2>
      </header>

      <p v-if="isLoading" class="status-message">즐겨찾기 목록을 불러오는 중입니다.</p>
      <p v-else-if="errorMessage" class="status-message">{{ errorMessage }}</p>

      <ul v-else-if="favoritePlaces.length" class="favorite-list" aria-label="즐겨찾기 여행지 목록">
        <li v-for="place in favoritePlaces" :key="place.favoriteId ?? place.id">
          <RouterLink :to="{ name: 'detail', query: { id: place.id } }" class="favorite-item">
            <div class="place-thumbnail">
              <img
                v-if="place.imageUrl && !failedImageIds.has(place.id)"
                :src="place.imageUrl"
                :alt="place.name"
                @error="markImageFailed(place.id)"
              />
              <span v-else>{{ getFallbackInitial(place.name) }}</span>
            </div>

            <div class="place-copy">
              <h3>{{ place.name }}</h3>
              <p>{{ place.summary }}</p>
              <div class="place-meta">
                <span v-if="place.category" class="category-chip">{{ place.category }}</span>
                <span v-if="place.createdAt">저장 {{ place.createdAt }}</span>
              </div>
            </div>

            <div class="favorite-side">
              <svg class="chevron-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </RouterLink>
        </li>
      </ul>

      <section v-else class="empty-state">
        <h2>즐겨찾기한 여행지가 없습니다</h2>
        <p>마음에 드는 여행지를 즐겨찾기에 추가하면 이곳에서 다시 볼 수 있습니다.</p>
      </section>
    </section>
  </main>
</template>

<style scoped>
.favorite-places-view {
  min-height: calc(100vh - 3rem);
  padding: 0.75rem 0 6.5rem;
  color: #f7f9fc;
}

.favorite-content {
  width: min(100%, 44rem);
  margin: 0 auto;
}

.favorite-heading {
  width: calc(100% - 2rem);
  margin-top: 0.45rem;
  margin-bottom: 0.75rem;
  margin-right: auto;
  margin-left: auto;
}

.favorite-heading p {
  margin-bottom: 0.4rem;
  color: #91a0b4;
  font-size: 0.78rem;
}

.favorite-heading h2 {
  font-size: 1.35rem;
  font-weight: 700;
}

.status-message {
  width: calc(100% - 2rem);
  margin-top: 3rem;
  margin-right: auto;
  margin-left: auto;
  color: #91a0b4;
  font-size: 0.9rem;
  text-align: center;
}

.favorite-list {
  display: grid;
  overflow: hidden;
  width: 100%;
  background: rgba(15, 23, 34, 0.46);
  border-top: 1px solid rgba(126, 143, 165, 0.16);
  border-bottom: 1px solid rgba(126, 143, 165, 0.16);
}

.favorite-list li + li {
  border-top: 1px solid rgba(126, 143, 165, 0.12);
}

.favorite-item {
  display: grid;
  grid-template-columns: 3.75rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.7rem;
  min-height: 4.8rem;
  padding: 0.62rem 1rem;
  background: transparent;
  transition:
    background 0.2s ease,
    padding 0.2s ease;
}

.favorite-item:hover,
.favorite-item:focus-visible {
  background: rgba(33, 45, 59, 0.76);
  outline: none;
  padding-left: 1.08rem;
}

.place-thumbnail {
  display: grid;
  width: 3.75rem;
  aspect-ratio: 1;
  overflow: hidden;
  color: #dff7f0;
  background:
    linear-gradient(135deg, rgba(127, 199, 178, 0.22), rgba(72, 115, 147, 0.12)),
    #101a26;
  border-radius: 0.5rem;
  font-size: 1.05rem;
  font-weight: 800;
  place-items: center;
}

.place-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.place-copy {
  min-width: 0;
}

.place-copy h3 {
  overflow: hidden;
  color: #eef4fb;
  font-size: 0.88rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-chip {
  flex: 0 0 auto;
  max-width: 6rem;
  padding: 0.16rem 0.4rem;
  overflow: hidden;
  color: #cdebe4;
  background: rgba(127, 199, 178, 0.12);
  border: 1px solid rgba(127, 199, 178, 0.22);
  border-radius: 999px;
  font-size: 0.6rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.place-copy p {
  display: -webkit-box;
  margin-top: 0.28rem;
  overflow: hidden;
  color: #9eabbc;
  font-size: 0.72rem;
  line-height: 1.32;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.place-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.4rem;
  color: #7f8da0;
  font-size: 0.62rem;
}

.favorite-side {
  display: grid;
  justify-items: end;
  gap: 0.45rem;
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
  margin-top: 4rem;
  margin-right: auto;
  margin-left: auto;
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
  .favorite-item {
    grid-template-columns: 3.35rem minmax(0, 1fr) auto;
    gap: 0.55rem;
    padding-right: 0.75rem;
    padding-left: 0.75rem;
  }

  .place-thumbnail {
    width: 3.35rem;
  }

}
</style>
