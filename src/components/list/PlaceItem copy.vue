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
    <div class="place-image">
      <img v-if="place.image" :src="place.image" :alt="place.title" />
      <span class="rating" aria-label="평점"> ⭐ {{ place.rating }} </span>
    </div>

    <div class="place-info">
      <div class="place-title-row">
        <h2>{{ place.title }}</h2>
        <span>{{ place.distance }}</span>
      </div>
      <p class="location">{{ place.location }}</p>
      <p class="description">{{ place.description }}</p>
      <ul class="category-list" aria-label="장소 분류">
        <li v-for="category in place.categories" :key="category">{{ category }}</li>
      </ul>
    </div>
  </article>
</template>

<style scoped>
.place-card {
  overflow: hidden;
  background: #131d2c;
  border: 1px solid rgba(151, 172, 198, 0.15);
  border-radius: 1rem;
  box-shadow: 0 0.7rem 1.8rem rgba(0, 0, 0, 0.16);
}

.place-image {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(70, 103, 130, 0.2), rgba(12, 22, 35, 0.06)), #0e1826;
}

.place-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.rating {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.55rem;
  color: #e8f8ff;
  background: rgba(15, 30, 45, 0.68);
  border: 1px solid rgba(150, 220, 250, 0.2);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  backdrop-filter: blur(0.5rem);
}

.rating svg {
  width: 0.8rem;
  fill: #8cddff;
}

.place-info {
  padding: 1rem;
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
