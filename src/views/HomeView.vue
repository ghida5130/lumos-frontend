<script setup>
import ContentCarousel from '@/components/main/ContentCarousel.vue'
import MainFunctionBtn from '@/components/main/MainFunctionBtn.vue'
import RegionBtn from '@/components/main/regionBtn.vue'
import TopCarousel from '@/components/main/TopCarousel.vue'
</script>

<template>
  <main class="home-view">
    <TopCarousel />
    <MainFunctionBtn />
    <RegionBtn />
    <ContentCarousel />
    <ContentCarousel />
    <ContentCarousel />
    <div class="bottom-margin"></div>
  </main>
</template>

<style scoped>
.home-view {
  min-height: 100vh;
  padding: 1.25rem 0;
  overflow-x: hidden;
}

.bottom-margin {
  height: 5rem;
}

@media (max-width: 480px) {
  .home-view {
    padding-top: 1rem;
  }
}
</style>
