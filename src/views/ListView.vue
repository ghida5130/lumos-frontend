<script setup>
import PlaceItem from '@/components/list/PlaceItem.vue'
import SearchPanel from '@/components/list/SearchPanel.vue'
import { computed, ref } from 'vue'
import image3 from '@/assets/images/mock/carousel/3.jpg'
import image4 from '@/assets/images/mock/carousel/4.jpg'
import image5 from '@/assets/images/mock/carousel/5.jpg'

const places = ref([
  {
    id: 1,
    title: '광안리 해수욕장',
    description: '야경과 바다를 함께 즐길 수 있는 부산의 대표 명소',
    location: '부산 수영구',
    distance: '2.4km',
    rating: '4.9',
    categories: ['바다', '야경'],
    image: image3,
  },
  {
    id: 2,
    title: '서울숲',
    description: '도심 속에서 산책과 여유를 즐길 수 있는 넓은 공원',
    location: '서울 성동구',
    distance: '4.1km',
    rating: '4.8',
    categories: ['공원', '산책'],
    image: image4,
  },
  {
    id: 3,
    title: '한옥마을',
    description: '고즈넉한 골목을 따라 전통의 분위기를 느낄 수 있는 곳',
    location: '전북 전주시',
    distance: '6.8km',
    rating: '4.7',
    categories: ['전통', '문화'],
    image: image5,
  },
])

const filterOptions = ['전체', '관광지', '맛집', '카페', '문화', '자연']
const recentSearches = ref(['광안대교', '서울 야경', '한옥마을'])
const searchKeyword = ref('')
const appliedKeyword = ref('')
const selectedFilters = ref([])
const appliedFilters = ref([])
const isSearchOpen = ref(false)

const resultTitle = computed(() => {
  if (!appliedKeyword.value && appliedFilters.value.length === 0) return '전체 장소'
  return appliedKeyword.value ? `'${appliedKeyword.value}' 검색 결과` : '필터 검색 결과'
})

const toggleFilter = (filter) => {
  if (filter === '전체') {
    selectedFilters.value = []
    return
  }

  selectedFilters.value = selectedFilters.value.includes(filter)
    ? selectedFilters.value.filter((item) => item !== filter)
    : [...selectedFilters.value, filter]
}

const applySearch = (keyword = searchKeyword.value) => {
  const normalizedKeyword = keyword.trim()

  searchKeyword.value = normalizedKeyword
  appliedKeyword.value = normalizedKeyword
  appliedFilters.value = [...selectedFilters.value]

  if (normalizedKeyword && !recentSearches.value.includes(normalizedKeyword)) {
    recentSearches.value = [normalizedKeyword, ...recentSearches.value].slice(0, 5)
  }

  isSearchOpen.value = false
}

const removeRecentSearch = (keyword) => {
  recentSearches.value = recentSearches.value.filter((item) => item !== keyword)
}
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
        <span>{{ appliedKeyword || '어디로 떠나볼까요?' }}</span>
        <span v-if="appliedFilters.length" class="filter-count">{{ appliedFilters.length }}</span>
      </button>

      <div class="result-heading">
        <div>
          <p>{{ resultTitle }}</p>
          <strong>{{ places.length }}개의 장소</strong>
        </div>
        <button type="button">추천순</button>
      </div>

      <ul v-if="appliedFilters.length" class="applied-filter-list" aria-label="적용된 필터">
        <li v-for="filter in appliedFilters" :key="filter">{{ filter }}</li>
      </ul>

      <section class="place-list" aria-label="장소 검색 결과">
        <PlaceItem v-for="place in places" :key="place.id" :place="place" />
      </section>
    </section>

    <SearchPanel
      v-else
      v-model:keyword="searchKeyword"
      :filter-options="filterOptions"
      :selected-filters="selectedFilters"
      :recent-searches="recentSearches"
      @close="isSearchOpen = false"
      @search="applySearch"
      @toggle-filter="toggleFilter"
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
  /* padding: 0.5rem 1rem 1.5rem; */
}

.search-trigger {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 90%;
  margin: 0 auto;
  min-height: 3.25rem;
  padding: 0 1rem;
  color: #9ba9bc;
  background: #172233;
  border: 1px solid #314258;
  border-radius: 1.25rem;
  text-align: left;
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
  background: #71d3ff;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
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

.result-heading button {
  color: #79cfff;
  font-size: 0.78rem;
  font-weight: 600;
}

.applied-filter-list {
  display: flex;
  gap: 0.5rem;
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

@media (min-width: 600px) {
  .place-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
