<script setup>
defineProps({
  keyword: {
    type: String,
    default: '',
  },
  filterOptions: {
    type: Array,
    default: () => [],
  },
  selectedFilters: {
    type: Array,
    default: () => [],
  },
  recentSearches: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'update:keyword',
  'close',
  'search',
  'toggle-filter',
  'clear-recent',
  'remove-recent',
])
</script>

<template>
  <section class="search-page">
    <div class="search-top">
      <button class="back-button" type="button" aria-label="검색 닫기" @click="emit('close')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <form class="search-form" @submit.prevent="emit('search', keyword)">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          :value="keyword"
          type="search"
          placeholder="지역, 장소를 검색해보세요"
          aria-label="검색어"
          autofocus
          @input="emit('update:keyword', $event.target.value)"
        />
        <button type="submit">검색</button>
      </form>
    </div>

    <div class="filter-section">
      <h2>필터</h2>
      <ul class="filter-list">
        <li v-for="filter in filterOptions" :key="filter">
          <button
            type="button"
            :class="{ selected: filter === '전체' ? !selectedFilters.length : selectedFilters.includes(filter) }"
            @click="emit('toggle-filter', filter)"
          >
            {{ filter }}
          </button>
        </li>
      </ul>
    </div>

    <div class="recent-section">
      <div class="section-heading">
        <h2>최근 검색</h2>
        <button type="button" @click="emit('clear-recent')">전체 삭제</button>
      </div>

      <ul v-if="recentSearches.length" class="recent-list">
        <li v-for="recentKeyword in recentSearches" :key="recentKeyword">
          <button class="recent-keyword" type="button" @click="emit('search', recentKeyword)">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v4l3 2M4.5 5.5 3 8h3" />
            </svg>
            <span>{{ recentKeyword }}</span>
          </button>
          <button
            type="button"
            class="remove-button"
            :aria-label="`${recentKeyword} 삭제`"
            @click="emit('remove-recent', recentKeyword)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m7 7 10 10M17 7 7 17" />
            </svg>
          </button>
        </li>
      </ul>
      <p v-else class="empty-recent">최근 검색어가 없습니다.</p>
    </div>
  </section>
</template>

<style scoped>
.search-page {
  width: min(100%, 44rem);
  min-height: calc(100vh - 8rem);
  margin: 0 auto;
  padding: 0.5rem 1rem 1.5rem;
  background:
    radial-gradient(circle at 100% 0%, rgba(72, 207, 255, 0.08), transparent 34%),
    #0a1320;
}

.search-top,
.search-form {
  display: flex;
  align-items: center;
}

.search-top {
  gap: 0.65rem;
}

.back-button {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 3rem;
  height: 3rem;
  background: #17202c;
  border: 1px solid #354252;
  border-radius: 50%;
}

.back-button svg {
  width: 1.35rem;
  fill: none;
  stroke: #e6edf5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.search-form {
  min-width: 0;
  flex: 1;
  gap: 0.7rem;
  min-height: 3.25rem;
  padding: 0 1rem;
  color: #9ba9bc;
  background: #172233;
  border: 2px solid #72d3ff;
  border-radius: 999px;
}

.search-form > svg {
  flex: 0 0 auto;
  width: 1.2rem;
  fill: none;
  stroke: #72d3ff;
  stroke-linecap: round;
  stroke-width: 1.8;
}

.search-form input {
  min-width: 0;
  flex: 1;
  font-size: 0.9rem;
}

.search-form input::placeholder {
  color: #718096;
}

.search-form button,
.section-heading button {
  flex: 0 0 auto;
  color: #79cfff;
  font-size: 0.78rem;
  font-weight: 700;
}

.filter-section,
.recent-section {
  margin-top: 2rem;
}

.filter-section h2,
.section-heading h2 {
  font-size: 1.25rem;
  font-weight: 700;
}

.filter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.filter-list button {
  padding: 0.65rem 1rem;
  color: #b8c1cc;
  background: #17202c;
  border: 1px solid #344253;
  border-radius: 999px;
  font-size: 0.8rem;
}

.filter-list button.selected {
  color: #07111d;
  background: #78d7ff;
  border-color: #78d7ff;
  font-weight: 700;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.recent-list {
  display: grid;
  gap: 0.7rem;
  margin-top: 1rem;
}

.recent-list li {
  display: flex;
  align-items: center;
  min-height: 4.5rem;
  padding: 0 0.9rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 0.8rem;
}

.recent-keyword {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 0.9rem;
  text-align: left;
}

.recent-keyword svg {
  width: 2.4rem;
  padding: 0.65rem;
  fill: none;
  stroke: #bdc9d7;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
  background: rgba(10, 19, 32, 0.45);
  border-radius: 0.55rem;
}

.recent-keyword span {
  overflow: hidden;
  color: #d3d9e1;
  font-size: 0.88rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-button {
  padding: 0.5rem;
}

.remove-button svg {
  width: 1.05rem;
  fill: none;
  stroke: #718096;
  stroke-linecap: round;
  stroke-width: 1.6;
}

.empty-recent {
  padding: 3rem 0;
  color: #718096;
  font-size: 0.85rem;
  text-align: center;
}
</style>
