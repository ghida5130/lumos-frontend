<script setup>
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { useRoute } from 'vue-router'
import BottomBar from './components/BottomBar.vue'
import Header from './components/Header.vue'
import ToastContainer from './components/ToastContainer.vue'

const route = useRoute()
const showBottomBar = computed(() => !route.meta.hideBottomBar)
const pageTransitionName = computed(() => (route.name === 'ai' ? '' : 'page'))
</script>

<template>
  <Header />
  <RouterView v-slot="{ Component, route: currentRoute }">
    <Transition :name="pageTransitionName" mode="out-in">
      <component :is="Component" :key="currentRoute.fullPath" />
    </Transition>
  </RouterView>
  <div v-if="showBottomBar" class="bottom-margin"></div>
  <BottomBar v-if="showBottomBar" />
  <ToastContainer />
</template>

<style scoped>
.bottom-margin {
  height: 5rem;
}

.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(0.35rem);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-0.2rem);
}
</style>
