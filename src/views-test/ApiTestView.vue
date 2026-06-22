<script setup>
import { computed } from "vue";
import { useMutation, useQuery } from "@tanstack/vue-query";
import {
  getApiTestSuccess,
  getAuthErrorTest,
  getServerErrorTest,
  postDuplicateEmailTest,
} from "@/api/test";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const successQuery = useQuery({
  queryKey: ["api-test", "success"],
  queryFn: getApiTestSuccess,
  enabled: false,
  meta: {
    errorMode: "local",
  },
});

const duplicateEmailMutation = useMutation({
  mutationFn: postDuplicateEmailTest,
  meta: {
    errorMode: "local",
  },
});

const serverErrorMutation = useMutation({
  mutationFn: getServerErrorTest,
});

const authErrorMutation = useMutation({
  mutationFn: getAuthErrorTest,
});

const successResult = computed(() => JSON.stringify(successQuery.data.value, null, 2));
const localErrorResult = computed(() => {
  const error = duplicateEmailMutation.error.value;

  if (!error) {
    return "";
  }

  return JSON.stringify(
    {
      name: error.name,
      type: error.type,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      message: error.message,
    },
    null,
    2,
  );
});

function runSuccessTest() {
  successQuery.refetch();
}

function runLocalErrorTest() {
  duplicateEmailMutation.mutate("duplicate@example.com");
}

function runServerErrorTest() {
  serverErrorMutation.mutate();
}

function runAuthErrorTest() {
  authStore.setAccessToken("expired-test-access-token");
  authErrorMutation.mutate();
}
</script>

<template>
  <main class="api-test-view">
    <header class="intro">
      <p class="eyebrow">Development tool</p>
      <h1>API 요청·에러 흐름 테스트</h1>
    </header>

    <section class="test-card">
      <div>
        <span class="step">01</span>
        <h2>성공 응답</h2>
        <p>TanStack Query가 공통 응답의 data 내부 값을 전달받는지 확인합니다.</p>
      </div>
      <button type="button" :disabled="successQuery.isFetching.value" @click="runSuccessTest">
        {{ successQuery.isFetching.value ? "요청 중..." : "성공 요청 실행" }}
      </button>
      <pre v-if="successResult">{{ successResult }}</pre>
    </section>

    <section class="test-card">
      <div>
        <span class="step">02</span>
        <h2>컴포넌트 로컬 에러</h2>
        <p>중복 이메일처럼 현재 화면에서 안내할 오류입니다. 에러 페이지로 이동하지 않습니다.</p>
      </div>
      <button
        type="button"
        :disabled="duplicateEmailMutation.isPending.value"
        @click="runLocalErrorTest"
      >
        중복 이메일 오류 실행
      </button>
      <pre v-if="localErrorResult" class="error-result">{{ localErrorResult }}</pre>
    </section>

    <section class="test-card">
      <div>
        <span class="step">03</span>
        <h2>전역 에러 페이지</h2>
        <p>컴포넌트에서 처리하지 않는 오류가 공통 에러 페이지로 이동하는지 확인합니다.</p>
      </div>
      <button
        type="button"
        :disabled="serverErrorMutation.isPending.value"
        @click="runServerErrorTest"
      >
        서버 오류 실행
      </button>
    </section>

    <section class="test-card">
      <div>
        <span class="step">04</span>
        <h2>인증 만료</h2>
        <p>Pinia에 테스트 토큰을 넣고 요청한 뒤, 인증 초기화와 로그인 이동을 확인합니다.</p>
      </div>
      <button type="button" :disabled="authErrorMutation.isPending.value" @click="runAuthErrorTest">
        인증 오류 실행
      </button>
      <p class="token-state">현재 메모리 토큰: {{ authStore.accessToken ? "있음" : "없음" }}</p>
    </section>
  </main>
</template>

<style scoped>
.api-test-view {
  display: grid;
  width: min(100% - 2rem, 48rem);
  margin: 0 auto;
  padding: 2rem 0 7rem;
  gap: 1rem;
}

.intro {
  padding: 1rem 0 1.5rem;
}

.eyebrow,
.step {
  color: #75d7ff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin-top: 0.4rem;
  font-size: 1.7rem;
}

.intro p:last-child,
.test-card p {
  margin-top: 0.65rem;
  color: #aebdce;
  font-size: 0.86rem;
  line-height: 1.6;
}

.test-card {
  display: grid;
  padding: 1.2rem;
  gap: 1rem;
  background: rgba(28, 43, 61, 0.92);
  border: 1px solid rgba(117, 215, 255, 0.16);
  border-radius: 1rem;
}

.test-card h2 {
  margin-top: 0.35rem;
  font-size: 1.05rem;
}

button {
  min-height: 2.7rem;
  padding: 0 1rem;
  color: #06131f;
  background: #83ddff;
  border-radius: 0.7rem;
  font-weight: 700;
}

button:disabled {
  cursor: wait;
  opacity: 0.55;
}

pre {
  overflow: auto;
  padding: 0.9rem;
  color: #d9f6ff;
  background: #091522;
  border-radius: 0.65rem;
  font-size: 0.75rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.error-result {
  color: #ffd7d7;
}

.token-state {
  margin: 0;
}
</style>
