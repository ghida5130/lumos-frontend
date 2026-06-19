<script setup>
import PlaceItem from "@/components/list/PlaceItem.vue";
import SearchPanel from "@/components/list/SearchPanel.vue";
import { getPlaceList } from "@/api/place";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const PAGE_SIZE = 10;
const MAP_PLACES_STORAGE_KEY = "lumos:map-places";
const filterOptions = ["전체", "관광지", "숙소", "식당"];
const router = useRouter();

const places = ref([]);
const recentSearches = ref(["광안대교", "서울 야경", "한옥마을"]);
const searchKeyword = ref("");
const appliedKeyword = ref("");
const selectedCategory = ref("");
const appliedCategory = ref("");
const isSearchOpen = ref(false);
const isLoading = ref(false);
const errorMessage = ref("");
const page = ref(0);
const totalElements = ref(0);
const totalPages = ref(0);

const mappedPlaces = computed(() =>
  places.value.map((place) => ({
    id: place.placeId,
    title: place.name,
    description: place.summary,
    category: place.category,
    likeCount: place.likeCount,
    tags: place.tags ?? [],
    image: place.imageUrl,
    latitude: place.latitude,
    longitude: place.longitude,
  })),
);

const lastPageIndex = computed(() => Math.max(totalPages.value - 1, 0));

const visiblePages = computed(() => {
  const start = Math.max(page.value - 2, 0);
  const end = Math.min(start + 5, totalPages.value);
  const adjustedStart = Math.max(end - 5, 0);

  return Array.from({ length: end - adjustedStart }, (_, index) => adjustedStart + index);
});

const resultTitle = computed(() => {
  if (!appliedKeyword.value && !appliedCategory.value) return "전체 장소";
  return appliedKeyword.value
    ? `'${appliedKeyword.value}' 검색 결과`
    : `${appliedCategory.value} 검색 결과`;
});

const loadPlaces = async (targetPage = 0) => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const result = await getPlaceList({
      category: appliedCategory.value || undefined,
      keyword: appliedKeyword.value || undefined,
      page: targetPage,
      size: PAGE_SIZE,
    });

    places.value = result.content ?? [];
    page.value = result.page ?? targetPage;
    totalElements.value = result.totalElements ?? places.value.length;
    totalPages.value = result.totalPages ?? 1;
  } catch {
    places.value = [];
    totalElements.value = 0;
    totalPages.value = 0;
    errorMessage.value = "장소 목록을 불러오지 못했습니다.";
  } finally {
    isLoading.value = false;
  }
};

const selectFilter = (filter) => {
  selectedCategory.value = filter === "전체" ? "" : filter;
};

const applySearch = async (keyword = searchKeyword.value) => {
  const normalizedKeyword = keyword.trim();

  searchKeyword.value = normalizedKeyword;
  appliedKeyword.value = normalizedKeyword;
  appliedCategory.value = selectedCategory.value;

  if (normalizedKeyword && !recentSearches.value.includes(normalizedKeyword)) {
    recentSearches.value = [normalizedKeyword, ...recentSearches.value].slice(0, 5);
  }

  isSearchOpen.value = false;
  await loadPlaces(0);
};

const goToPage = async (targetPage) => {
  if (targetPage < 0 || targetPage > lastPageIndex.value || targetPage === page.value) return;

  await loadPlaces(targetPage);
};

const removeRecentSearch = (keyword) => {
  recentSearches.value = recentSearches.value.filter((item) => item !== keyword);
};

const goToMap = () => {
  sessionStorage.setItem(MAP_PLACES_STORAGE_KEY, JSON.stringify(mappedPlaces.value));

  router.push({
    name: "place-map",
    state: {
      places: mappedPlaces.value,
    },
  });
};

onMounted(() => {
  loadPlaces(0);
});
</script>

<template>
  <main class="list-view">
    <section v-if="!isSearchOpen" class="result-page">
      <button
        class="search-trigger"
        type="button"
        aria-label="검색 화면 열기"
        @click="isSearchOpen = true"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <span>{{ appliedKeyword || "어디로 떠나볼까요?" }}</span>
        <span v-if="appliedCategory" class="filter-count">1</span>
      </button>

      <div class="result-heading">
        <div>
          <p>{{ resultTitle }}</p>
          <strong>{{ totalElements }}개의 장소</strong>
        </div>
        <button type="button" class="map-button" :disabled="!mappedPlaces.length" @click="goToMap">
          지도에서 확인하기
        </button>
      </div>

      <ul v-if="appliedCategory" class="applied-filter-list" aria-label="적용된 필터">
        <li>{{ appliedCategory }}</li>
      </ul>

      <section v-if="isLoading" class="place-skeleton-list" aria-label="장소 목록 로딩 중">
        <article v-for="index in 6" :key="index" class="place-skeleton">
          <span class="skeleton-image"></span>
          <span class="skeleton-body">
            <i></i>
            <i></i>
            <i></i>
          </span>
        </article>
      </section>
      <p v-else-if="errorMessage" class="status-message">{{ errorMessage }}</p>
      <p v-else-if="!mappedPlaces.length" class="status-message">표시할 장소가 없습니다.</p>

      <!-- -- 결과 표시 -- -->
      <section v-else class="place-list" aria-label="장소 검색 결과">
        <PlaceItem v-for="place in mappedPlaces" :key="place.id" :place="place" />
      </section>

      <nav v-if="totalPages > 1" class="pagination" aria-label="장소 목록 페이지">
        <button type="button" :disabled="page === 0 || isLoading" @click="goToPage(page - 1)">
          이전
        </button>
        <button
          v-for="pageNumber in visiblePages"
          :key="pageNumber"
          type="button"
          :class="{ active: pageNumber === page }"
          :disabled="isLoading"
          :aria-current="pageNumber === page ? 'page' : undefined"
          @click="goToPage(pageNumber)"
        >
          {{ pageNumber + 1 }}
        </button>
        <button
          type="button"
          :disabled="page >= lastPageIndex || isLoading"
          @click="goToPage(page + 1)"
        >
          다음
        </button>
      </nav>
    </section>

    <SearchPanel
      v-else
      v-model:keyword="searchKeyword"
      :filter-options="filterOptions"
      :selected-filters="selectedCategory ? [selectedCategory] : []"
      :recent-searches="recentSearches"
      @close="isSearchOpen = false"
      @search="applySearch"
      @toggle-filter="selectFilter"
      @clear-recent="recentSearches = []"
      @remove-recent="removeRecentSearch"
    />
  </main>
