<script setup>
import image3 from '@/assets/images/mock/carousel/3.jpg'
import image4 from '@/assets/images/mock/carousel/4.jpg'
import image5 from '@/assets/images/mock/carousel/5.jpg'
import PlaceItem from '@/components/list/PlaceItem.vue'
import { ref } from 'vue'

const favoritePlaces = ref([
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
</script>

<template>
  <main class="favorite-places-view">
    <section class="favorite-content">
      <header class="favorite-heading">
        <div>
          <p>다시 방문하고 싶은 여행지</p>
          <h2>저장한 장소 {{ favoritePlaces.length }}개</h2>
        </div>
        <button type="button">최근 저장순</button>
      </header>

      <section v-if="favoritePlaces.length" class="place-list" aria-label="즐겨찾기한 여행지">
        <PlaceItem v-for="place in favoritePlaces" :key="place.id" :place="place" />
      </section>

      <section v-else class="empty-state">
        <h2>저장한 여행지가 없습니다</h2>
        <p>마음에 드는 여행지를 즐겨찾기에 추가해 보세요.</p>
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
  display: flex;
  align-items: end;
  justify-content: space-between;
  width: 90%;
  margin: 0.6rem auto 1.2rem;
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

.favorite-heading button {
  color: #79cfff;
  font-size: 0.78rem;
  font-weight: 600;
}

.empty-state {
  width: 90%;
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

@media (min-width: 600px) {
  .place-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
