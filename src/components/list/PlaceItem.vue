<script setup>
defineProps({
  place: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article class="place-card">
    <div class="place-item">
      <div class="place-image">
        <img v-if="place.image" :src="place.image" :alt="place.title" />
      </div>
      <div class="place-info">
        <div class="place-title-row">
          <h2>{{ place.title }}</h2>
          <p class="rating" aria-label="평점">⭐ {{ place.rating }}</p>
        </div>
        <p class="location">{{ place.location }}</p>
        <p class="description">{{ place.description }}</p>
        <ul class="category-list" aria-label="장소 분류">
          <li v-for="category in place.categories" :key="category">{{ category }}</li>
        </ul>
      </div>
    </div>
  </article>
</template>

<style scoped>
.place-card {
  border-top: 1px solid #233146;
  padding-top: 1rem;
}

.place-item {
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

.rating {
  margin-bottom: 0.5rem;
  color: #e8f8ff;
  font-size: 1rem;
  font-weight: 700;
}

.rating svg {
  width: 0.8rem;
  fill: #8cddff;
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

.location {
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

.category-list {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.85rem;
}

.category-list li {
  padding: 0.3rem 0.55rem;
  color: #aeb9c8;
  background: #202b3a;
  border-radius: 999px;
  font-size: 0.65rem;
}
</style>
