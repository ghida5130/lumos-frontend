<script setup>
import mapIcon from '@/assets/images/commonIcon/map.svg'
import searchIcon from '@/assets/images/commonIcon/search.svg'
import eventIcon from '@/assets/images/commonIcon/event.svg'
import infoIcon from '@/assets/images/commonIcon/info.svg'

const functionButtons = [
  { name: '지도', icon: mapIcon, color: '#111B2C', to: '/list' },
  { name: '검색', icon: searchIcon, color: '#17243B', to: '/list' },
  { name: '이벤트', icon: eventIcon, color: '#1C2E4B' },
  { name: '정보', icon: infoIcon, color: '#283E65' },
]
</script>

<template>
  <section class="function-buttons" aria-label="Main page functions">
    <RouterLink
      v-for="button in functionButtons"
      :key="button.name"
      class="function-button"
      :to="button.to"
      :style="{ backgroundColor: button.color }"
    >
      <img :src="button.icon" :alt="button.name" />
      <p>{{ button.name }}</p>
    </RouterLink>
  </section>
</template>

<style scoped>
.function-buttons {
  max-width: 30rem;
  margin: 0 auto;
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
}

.function-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  aspect-ratio: 1/1;
  border: 1px solid #24324b;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 300;
  img {
    width: 1.5rem;
  }
}
</style>
