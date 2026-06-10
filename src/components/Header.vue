<script setup lang="ts">
import backArrow from '@/assets/images/header/back-arrow.svg'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const headerTitle = computed(() => route.meta.headerTitle ?? '')
const showBackButton = computed(() => route.meta.showBackButton ?? false)

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.replace({ name: 'home' })
}
</script>

<template>
  <header>
    <button v-if="showBackButton" class="back-button" type="button" aria-label="뒤로 가기" @click="goBack">
      <img :src="backArrow" alt="" width="30px" />
    </button>
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
  .back-button {
    margin-right: auto;
    cursor: pointer;
  }
  h1 {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1.25rem;
    font-weight: 700;
  }
}
</style>
