<script setup>
import ContentCarousel from "@/components/main/ContentCarousel.vue";
import MainFunctionBtn from "@/components/main/MainFunctionBtn.vue";
import RegionBtn from "@/components/main/regionBtn.vue";
import TopCarousel from "@/components/main/TopCarousel.vue";
</script>

<template>
  <main class="home-view">
    <!-- <RouterLink to="/api-test">api test</RouterLink>
    <RouterLink to="/path-api-test">path api test</RouterLink>
    <RouterLink to="/multipart-api-test">multipart api test</RouterLink> -->
    <TopCarousel />
    <MainFunctionBtn />
    <RegionBtn />
    <ContentCarousel />
    <ContentCarousel />
    <ContentCarousel />
    <RouterLink to="/login-test">로그인 테스트 페이지</RouterLink>
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
