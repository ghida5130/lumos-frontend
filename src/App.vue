<script setup>
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { useRoute } from 'vue-router'
import BottomBar from './components/BottomBar.vue'
import Header from './components/Header.vue'

const route = useRoute()
const showBottomBar = computed(() => !route.meta.hideBottomBar)
</script>

<template>
  <Header />
  <RouterView />
  <div v-if="showBottomBar" class="bottom-margin"></div>
  <BottomBar v-if="showBottomBar" />
</template>

<style scoped>
.bottom-margin {
  height: 5rem;
}
</style>
