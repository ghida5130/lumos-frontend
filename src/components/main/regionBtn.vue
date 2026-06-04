<script setup>
import seoulIcon from '@/assets/images/regionIcon/seoul.svg'
import busanIcon from '@/assets/images/regionIcon/busan.svg'
import jeonjuIcon from '@/assets/images/regionIcon/jeonju.svg'
import incheonIcon from '@/assets/images/regionIcon/incheon.svg'
import gangneungIcon from '@/assets/images/regionIcon/gangneung.svg'
import daejeonIcon from '@/assets/images/regionIcon/daejeon.svg'
import tongyeongIcon from '@/assets/images/regionIcon/tongyeong.svg'

const functionButtons = [
  { name: '서울', icon: seoulIcon },
  { name: '부산', icon: busanIcon },
  { name: '전주', icon: jeonjuIcon },
  { name: '인천', icon: incheonIcon },
  { name: '강릉', icon: gangneungIcon },
  { name: '대전', icon: daejeonIcon },
  { name: '통영', icon: tongyeongIcon },
]
</script>

<template>
  <section>
    <div class="title">
      <h3>지역별 야간 스팟</h3>
      <p>지역명으로 빠르게 관광지 탐색하기</p>
    </div>
    <div class="function-buttons">
      <button v-for="button in functionButtons" :key="button" class="function-button" type="button">
        <div>
          <img :src="button.icon" alt="seoul button" />
        </div>
        {{ button.name }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.title {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0.5rem auto 0;
  padding: 0.5rem 1.5rem;

  h3 {
    font-weight: 500;
    font-size: 1.25rem;
  }
  p {
    font-weight: 200;
    font-size: 0.75rem;
  }
}

.function-buttons {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  font-size: 0.75rem;
}

.function-buttons::-webkit-scrollbar {
  display: none;
}

.function-button {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  div {
    width: 3.5rem;
    aspect-ratio: 1 / 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  img {
    width: 1.5rem;
    height: 1.5rem;
  }
}
</style>
