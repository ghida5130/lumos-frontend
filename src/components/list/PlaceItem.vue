<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  place: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article class="place-card">
    <RouterLink :to="{ name: 'detail', query: { id: place.id } }" class="place-item">
      <div class="place-image">
        <img v-if="place.image" :src="place.image" :alt="place.title" />
      </div>
      <div class="place-info">
        <div class="place-title-row">
          <h2>{{ place.title }}</h2>
          <p class="like-count" aria-label="좋아요 수">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M20.8 4.6c-1.9-1.8-4.9-1.7-6.7.2L12 7l-2.1-2.2C8.1 2.9 5.1 2.8 3.2 4.6 1.1 6.6 1 9.9 3 12l9 8.7 9-8.7c2-2.1 1.9-5.4-.2-7.4Z"
              />
            </svg>
            {{ place.likeCount }}
          </p>
        </div>
        <p class="category">{{ place.category }}</p>
        <p class="description">{{ place.description }}</p>
        <ul class="tag-list" aria-label="장소 태그">
          <li v-for="tag in place.tags" :key="tag">{{ tag }}</li>
        </ul>
      </div>
    </RouterLink>
  </article>
</template>

<style scoped>
.place-card {
  border-top: 1px solid #233146;
  padding-top: 1rem;
}

.place-item {
  display: block;
  width: 93%;
  margin: 0 auto;
}

.place-image {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, rgba(70, 103, 130, 0.2), rgba(12, 22, 35, 0.06)), #0e1826;
}

.place-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.like-count {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  color: #e8f8ff;
  font-size: 1rem;
  font-weight: 700;
}

.like-count svg {
  width: 0.95rem;
  fill: #ff6f9f;
}

.place-info {
  padding: 1rem 0;
}

.place-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.place-title-row h2 {
  overflow: hidden;
  font-size: 1.15rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.place-title-row span {
  flex: 0 0 auto;
  padding: 0.25rem 0.45rem;
  color: #82d7ff;
  background: rgba(72, 207, 255, 0.1);
  border-radius: 0.35rem;
  font-size: 0.68rem;
  font-weight: 700;
}

.category {
  margin-top: 0.45rem;
  color: #74cfff;
  font-size: 0.72rem;
}

.description {
  display: -webkit-box;
  margin-top: 0.65rem;
  overflow: hidden;
  color: #aeb8c7;
  font-size: 0.82rem;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.85rem;
}

.tag-list li {
  padding: 0.3rem 0.55rem;
  color: #aeb9c8;
  background: #202b3a;
  border-radius: 999px;
  font-size: 0.65rem;
}
</style>
