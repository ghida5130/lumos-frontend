<script setup>
import { RouterLink } from "vue-router";

defineProps({
  data: String,
  title: String,
  desc: String,
});
</script>

<template>
  <section class="content-carousel" aria-label="인기 여행지 캐러셀">
    <div class="title">
      <h3>{{ title }}</h3>
      <p>{{ desc }}</p>
    </div>

    <div class="carousel-scroller">
      <RouterLink
        v-for="item in data"
        :key="item.id"
        :to="{ name: 'detail', query: { id: item.placeId } }"
        class="carousel-card"
      >
        <div class="card-media" aria-hidden="true">
          <img v-if="item.image" :src="item.image" :alt="item.title" />
        </div>
        <div class="card-overlay">
          <span class="rating"
            ><svg fill="rgb(255, 76, 106)" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M20.8 4.6c-1.9-1.8-4.9-1.7-6.7.2L12 7l-2.1-2.2C8.1 2.9 5.1 2.8 3.2 4.6 1.1 6.6 1 9.9 3 12l9 8.7 9-8.7c2-2.1 1.9-5.4-.2-7.4Z"
              />
            </svg>
            {{ item.rating }}</span
          >
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
  /* color: rgb(255, 76, 106); */
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
  align-self: flex-end;
  display: flex;
  /* flex-direction: column; */
  /* min-width: 3.25rem; */
  border-radius: 999px;
  /* padding: 0.28rem 0.5rem; */
  color: #fff;
  font-size: 0.68rem;
  font-weight: 600;
  /* line-height: 1; */
  text-align: center;
  backdrop-filter: blur(0.35rem);
  align-items: center;
  gap: 4px;
  font-size: 12px;

  svg {
    height: 20px;
  }
}

.heart-area {
  height: 20px;
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
