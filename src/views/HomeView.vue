<script setup>
import ContentCarousel from "@/components/main/ContentCarousel.vue";
import MainFunctionBtn from "@/components/main/MainFunctionBtn.vue";
import RegionBtn from "@/components/main/regionBtn.vue";
import TopCarousel from "@/components/main/TopCarousel.vue";
import image1 from "@/assets/images/mock/carousel/1.jpg";
import image2 from "@/assets/images/mock/carousel/2.jpg";
import image3 from "@/assets/images/mock/carousel/3.jpg";
import image4 from "@/assets/images/mock/carousel/4.jpg";
import imagea1 from "@/assets/images/mock/carousel/a1.jpg";
import imagea2 from "@/assets/images/mock/carousel/a2.jpg";
import imagea3 from "@/assets/images/mock/carousel/a3.jpg";
import imagea4 from "@/assets/images/mock/carousel/a4.jpg";
import imageb1 from "@/assets/images/mock/carousel/b1.jpg";
import imageb2 from "@/assets/images/mock/carousel/b2.jpg";
import imageb3 from "@/assets/images/mock/carousel/b3.jpg";
import imageb4 from "@/assets/images/mock/carousel/b4.jpg";

const carouselItems1 = [
  {
    id: 1,
    title: "광안리 해수욕장",
    location: "부산 수영구",
    rating: "92",
    image: image1,
    placeId: 1025,
  },
  {
    id: 2,
    title: "돌산대교",
    location: "전남 여수",
    rating: "86",
    image: image2,
    placeId: 24,
  },
  {
    id: 3,
    title: "한강공원",
    location: "서울 여의도",
    rating: "35",
    image: image3,
    placeId: 1,
  },
  {
    id: 4,
    title: "전주 한옥마을",
    location: "전북 전주",
    rating: "31",
    image: image4,
    placeId: 1,
  },
];

const carouselItems2 = [
  {
    id: 1,
    title: "여수예술랜드",
    location: "여수 돌산읍",
    rating: "186",
    image: imagea1,
    placeId: 45,
  },
  {
    id: 2,
    title: "여수 선소유적",
    location: "여수 선소마을길",
    rating: "92",
    image: imagea2,
    placdId: 30,
  },
  {
    id: 3,
    title: "종포 해양공원",
    location: "여수 중앙동",
    rating: "34",
    image: imagea3,
    placeId: 2,
  },
  {
    id: 4,
    title: "돌산 공원",
    location: "여수 돌산읍",
    rating: "11",
    image: imagea4,
    placeId: 4,
  },
];

const carouselItems3 = [
  {
    id: 1,
    title: "웨이브온 커피",
    location: "부산광역시 기장군",
    rating: "186",
    image: imageb1,
    placeId: 1067,
  },
  {
    id: 2,
    title: "도희네 조개구이",
    location: "부산광역시 해운대구",
    rating: "32",
    image: imageb2,
    placeId: 1065,
  },
  {
    id: 3,
    title: "금수복국 해운대",
    location: "부산광역시 해운대구",
    rating: "17",
    image: imageb3,
    placeId: 1036,
  },
  {
    id: 4,
    title: "카엘리움",
    location: "부산광역시 북구",
    rating: "11",
    image: imageb4,
    placeId: 1033,
  },
];
</script>

<template>
  <main class="home-view">
    <!-- <RouterLink to="/api-test">api test</RouterLink>
    <RouterLink to="/path-api-test">path api test</RouterLink>
    <RouterLink to="/multipart-api-test">multipart api test</RouterLink> -->
    <TopCarousel />
    <MainFunctionBtn />
    <RegionBtn />
    <ContentCarousel
      :data="carouselItems1"
      title="오늘의 인기 여행지"
      desc="방문 만족도가 높은 여행 명소"
    />
    <ContentCarousel
      :data="carouselItems2"
      title="여수의 야경 명소"
      desc="요즘 뜨는 여수의 야경 명소들"
    />
    <ContentCarousel
      :data="carouselItems3"
      title="부산 레전드 맛집"
      desc="부산인들이 인정한 최고의 맛집"
    />
  </main>
</template>

<style scoped>
.home-view {
  min-height: 100vh;
  padding: 1.25rem 0;
  overflow-x: hidden;
}

.bottom-margin {
  height: 5rem;
}

@media (max-width: 480px) {
  .home-view {
    padding-top: 1rem;
  }
}
</style>
