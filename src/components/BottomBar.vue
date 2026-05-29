<script setup lang="ts">
import BottomBarButton from './buttons/BottomBarButton.vue'
import feedIcon from '../assets/bottomBar/feed.svg'
import homeIcon from '../assets/bottomBar/home.svg'
import mypageIcon from '../assets/bottomBar/mypage.svg'
import routeIcon from '../assets/bottomBar/route.svg'
import aiIcon from '../assets/bottomBar/ai.svg'

const bottomButtons = [
  {
    icon: '메인',
    link: '/',
    imagePath: homeIcon,
  },
  {
    icon: '여행지',
    link: '/route',
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
</script>

<template>
  <div class="wrap">
    <div class="bottom-bar">
      <div class="button-group">
        <BottomBarButton
          v-for="button in leftButtons"
          :key="button.icon"
          :icon="button.icon"
          :link="button.link"
          :image-path="button.imagePath"
        />
      </div>

      <a href="/create" class="center-button" aria-label="create">
        <img :src="aiIcon" alt="ai" class="icon" width="30px" />
      </a>

      <div class="button-group">
        <BottomBarButton
          v-for="button in rightButtons"
          :key="button.icon"
          :icon="button.icon"
          :link="button.link"
          :image-path="button.imagePath"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  position: fixed;
  display: flex;
  justify-content: center;
  bottom: 0;
  left: 0;
  z-index: 10;

  height: 5rem;
  width: 100vw;
}

.bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;

  width: min(95%, 1200px);
  height: 4.25rem;
  padding: 0 0.75rem;

  background: rgba(0, 0, 0, 0.25);
  border-radius: 1.25rem;
  backdrop-filter: blur(20px);
}

.button-group {
  display: flex;
  align-items: center;
  justify-content: space-around;

  width: calc((100% - 5.5rem) / 2);
  height: 100%;
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
  background: #3cd2ff;
  border: 4px solid var(--color-background);
  border-radius: 50%;
  box-shadow: 0 0.75rem 1.5rem rgba(66, 184, 131, 0.35);
}

.center-icon {
  font-size: 2rem;
  line-height: 1;
}
</style>
