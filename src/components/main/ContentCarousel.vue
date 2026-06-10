<script setup>
import image1 from '@/assets/images/mock/carousel/1.jpg'
import image2 from '@/assets/images/mock/carousel/2.jpg'
import image3 from '@/assets/images/mock/carousel/3.jpg'
import image4 from '@/assets/images/mock/carousel/4.jpg'
import { RouterLink } from 'vue-router'

const carouselItems = [
  {
    id: 1,
    title: '광안리 해변',
    location: '부산 수영구',
    rating: '4.8',
    image: image1,
  },
  {
    id: 2,
    title: '돌산대교',
    location: '전남 여수',
    rating: '4.7',
    image: image2,
  },
  {
    id: 3,
    title: '한강공원',
    location: '서울 여의도',
    rating: '4.6',
    image: image3,
  },
  {
    id: 4,
    title: '전주 한옥마을',
    location: '전북 전주',
    rating: '4.9',
    image: image4,
  },
]
</script>

<template>
  <section class="content-carousel" aria-label="인기 여행지 캐러셀">
    <div class="title">
      <h3>오늘 인기 여행지</h3>
      <p>방문 만족도가 높은 여행 명소</p>
    </div>

    <div class="carousel-scroller">
      <RouterLink
        v-for="item in carouselItems"
        :key="item.id"
        :to="{ name: 'detail', query: { id: item.id } }"
        class="carousel-card"
      >
        <div class="card-media" aria-hidden="true">
          <img v-if="item.image" :src="item.image" :alt="item.title" />
        </div>

        <div class="card-overlay">
          <span class="rating">★ {{ item.rating }}</span>
          <div class="card-copy">
            <h4>{{ item.title }}</h4>
            <p>{{ item.location }}</p>
          </div>
        </div>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.content-carousel {
  width: 100%;
  overflow: hidden;
  margin-top: 1rem;
}

.title {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0 auto;
  padding: 0.5rem 1.5rem;
}

.title h3 {
  font-weight: 500;
  font-size: 1.25rem;
}

.title p {
  font-weight: 200;
  font-size: 0.75rem;
}

.carousel-scroller {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  scroll-padding-left: 1.5rem;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
}

.carousel-scroller::-webkit-scrollbar {
  display: none;
}

.carousel-card {
  position: relative;
  flex: 0 0 10rem;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 1.25rem;
  background: #111827;
  color: inherit;
  text-decoration: none;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.carousel-card:focus-visible {
  outline: 2px solid #8cddff;
  outline-offset: 3px;
}

.card-media {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1f2937 0%, #111827 52%, #0b1120 100%);
}

.card-media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

.card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.75rem;
  background: linear-gradient(
    180deg,
    rgba(8, 13, 24, 0.18) 0%,
    rgba(8, 13, 24, 0.04) 42%,
    rgba(8, 13, 24, 0.78) 100%
  );
}

.rating {
  align-self: flex-start;
  min-width: 3.25rem;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  padding: 0.28rem 0.5rem;
  background: rgba(15, 23, 42, 0.38);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1;
  text-align: center;
  backdrop-filter: blur(0.35rem);
}

.card-copy h4 {
  margin: 0;
  color: #fff;
  font-size: 0.93rem;
  font-weight: 700;
  line-height: 1.25;
}

.card-copy p {
  margin: 0.25rem 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.67rem;
  line-height: 1.25;
}

@media (min-width: 481px) {
  .carousel-card {
    flex-basis: 9rem;
  }
}
</style>