</template>

<style scoped>
.list-view {
  min-height: calc(100vh - 8rem);
  color: #f7f9fc;
}

.result-page {
  width: min(100%, 44rem);
  margin: 0 auto;
}

.search-trigger {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 90%;
  min-height: 3.25rem;
  margin: 0 auto;
  padding: 0 1rem;
  color: #9ba9bc;
  text-align: left;
  background: #172233;
  border: 1px solid #314258;
  border-radius: 1.25rem;
}

.search-trigger svg {
  flex: 0 0 auto;
  width: 1.2rem;
  fill: none;
  stroke: #72d3ff;
  stroke-linecap: round;
  stroke-width: 1.8;
}

.search-trigger span:nth-child(2) {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-count {
  display: grid;
  place-items: center;
  width: 1.45rem;
  height: 1.45rem;
  color: #07111d;
  font-size: 0.75rem;
  font-weight: 700;
  background: #71d3ff;
  border-radius: 50%;
}

.result-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  width: 90%;
  margin: 1.65rem auto 1rem;
}

.result-heading p {
  margin-bottom: 0.35rem;
  color: #91a0b4;
  font-size: 0.78rem;
}

.result-heading strong {
  font-size: 1.35rem;
  font-weight: 700;
}

.map-button {
  min-height: 2rem;
  padding: 0 0.7rem;
  color: #79cfff;
  background: rgba(72, 207, 255, 0.1);
  border: 1px solid rgba(114, 211, 255, 0.26);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}

.map-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.applied-filter-list {
  display: flex;
  gap: 0.5rem;
  width: 90%;
  margin: 0 auto;
  padding-bottom: 1rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.applied-filter-list li {
  flex: 0 0 auto;
  padding: 0.45rem 0.75rem;
  color: #86d8ff;
  background: rgba(72, 207, 255, 0.12);
  border: 1px solid rgba(114, 211, 255, 0.35);
  border-radius: 999px;
  font-size: 0.72rem;
}

.status-message {
  width: 90%;
  margin: 3rem auto;
  color: #91a0b4;
  font-size: 0.9rem;
  text-align: center;
}

.place-list,
.place-skeleton-list {
  animation: contentIn 0.22s ease both;
}

.place-skeleton-list {
  display: grid;
  gap: 0.75rem;
  width: 90%;
  margin: 0 auto;
}

.place-skeleton {
  display: grid;
  grid-template-columns: 6rem minmax(0, 1fr);
  gap: 0.85rem;
  min-height: 6.6rem;
  padding: 0.75rem;
  background: #172233;
  border: 1px solid #314258;
  border-radius: 0.75rem;
}

.skeleton-image,
.skeleton-body i {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.075);
  border-radius: 0.55rem;
}

.skeleton-image::after,
.skeleton-body i::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  content: '';
  animation: skeletonSweep 1.25s ease-in-out infinite;
}

.skeleton-image {
  aspect-ratio: 1;
}

.skeleton-body {
  display: grid;
  align-content: center;
  gap: 0.55rem;
}

.skeleton-body i {
  height: 0.72rem;
}

.skeleton-body i:nth-child(1) {
  width: 68%;
}

.skeleton-body i:nth-child(2) {
  width: 92%;
}

.skeleton-body i:nth-child(3) {
  width: 48%;
}

@keyframes skeletonSweep {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
}

@keyframes contentIn {
  from {
    opacity: 0;
    transform: translateY(0.35rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.45rem;
  width: 90%;
  margin: 1.5rem auto 0;
  padding-bottom: 1.5rem;
}

.pagination button {
  min-width: 2.25rem;
  min-height: 2.25rem;
  padding: 0 0.65rem;
  color: #b8c6d8;
  background: #172233;
  border: 1px solid #314258;
  border-radius: 0.45rem;
  font-size: 0.78rem;
  font-weight: 700;
}

.pagination button.active {
  color: #07111d;
  background: #78d7ff;
  border-color: #78d7ff;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (min-width: 600px) {
  .place-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
