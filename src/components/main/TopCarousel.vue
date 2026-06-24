<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import image3 from "@/assets/images/mock/carousel/3.jpg";
import image4 from "@/assets/images/mock/carousel/4.jpg";
import router from "@/router";

const destinations = [
  {
    name: "더베이 101",
    description:
      "마린시티의 화려한 야경과 바다 위에 비치는 도시 불빛을 함께 즐길 수 있는 부산의 대표 명소",
    tags: ["관광지", "먹거리", "술집"],
    image:
      "https://blog.kakaocdn.net/dna/owbKQ/btq2IPPuiQY/AAAAAAAAAAAAAAAAAAAAAFXcbzJj788GN7hFrgGlxGDDu40QtvZwsZ5pXfHSpeJJ/img.jpg?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1782831599&allow_ip=&allow_referer=&signature=IuETOZkZJIjBJvSRIZgvoHqP0SM%3D",
    placeId: 1029,
  },
  {
    name: "해동 용궁사",
    description:
      "푸른 바다를 마주한 사찰에서 고즈넉한 분위기와 탁 트인 해안 풍경을 느낄 수 있는 명소",
    tags: ["야경", "바다", "도시"],
    image:
      "https://mblogthumb-phinf.pstatic.net/MjAxNzA1MDlfNDgg/MDAxNDk0MzM1MTY4NzU3.A_71tvpaJmv3Wczu17uJITsLpEdskga_k0n0_1-8Abwg.lqGCLkBJJDXJ8KE0GbU5icYJ0BPkONlulz-nsUw4Y1Mg.JPEG.imck81/CK8_3289.jpg?type=w800",
    placeId: 1066,
  },
  {
    name: "여수",
    description: "여수 밤바다와 따뜻한 조명이 만들어내는 낭만적인 분위기",
    tags: ["야경", "감성", "바다"],
    image: image3,
    placeId: null,
  },
  {
    name: "부산",
    description: "도시의 불빛과 해안선을 한눈에 담을 수 있는 부산의 화려한 밤",
    tags: ["야경", "도시"],
    image: image4,
    placeId: null,
  },
  {
    name: "광안리 해수욕장",
    description:
      "광안대교의 야경과 넓은 바다를 배경으로 산책과 휴식을 즐기기 좋은 부산의 대표 해변",
    tags: ["야경", "감성", "산책"],
    image:
      "https://media.triple.guide/triple-cms/c_limit,f_auto,h_1024,w_1024/81442898-e992-4be8-9b40-1df1b0ab50e8.jpeg",
    placeId: 1025,
  },
];

const carouselViewport = ref(null);
const displayIndex = ref(1);
const dragOffset = ref(0);
const isDragging = ref(false);
const isResetting = ref(false);
const startX = ref(0);
const hasDragged = ref(false);
const dragResetTimer = ref(null);
const autoPlayTimer = ref(null);
const stepPx = ref(0);
const itemPx = ref(0);
const gapPx = ref(0);
const resizeObserver = ref(null);

const itemWidthRatio = 0.85;
const sideGapRatio = 0.04;

const goToDetail = (destination, event) => {
  if (hasDragged.value) {
    event?.preventDefault();
    event?.stopPropagation();
    clearDragResetTimer();
    hasDragged.value = false;
    return;
  }

  if (destination.placeId) {
    router.push({
      name: "detail",
      query: {
        id: destination.placeId,
      },
    });
    return;
  }

  router.push({
    name: "list",
    query: {
      keyword: destination.name,
    },
  });
};

const carouselItems = computed(() => [
  destinations[destinations.length - 1],
  ...destinations,
  destinations[0],
]);

const carouselStyle = computed(() => ({
  transform: `translate3d(${-displayIndex.value * stepPx.value + dragOffset.value}px, 0, 0)`,
  transition: isDragging.value || isResetting.value ? "none" : "transform 360ms ease",
  "--carousel-item-width": `${itemPx.value}px`,
  "--carousel-gap": `${gapPx.value}px`,
  "--carousel-side-space": `${(carouselViewport.value?.clientWidth ?? 0) * 0.075}px`,
}));

const getItemStyle = (image) => ({
  backgroundImage: image
    ? `linear-gradient(180deg, rgba(5, 11, 20, 0) 0%, rgba(5, 11, 20, 0) 30%, rgba(5, 11, 20, 0.7)), url(${image})`
    : "linear-gradient(135deg, #202a39, #0f1724 48%, #2b3544)",
});

const goToNext = () => {
  displayIndex.value += 1;
};

const goToPrev = () => {
  displayIndex.value -= 1;
};

const measureCarousel = () => {
  const viewportWidth = carouselViewport.value?.clientWidth ?? 0;
  itemPx.value = viewportWidth * itemWidthRatio;
  gapPx.value = viewportWidth * sideGapRatio;
  stepPx.value = itemPx.value + gapPx.value;
};

const resetLoopPosition = (index) => {
  isResetting.value = true;
  displayIndex.value = index;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isResetting.value = false;
    });
  });
};

