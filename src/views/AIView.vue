<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const messages = ref([
  {
    id: 1,
    role: 'assistant',
    content:
      '반갑습니다! 저는 당신의 야간 여행을 가이드할 Lumina AI입니다.\n\n어떤 밤의 여행을 꿈꾸시나요? 선호하는 분위기나 지역을 말씀해주세요.',
    sentAt: '8:42',
  },
  {
    id: 2,
    role: 'user',
    content: '서울에서 조용히 야경을 즐길 수 있는 곳을 추천해줘.',
    sentAt: '8:43',
  },
  {
    id: 3,
    role: 'assistant',
    content:
      '조용한 야경을 원하신다면 낙산공원 성곽길을 추천해요. 늦은 시간에는 비교적 한적하고, 성곽 너머로 서울 도심의 불빛을 천천히 감상할 수 있어요.\n\n편한 신발과 얇은 겉옷을 챙겨가세요.',
    sentAt: '8:43',
  },
  {
    id: 4,
    role: 'user',
    content: '근처에서 따뜻한 차를 마실 수 있는 곳도 있을까?',
    sentAt: '8:45',
  },
  {
    id: 5,
    role: 'assistant',
    content:
      '네, 성곽길을 내려온 뒤 대학로 방향으로 이동하면 늦게까지 운영하는 카페를 찾기 좋아요. 조용한 분위기를 원한다면 큰길보다 혜화동 안쪽 골목을 둘러보는 것을 추천해요.',
    sentAt: '8:45',
  },
  {
    id: 6,
    role: 'user',
    content: '걷는 시간은 어느 정도로 잡으면 좋을까?',
    sentAt: '8:47',
  },
  {
    id: 7,
    role: 'assistant',
    content:
      '낙산공원 입구부터 전망 구간을 천천히 둘러보고 대학로까지 내려오는 코스는 약 1시간 30분 정도예요.\n\n사진을 찍거나 중간에 쉬는 시간을 포함한다면 2시간 정도로 계획해 주세요.',
    sentAt: '8:47',
  },
  {
    id: 8,
    role: 'user',
    content: '대중교통으로 가는 방법과 마지막으로 챙길 것을 정리해줘.',
    sentAt: '8:49',
  },
  {
    id: 9,
    role: 'assistant',
    content:
      '혜화역에서 출발하면 낙산공원 입구까지 도보로 약 15분 정도 걸려요.\n\n출발 전에는 귀가 시간대의 지하철 운행 시간을 확인하고, 편한 신발과 얇은 겉옷, 보조 배터리를 챙겨주세요. 성곽길 일부는 어두울 수 있으니 밝은 길을 이용하는 것도 잊지 마세요.',
    sentAt: '8:50',
  },
])

const prompt = ref('')
const conversation = ref(null)

onMounted(() => {
  document.body.classList.add('ai-scroll-lock')
})

onBeforeUnmount(() => {
  document.body.classList.remove('ai-scroll-lock')
})

const scrollToLatestMessage = async () => {
  await nextTick()
  conversation.value?.scrollTo({
    top: conversation.value.scrollHeight,
    behavior: 'smooth',
  })
}

