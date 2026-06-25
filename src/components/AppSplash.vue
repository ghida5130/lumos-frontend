<template>
  <section class="app-splash" aria-label="App splash screen">
    <div class="app-splash__mark" aria-hidden="true">
      <img src="/icons/web-app-manifest-512x512.png" alt="" />
    </div>
    <p class="app-splash__title">Lumos</p>
  </section>
</template>

<style scoped>
.app-splash {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 1rem;
  min-height: 100dvh;
  padding: 1.5rem;
  color: #f5faff;
  background:
    radial-gradient(circle at 50% 28%, rgba(105, 180, 165, 0.2), rgba(105, 180, 165, 0) 34%),
    linear-gradient(180deg, #020814 0%, #071321 100%);
}

.app-splash__mark {
  display: grid;
  width: 6.5rem;
  aspect-ratio: 1;
  place-items: center;
  overflow: hidden;
  border-radius: 1.75rem;
  box-shadow: 0 1.25rem 3rem rgba(0, 0, 0, 0.28);
}

.app-splash__mark img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-splash__title {
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.2;
}
</style>
