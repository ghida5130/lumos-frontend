<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import BottomBarButton from './buttons/BottomBarButton.vue'
import feedIcon from '../assets/images/bottomBar/feed.svg'
import homeIcon from '../assets/images/bottomBar/home.svg'
import mypageIcon from '../assets/images/bottomBar/mypage.svg'
import routeIcon from '../assets/images/bottomBar/route.svg'
import aiIcon from '../assets/images/bottomBar/ai.svg'

const bottomButtons = [
  {
    icon: '메인',
    link: '/',
    imagePath: homeIcon,
  },
  {
    icon: '여행지',
    link: '/list',
    imagePath: routeIcon,
  },
  {
    icon: '피드',
    link: '/feed',
    imagePath: feedIcon,
  },
  {
    icon: '마이',
    link: '/mypage',
    imagePath: mypageIcon,
  },
]

const leftButtons = bottomButtons.slice(0, 2)
const rightButtons = bottomButtons.slice(2)

const COLLAPSE_SCROLL_DISTANCE = 80
const EXPAND_SCROLL_DISTANCE = 40
const isCompact = ref(false)
let lastScrollY = 0
let scrollDirection = 0
let directionalScrollDistance = 0

const getClampedScrollY = () => {
  const maxScrollY = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0)
  return Math.min(Math.max(window.scrollY, 0), maxScrollY)
}

const resetScrollTracking = (scrollY: number) => {
  lastScrollY = scrollY
  scrollDirection = 0
  directionalScrollDistance = 0
}

const handleScroll = () => {
  const currentScrollY = getClampedScrollY()
  const scrollDelta = currentScrollY - lastScrollY

  if (currentScrollY === 0) {
    isCompact.value = false
    resetScrollTracking(currentScrollY)
    return
  }

  if (scrollDelta === 0) {
    return
  }

  const currentDirection = Math.sign(scrollDelta)

  if (currentDirection !== scrollDirection) {
    scrollDirection = currentDirection
    directionalScrollDistance = 0
  }

  directionalScrollDistance += Math.abs(scrollDelta)

  if (!isCompact.value && currentDirection > 0 && directionalScrollDistance >= COLLAPSE_SCROLL_DISTANCE) {
    isCompact.value = true
    directionalScrollDistance = 0
  } else if (
    isCompact.value &&
    currentDirection < 0 &&
    directionalScrollDistance >= EXPAND_SCROLL_DISTANCE
  ) {
    isCompact.value = false
    directionalScrollDistance = 0
  }

  lastScrollY = currentScrollY
}

onMounted(() => {
  resetScrollTracking(getClampedScrollY())
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="wrap" :class="{ compact: isCompact }">
    <nav class="bottom-bar" aria-label="주요 메뉴">
      <div class="button-group">
        <BottomBarButton
          v-for="button in leftButtons"
          :key="button.icon"
          :icon="button.icon"
          :link="button.link"
          :image-path="button.imagePath"
          :compact="isCompact"
        />
      </div>

      <router-link :to="{ name: 'ai' }" class="center-button">
        <img :src="aiIcon" alt="AI 가이드" class="icon" width="30px" />
      </router-link>

      <div class="button-group">
        <BottomBarButton
          v-for="button in rightButtons"
          :key="button.icon"
          :icon="button.icon"
          :link="button.link"
          :image-path="button.imagePath"
          :compact="isCompact"
        />
      </div>
    </nav>
  </div>
</template>

<style scoped>
.wrap {
  position: fixed;
  display: flex;
  justify-content: center;
  bottom: 0;
  left: 0;
  z-index: 9999;

  height: 5rem;
  width: 100vw;
  pointer-events: none;
  transition: height 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;

  width: min(95%, 700px);
  height: 4.25rem;
  padding: 0 0.75rem;

  background: rgba(73, 73, 73, 0.5);
  border-radius: 5rem;
  backdrop-filter: blur(20px);
  pointer-events: auto;
  transition:
    width 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    padding 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    background-color 0.4s ease,
    box-shadow 0.4s ease;
}

.button-group {
  display: flex;
  align-items: center;
  justify-content: space-around;

  width: calc((100% - 5.5rem) / 2);
  height: 100%;
  transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.center-button {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 4.5rem;
  height: 4.5rem;
  margin-bottom: 1.75rem;

  color: white;
  text-decoration: none;
  background: #48cfff;
  border: 4px solid var(--color-background);
  border-radius: 50%;
  box-shadow: 0 0.75rem 1.5rem rgba(72, 207, 255, 0.3);
  transition:
    width 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    margin 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    border-width 0.4s ease,
    box-shadow 0.4s ease,
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.center-button .icon {
  transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.compact {
  height: 4rem;
}

.compact .bottom-bar {
  width: min(82%, 34rem);
  height: 3.15rem;
  padding: 0 0.5rem;
  background: rgba(55, 55, 55, 0.72);
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.22);
}

.compact .button-group {
  width: calc((100% - 4.25rem) / 2);
}

.compact .center-button {
  width: 3.6rem;
  height: 3.6rem;
  margin-bottom: 1rem;
  border-width: 3px;
  box-shadow: 0 0.5rem 1.1rem rgba(72, 207, 255, 0.24);
  transform: translateY(0.1rem);
}

.compact .center-button .icon {
  width: 1.45rem;
}

.center-icon {
  font-size: 2rem;
  line-height: 1;
}

@media (prefers-reduced-motion: reduce) {
  .wrap,
  .bottom-bar,
  .button-group,
  .center-button,
  .center-button .icon {
    transition-duration: 0.01ms;
  }
}
</style>
