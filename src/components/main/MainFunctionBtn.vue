<script setup>
import nightIcon from "@/assets/images/commonIcon/night-view.svg";
import searchIcon from "@/assets/images/commonIcon/search.svg";
import bedIcon from "@/assets/images/commonIcon/bed.svg";
import foodIcon from "@/assets/images/commonIcon/food.svg";

const functionButtons = [
  { name: "검색", icon: searchIcon, color: "#111B2C", to: "/list" },
  { name: "관광지", icon: nightIcon, color: "#17243B", to: "/list?category=관광지" },
  { name: "숙소", icon: bedIcon, color: "#1C2E4B", to: "/list?category=숙소" },
  { name: "맛집", icon: foodIcon, color: "#283E65", to: "/list?category=맛집" },
];

// const functionButtons = [
//   { name: "지도", icon: mapIcon, color: "#111B2C", to: "/list" },
//   { name: "검색", icon: searchIcon, color: "#17243B", to: "/list" },
//   { name: "이벤트", icon: eventIcon, color: "#1C2E4B", to: "/" },
//   { name: "공지", icon: infoIcon, color: "#283E65", to: "/" },
// ];
</script>

<template>
  <section class="function-buttons" aria-label="Main page functions">
    <RouterLink
      v-for="button in functionButtons"
      :key="button.name"
      class="function-button"
      :to="button.to"
      :style="{ backgroundColor: button.color }"
    >
      <img :src="button.icon" :alt="button.name" />
      <p>{{ button.name }}</p>
    </RouterLink>
  </section>
</template>

<style scoped>
.function-buttons {
  max-width: 30rem;
  margin: 0 auto;
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
}

.function-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  aspect-ratio: 1/1;
  border: 1px solid #24324b;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 300;
  img {
    width: 1.5rem;
  }
}
</style>
