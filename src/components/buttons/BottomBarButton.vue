<template>
  <router-link :to="link" class="bottom-bar-button">
    <img :src="imagePath" :alt="icon" class="icon" />

    <span class="label">
      {{ icon }}
    </span>
  </router-link>
</template>

<script setup lang="ts">
defineProps({
  icon: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  imagePath: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
.bottom-bar-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 0.25rem;
  width: 100%;
  height: 100%;

  text-decoration: none;
  color: white;
}

.icon {
  width: 1.25rem;
  height: 1.25rem;

  object-fit: contain;
}

.label {
  font-size: 0.625rem;
  text-transform: capitalize;
}
</style>
