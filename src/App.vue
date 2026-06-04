<script setup>
import { RouterView } from 'vue-router'
import BottomBar from './components/BottomBar.vue'
import Header from './components/Header.vue'
</script>

<template>
  <Header />
  <RouterView />
  <BottomBar />
</template>

<style scoped></style>