const submitPrompt = () => {
  const content = prompt.value.trim()

  if (!content) return

  messages.value.push({
    id: Date.now(),
    role: 'user',
    content,
    sentAt: new Intl.DateTimeFormat('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date()),
  })
  prompt.value = ''
  scrollToLatestMessage()
}
</script>

<template>
  <main class="ai-view">
    <section ref="conversation" class="conversation">
      <header class="guide-heading">
        <span class="guide-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="m12 5 .75 2.25L15 8l-2.25.75L12 11l-.75-2.25L9 8l2.25-.75L12 5Z" />
            <path d="m17.5 11 .5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5Z" />
            <path d="m8 13 .6 1.9 1.9.6-1.9.6L8 18l-.6-1.9-1.9-.6 1.9-.6L8 13Z" />
          </svg>
        </span>
        <h1>Lumina AI Guide</h1>
      </header>

      <ol class="message-list">
        <li
          v-for="message in messages"
          :key="message.id"
          class="message-row"
          :class="`message-row--${message.role}`"
        >
          <article class="message">
            <p>{{ message.content }}</p>
          </article>
          <time>{{ message.sentAt }}</time>
        </li>
      </ol>
    </section>

    <form class="prompt-form" @submit.prevent="submitPrompt">
      <button class="add-button" type="button" aria-label="첨부하기">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      </button>

      <label class="prompt-label" for="ai-prompt">AI에게 여행 취향 묻기</label>
      <textarea
        id="ai-prompt"
        v-model="prompt"
        rows="1"
        placeholder="분위기, 장소, 취향을 입력하세요"
        @keydown.enter.exact.prevent="submitPrompt"
      ></textarea>

      <button
        class="send-button"
        type="submit"
        :disabled="!prompt.trim()"
        aria-label="메시지 보내기"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 18V6m0 0-5 5m5-5 5 5" />
        </svg>
      </button>
    </form>
  </main>
</template>

<style scoped>
.ai-view {
  position: fixed;
  inset: 3rem 0 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  color: #f7f9fc;
  background: transparent;
}

.conversation {
  flex: 1;
  width: min(100%, 48rem);
  margin: 0 auto;
  padding: 1.25rem 1rem 8rem;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scrollbar-width: thin;
  scrollbar-color: #314258 transparent;
  -webkit-overflow-scrolling: touch;
}

.guide-heading {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.guide-heading h1 {
  color: #d8e2ee;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.guide-mark {
  display: grid;
  flex: 0 0 auto;
  width: 1.8rem;
  height: 1.8rem;
  place-items: center;
  color: #07111d;
  background: #48cfff;
  border-radius: 50%;
  box-shadow: 0 0 1.1rem rgba(72, 207, 255, 0.22);
}

.guide-mark svg {
  width: 1rem;
  fill: currentColor;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.message-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: min(86%, 34rem);
}

.message-row--user {
  align-self: flex-end;
  align-items: flex-end;
}

.message {
  padding: 0.95rem 1rem;
  background: #172233;
  border: 1px solid #314258;
  border-radius: 0.4rem 1rem 1rem;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.12);
}

.message-row--user .message {
  color: #07111d;
  background: #72d3ff;
  border-color: #72d3ff;
  border-radius: 1rem 0.4rem 1rem 1rem;
}

.message p {
  overflow-wrap: anywhere;
  font-size: 0.9rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.message-row time {
  margin: 0.4rem 0.25rem 0;
  color: #657286;
  font-size: 0.62rem;
}

.prompt-form {
  position: fixed;
  right: 0;
  bottom: 1rem;
  left: 0;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: calc(100% - 2rem);
  max-width: 46rem;
  min-height: 3.25rem;
  margin: 0 auto;
  padding: 0.45rem 0.55rem 0.45rem 0.7rem;
  background: rgba(23, 34, 51, 0.9);
  border: 1px solid #314258;
  border-radius: 1.8rem;
  box-shadow:
    0 0 1.5rem rgba(72, 207, 255, 0.14),
    0 0.75rem 2rem rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(1rem);
}

.prompt-label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.prompt-form textarea {
  flex: 1;
  min-width: 0;
  max-height: 6rem;
  padding: 0.55rem 0;
  color: #f7f9fc;
  line-height: 1.35;
}

.prompt-form textarea::placeholder {
  color: #657286;
  font-size: 0.78rem;
}

.add-button,
.send-button {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
}

.add-button {
  width: 1.5rem;
  height: 1.5rem;
  color: #a7b3c2;
}

.add-button svg {
  width: 1.35rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.4;
}

.send-button {
  width: 2.35rem;
  height: 2.35rem;
  color: #07111d;
  background: #72d3ff;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.send-button:not(:disabled):active {
  transform: scale(0.94);
}

.send-button:disabled {
  opacity: 0.48;
  cursor: default;
}

.send-button svg {
  width: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

@media (min-width: 600px) {
  .conversation {
    padding-right: 1.5rem;
    padding-left: 1.5rem;
  }

  .message-row {
    max-width: min(76%, 34rem);
  }
}
</style>
