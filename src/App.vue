<script setup>
import { RouterView } from 'vue-router'
import BottomBar from './components/BottomBar.vue'
import Header from './components/Header.vue'
</script>

<template>
  <Header />
  <RouterView />
  <div class="bottom-margin"></div>
  <BottomBar />
</template>

<style scoped>
.bottom-margin {
  height: 5rem;
}
</style>