const handleTransitionEnd = (event) => {
  if (event.propertyName !== "transform") return;

  if (displayIndex.value === destinations.length + 1) {
    resetLoopPosition(1);
    return;
  }

  if (displayIndex.value === 0) {
    resetLoopPosition(destinations.length);
  }
};

const stopAutoPlay = () => {
  if (!autoPlayTimer.value) return;
  clearInterval(autoPlayTimer.value);
  autoPlayTimer.value = null;
};

const clearDragResetTimer = () => {
  if (!dragResetTimer.value) return;
  clearTimeout(dragResetTimer.value);
  dragResetTimer.value = null;
};

const startAutoPlay = () => {
  stopAutoPlay();
  autoPlayTimer.value = setInterval(goToNext, 10000);
};

const getClientX = (event) => event.touches?.[0]?.clientX ?? event.clientX;

const handleDragStart = (event) => {
  clearDragResetTimer();
  stopAutoPlay();
  isDragging.value = true;
  hasDragged.value = false;
  startX.value = getClientX(event);
};

const handleDragMove = (event) => {
  if (!isDragging.value) return;
  dragOffset.value = getClientX(event) - startX.value;
};

const handleDragEnd = () => {
  if (!isDragging.value) return;

  const threshold = 48;
  const didSlide = Math.abs(dragOffset.value) >= threshold;

  if (dragOffset.value <= -threshold) {
    goToNext();
  } else if (dragOffset.value >= threshold) {
    goToPrev();
  }

  hasDragged.value = didSlide;

  isDragging.value = false;
  dragOffset.value = 0;
  startAutoPlay();

  clearDragResetTimer();
  dragResetTimer.value = setTimeout(() => {
    hasDragged.value = false;
    dragResetTimer.value = null;
  }, 450);
};

onMounted(() => {
  measureCarousel();
  startAutoPlay();

  if (window.ResizeObserver && carouselViewport.value) {
    resizeObserver.value = new ResizeObserver(measureCarousel);
    resizeObserver.value.observe(carouselViewport.value);
  } else {
    window.addEventListener("resize", measureCarousel);
  }
});

onBeforeUnmount(() => {
  stopAutoPlay();
  clearDragResetTimer();
  resizeObserver.value?.disconnect();
  window.removeEventListener("resize", measureCarousel);
});
</script>

<template>
  <section
    class="travel-carousel"
    aria-label="Travel destination carousel"
    @mouseenter="stopAutoPlay"
    @mouseleave="startAutoPlay"
  >
    <div ref="carouselViewport" class="carousel-viewport">
      <div
        class="carousel-track"
        :style="carouselStyle"
        @transitionend="handleTransitionEnd"
        @mousedown="handleDragStart"
        @mousemove="handleDragMove"
        @mouseup="handleDragEnd"
        @mouseleave="handleDragEnd"
        @touchstart.passive="handleDragStart"
        @touchmove.passive="handleDragMove"
        @touchend="handleDragEnd"
        @touchcancel="handleDragEnd"
      >
        <article
          v-for="(destination, index) in carouselItems"
          :key="`${destination.name}-${index}`"
          class="carousel-item"
          :style="getItemStyle(destination.image)"
        >
          <button class="item-button" @click="goToDetail(destination, $event)">
            <div class="item-content">
              <div class="item-tags">
                <span v-for="tag in destination.tags" :key="tag">#{{ tag }}</span>
              </div>
              <h2>{{ destination.name }}</h2>
              <p>{{ destination.description }}</p>
            </div>
          </button>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.travel-carousel {
  width: 100%;
  overflow: hidden;
}

.carousel-viewport {
  width: 100%;
  overflow: visible;
}

.carousel-track {
  display: flex;
  gap: var(--carousel-gap);
  padding: 0 var(--carousel-side-space);
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
  will-change: transform;
}

.carousel-track:active {
  cursor: grabbing;
}

.carousel-item {
  position: relative;
  flex: 0 0 var(--carousel-item-width);
  height: 15rem;
  overflow: hidden;
  border-radius: 0.5rem;
  background-color: #111827;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  /* border: 2px solid rgba(255, 255, 255, 0.36); */
}

.item-button {
  text-align: left;
  height: 100%;
  width: 100%;
}

.item-content {
  position: absolute;
  right: 1.1rem;
  bottom: 1.1rem;
  left: 1.1rem;
  z-index: 1;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.55rem;
}

.item-tags span {
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 999px;
  padding: 0.28rem 0.55rem;
  background: rgba(5, 11, 20, 0.46);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.72rem;
  line-height: 1;
  backdrop-filter: blur(0.4rem);
}

.item-content h2 {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 700;
  letter-spacing: 0;
}

.item-content p {
  max-width: 24rem;
  margin: 0.35rem 0 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.9rem;
  line-height: 1.45;
}

@media (max-width: 480px) {
  .carousel-item {
    height: 15rem;
  }

  .item-content h2 {
    font-size: 1.35rem;
  }
}
</style>
