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
  compact: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <router-link :to="link" class="bottom-bar-button" :class="{ compact }">
    <img :src="imagePath" :alt="icon" class="icon" />

    <span class="label">
      {{ icon }}
    </span>
  </router-link>
</template>

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
  transition: gap 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.icon {
  width: 1.25rem;
  height: 1.25rem;

  object-fit: contain;
  transition:
    width 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.label {
  max-height: 1rem;
  overflow: hidden;
  font-size: 0.625rem;
  line-height: 1;
  text-transform: capitalize;
  opacity: 1;
  transform: translateY(0);
  transition:
    max-height 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.2s ease,
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.bottom-bar-button.compact {
  gap: 0;
}

.bottom-bar-button.compact .icon {
  width: 1.1rem;
  height: 1.1rem;
  transform: translateY(0.05rem);
}

.bottom-bar-button.compact .label {
  max-height: 0;
  opacity: 0;
  transform: translateY(0.35rem);
}

@media (prefers-reduced-motion: reduce) {
  .bottom-bar-button,
  .icon,
  .label {
    transition-duration: 0.01ms;
  }
}
</style>
