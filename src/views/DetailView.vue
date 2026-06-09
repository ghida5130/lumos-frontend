<script setup>
import image3 from '@/assets/images/mock/carousel/3.jpg'
import image4 from '@/assets/images/mock/carousel/4.jpg'
import image5 from '@/assets/images/mock/carousel/5.jpg'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const place = ref(null)
const isLoading = ref(false)

const dummyPlaces = {
  1: {
    id: 1,
    title: '광안리 해수욕장',
    image: image3,
    rating: '4.9',
    reviewCount: '1,240',
    categories: ['야경', '산책', '데이트', '부산 대표명소'],
    description:
      '광안대교의 환상적인 야경과 파도 소리를 동시에 즐길 수 있는 부산의 대표 명소입니다. 도심의 빛과 바다의 평온함이 어우러진 감성적인 분위기를 선사하며, 야간 사진 촬영과 산책에 최적화된 장소입니다.',
    address: '부산광역시 수영구 광안해변로 219',
    addressDetail: '지하철 부산역에서 수영구 광안동 192-20',
    phone: '051-622-4251',
    hours: '매일 00:00 - 24:00 (연중무휴)',
    reviews: [
      {
        id: 1,
        author: '김지민',
        avatar: '김',
        rating: 5,
        content:
          '밤에 보는 광안대교는 정말 환상적이에요. 해변가 바에서 칵테일 한 잔 하며 야경 보기 딱 좋습니다.',
      },
      {
        id: 2,
        author: '박준서',
        avatar: '박',
        rating: 5,
        content:
          '주말 드론쇼는 꼭 보세요! 사람이 많긴 하지만 그만큼 가치 있는 볼거리입니다. 분위기가 정말 고급스러워요.',
      },
    ],
  },
  2: {
    id: 2,
    title: '서울숲',
    image: image4,
    rating: '4.8',
    reviewCount: '864',
    categories: ['공원', '산책', '피크닉'],
    description:
      '도심 속에서 넓은 잔디밭과 숲길을 만날 수 있는 서울의 대표 공원입니다. 계절마다 달라지는 풍경과 여유로운 산책로를 즐길 수 있습니다.',
    address: '서울특별시 성동구 뚝섬로 273',
    addressDetail: '수인분당선 서울숲역 3번 출구',
    phone: '02-460-2905',
    hours: '매일 00:00 - 24:00',
    reviews: [
      {
        id: 1,
        author: '이수현',
        avatar: '이',
        rating: 5,
        content: '나무 그늘이 많아서 천천히 산책하기 좋았어요. 도심 속 휴식 공간으로 추천합니다.',
      },
    ],
  },
  3: {
    id: 3,
    title: '전주 한옥마을',
    image: image5,
    rating: '4.7',
    reviewCount: '932',
    categories: ['전통', '문화', '골목여행'],
    description:
      '고즈넉한 한옥과 전통문화가 살아 있는 전주의 대표 여행지입니다. 골목을 걸으며 다양한 먹거리와 공방, 문화 체험을 만날 수 있습니다.',
    address: '전북특별자치도 전주시 완산구 기린대로 99',
    addressDetail: '전주한옥마을 관광안내소 인근',
    phone: '063-282-1330',
    hours: '매일 00:00 - 24:00',
    reviews: [
      {
        id: 1,
        author: '최은지',
        avatar: '최',
        rating: 5,
        content: '저녁 무렵 조명이 켜진 골목이 특히 아름다웠어요. 천천히 둘러보기를 추천해요.',
      },
    ],
  },
}

const loadPlaceDetails = async (id) => {
  isLoading.value = true

  // 추후 API 요청으로 교체: place.value = await getPlaceDetails(id)
  place.value = dummyPlaces[id] ?? dummyPlaces[1]
  isLoading.value = false
}

watch(
  () => route.query.id,
  (id) => loadPlaceDetails(String(id ?? '1')),
  { immediate: true },
)
</script>

<template>
  <main class="detail-view">
    <p v-if="isLoading" class="state-message">여행지 정보를 불러오는 중입니다.</p>

    <template v-else-if="place">
      <figure class="hero-image">
        <img :src="place.image" :alt="place.title" />
      </figure>

      <div class="detail-content">
        <article class="place-detail-card">
          <ul class="category-list">
            <li v-for="category in place.categories" :key="category">#{{ category }}</li>
          </ul>

          <div class="title-row">
            <h2>{{ place.title }}</h2>
            <span><b>★</b> {{ place.rating }}</span>
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
                <small>{{ place.addressDetail }}</small>
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
              리뷰 <span>({{ place.reviewCount }})</span>
            </h2>
          </header>

          <article v-for="review in place.reviews" :key="review.id" class="review-card">
            <header>
              <span class="review-avatar">{{ review.avatar }}</span>
              <strong>{{ review.author }}</strong>
              <span class="review-rating">{{ '★'.repeat(review.rating) }}</span>
            </header>
            <p>{{ review.content }}</p>
          </article>
        </section>

        <button class="favorite-button" type="button">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-4-7 4V4Z" />
          </svg>
          즐겨찾기에 추가
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

.hero-image {
  width: min(100%, 48rem);
  aspect-ratio: 16 / 8;
  margin: 0 auto;
  overflow: hidden;
  background: #0e1826;
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
  font-size: 1.3rem;
  font-weight: 700;
}

.title-row span {
  flex: 0 0 auto;
  color: #dce5ee;
  font-size: 0.82rem;
}

.title-row b {
  color: #f8dc61;
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

.review-heading button {
  color: #8cddff;
  font-size: 0.68rem;
}

.review-card {
  margin-bottom: 0.7rem;
  padding: 0.8rem;
}

.review-card header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.review-avatar {
  display: grid;
  width: 1.45rem;
  height: 1.45rem;
  place-items: center;
  color: #bcecff;
  background: #263c4b;
  border-radius: 50%;
  font-size: 0.7rem;
}

.review-card strong {
  font-size: 0.75rem;
  font-weight: 500;
}

.review-rating {
  margin-left: auto;
  color: #8cddff;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
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
