<script setup lang="ts">
import backArrow from '@/assets/images/header/back-arrow.svg'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const headerTitle = computed(() => route.meta.headerTitle ?? '')
const showBackButton = computed(() => route.meta.showBackButton ?? false)
const prevPath = computed(() => route.meta.prevPath ?? '')
</script>

<template>
  <header>
    <RouterLink v-if="showBackButton" :to="prevPath"
      ><img :src="backArrow" alt="back button" width="30px"
    /></RouterLink>
    <h1>{{ headerTitle }}</h1>
  </header>
</template>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  height: 3rem;
  width: 100%;
  a {
    margin-right: auto;
  }
  h1 {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1.5rem;
    font-weight: 700;
  }
}
</style>
