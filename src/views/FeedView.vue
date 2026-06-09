<script setup>
import image1 from '@/assets/images/mock/carousel/1.jpg'
import image2 from '@/assets/images/mock/carousel/2.jpg'
import image3 from '@/assets/images/mock/carousel/3.jpg'
import image4 from '@/assets/images/mock/carousel/4.jpg'
import image5 from '@/assets/images/mock/carousel/5.jpg'

const posts = [
  {
    id: 1,
    author: 'night_explorer',
    location: '여수 돌산대교',
    avatar: image1,
    image: image1,
    title: '바다 위에서 만난 푸른빛',
    content:
      '사진보다 실제 풍경이 훨씬 근사했어요. 잔잔한 수면 위로 번지는 불빛을 보고 있으니 여행의 피로가 모두 사라지는 기분이었습니다.',
    createdAt: '2시간 전',
  },
  {
    id: 2,
    author: 'urban_voyager',
    location: '부산 영도',
    avatar: image4,
    title: '부산항대교 야경 산책',
    content:
      '천천히 걸으며 바라본 부산항의 밤은 그 자체로 충분한 여행이었어요. Lumina가 추천해 준 동선을 따라가니 조용한 전망 포인트도 발견할 수 있었습니다.',
    createdAt: '4시간 전',
  },
  {
    id: 3,
    author: 'slow_weekender',
    location: '서울 여의도',
    avatar: image3,
    image: image3,
    title: '퇴근 후 한강에서',
    content:
      '복잡한 하루가 끝난 뒤 강바람을 맞으며 잠깐 쉬어 갔어요. 멀리 가지 않아도 여행 같은 순간을 만날 수 있네요.',
    createdAt: '어제',
  },
  {
    id: 4,
    author: 'hanok_moment',
    location: '전주 한옥마을',
    avatar: image5,
    image: image5,
    title: '골목에 내려앉은 저녁',
    content:
      '사람이 조금씩 줄어드는 저녁 시간의 한옥마을을 추천해요. 따뜻한 조명과 고요한 골목이 오래 기억에 남았습니다.',
    createdAt: '2일 전',
  },
  {
    id: 5,
    author: 'blue_hour',
    location: '부산 광안리',
    avatar: image2,
    title: '비 온 뒤 더 선명했던 밤',
    content:
      '비가 그친 직후라 공기가 맑고 도시의 불빛도 유난히 선명했어요. 다음에는 해 질 무렵부터 천천히 머물러 보고 싶습니다.',
    createdAt: '3일 전',
  },
]
</script>

<template>
  <main class="feed-view">
    <section class="feed-list">
      <h2 class="section-title">여행자들의 새로운 이야기</h2>

      <article
        v-for="post in posts"
        :key="post.id"
        class="feed-card"
        :class="{ 'feed-card--text': !post.image }"
      >
        <header class="post-header">
          <img class="avatar" :src="post.avatar" :alt="`${post.author} 프로필`" />
          <div class="author-info">
            <strong>@{{ post.author }}</strong>
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
                <circle cx="12" cy="10" r="2" />
              </svg>
              {{ post.location }}
            </span>
          </div>
          <button class="more-button" type="button" aria-label="게시물 메뉴">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </header>

        <figure v-if="post.image" class="post-media">
          <img :src="post.image" :alt="post.title" />
        </figure>

        <div class="post-content">
          <footer class="post-actions">
            <div>
              <button type="button" aria-label="좋아요">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
                </svg>
              </button>
              <button type="button" aria-label="댓글">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
                </svg>
              </button>
              <button type="button" aria-label="공유">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m22 2-7 20-4-9-9-4 20-7Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </div>
            <button type="button" aria-label="저장">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-4-7 4V4Z" />
              </svg>
            </button>
          </footer>

          <h3>{{ post.title }}</h3>
          <p>{{ post.content }}</p>
          <time>{{ post.createdAt }}</time>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.feed-view {
  min-height: calc(100vh - 3rem);
  padding: 0.75rem 0 6.5rem;
  color: #f7f9fc;
  background: transparent;
}

.feed-list {
  width: min(calc(100% - 1.5rem), 38rem);
  margin: 0 auto;
}

.section-title {
  margin: 0.4rem 0 1rem;
  color: #91a0b4;
  font-size: 0.75rem;
  font-weight: 500;
}

.feed-card {
  overflow: hidden;
  margin-bottom: 1.5rem;
  background: #172233;
  border: 1px solid #314258;
  border-radius: 0.75rem;
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.15);
}

.feed-card--text {
  border-top-color: #72d3ff;
  border-left: 3px solid #72d3ff;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 3.5rem;
  padding: 0.65rem 0.8rem;
}

.avatar {
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  object-fit: cover;
  border: 1px solid #48cfff;
  border-radius: 50%;
}

.author-info {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 0.3rem;
}

.author-info strong {
  overflow: hidden;
  color: #dce5ee;
  font-size: 0.72rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-info span {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  color: #72d3ff;
  font-size: 0.58rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.author-info svg {
  width: 0.65rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
}

.more-button {
  width: 1.5rem;
  height: 1.5rem;
  color: #91a0b4;
}

.more-button svg {
  width: 100%;
  fill: currentColor;
}

.post-media {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #0e1826;
}

.post-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-content {
  padding: 0.75rem 0.85rem 0.9rem;
}

.feed-card--text .post-content {
  margin: 0 0.8rem 0.9rem;
  padding: 0.9rem;
  background: rgba(10, 19, 32, 0.25);
  border: 1px solid #28394f;
  border-radius: 0.5rem;
}

.post-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.post-actions div {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.post-actions button {
  width: 1.25rem;
  height: 1.25rem;
  color: #b8c5d3;
}

.post-actions button:first-child {
  color: #72d3ff;
}

.post-actions svg {
  width: 100%;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

.post-content h3 {
  color: #dce5ee;
  font-size: 0.82rem;
  font-weight: 600;
}

.feed-card--text .post-content h3 {
  color: #8cddff;
}

.post-content p {
  margin-top: 0.65rem;
  color: #b6c0cd;
  font-size: 0.82rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.post-content time {
  display: block;
  margin-top: 1rem;
  color: #657286;
  font-size: 0.6rem;
}

@media (min-width: 640px) {
  .feed-view {
    padding-top: 1.25rem;
  }

  .post-media {
    aspect-ratio: 16 / 10;
  }
}
</style>
