<script setup>
import { computed, ref } from "vue";
import { useMutation } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import { postLogin } from "@/api/auth";
import { setAuthSession } from "@/services/authSession";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const SUCCESS_CREDENTIALS = {
  email: "user1@test.com",
  password: "12345678",
};

const FAILURE_CREDENTIALS = {
  email: "user2@test.com",
  password: "123456789",
};

const attemptedCredentials = ref(null);

const loginMutation = useMutation({
  mutationFn: postLogin,
  meta: {
    errorMode: "local",
  },
  onSuccess: (data) => {
    console.log(data);
    setAuthSession(data);

    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    router.replace(redirect);
  },
});

const loginError = computed(() => loginMutation.error.value);

function requestLogin(credentials) {
  loginMutation.reset();
  attemptedCredentials.value = credentials;
  loginMutation.mutate(credentials);
}
</script>

<template>
  <main class="login-test-view">
    <section class="login-card">
      <header>
        <p class="eyebrow">MSW Login Test</p>
        <h1>로그인 API 테스트</h1>
        <p>두 버튼 모두 같은 로그인 API를 호출하며 전송하는 비밀번호만 다릅니다.</p>
      </header>

      <dl>
        <div>
          <dt>요청 주소</dt>
          <dd>POST /api/auth/login</dd>
        </div>
        <div>
          <dt>현재 Pinia 토큰</dt>
          <dd>{{ authStore.accessToken ? "저장됨" : "없음" }}</dd>
        </div>
      </dl>

      <div class="button-group">
        <button
          type="button"
          class="success-button"
          :disabled="loginMutation.isPending.value"
          @click="requestLogin(SUCCESS_CREDENTIALS)"
        >
          로그인 성공 요청
        </button>
        <button
          type="button"
          class="failure-button"
          :disabled="loginMutation.isPending.value"
          @click="requestLogin(FAILURE_CREDENTIALS)"
        >
          로그인 실패 요청
        </button>
      </div>

      <p v-if="loginMutation.isPending.value" class="status-message">로그인 요청 중...</p>

      <section v-if="attemptedCredentials" class="result">
        <h2>마지막 요청 Body</h2>
        <pre>{{ JSON.stringify(attemptedCredentials, null, 2) }}</pre>
      </section>

      <section v-if="loginError" class="result error-result">
        <h2>정규화된 로그인 에러</h2>
        <pre>{{
          JSON.stringify(
            {
              statusCode: loginError.statusCode,
              errorCode: loginError.errorCode,
              message: loginError.message,
            },
            null,
            2,
          )
        }}</pre>
      </section>
    </section>
  </main>
</template>

<style scoped>
.login-test-view {
  display: grid;
  min-height: calc(100vh - 8rem);
  padding: 2rem 1rem;
  place-items: center;
}

.login-card {
  width: min(100%, 32rem);
  padding: 1.5rem;
  background: rgba(28, 43, 61, 0.92);
  border: 1px solid rgba(117, 215, 255, 0.16);
  border-radius: 1rem;
}

.eyebrow {
  color: #75d7ff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin-top: 0.4rem;
  font-size: 1.45rem;
}

header > p:last-child,
.status-message {
  margin-top: 0.65rem;
  color: #aebdce;
  line-height: 1.5;
}

dl {
  display: grid;
  margin-top: 1.3rem;
  padding: 1rem;
  gap: 0.7rem;
  background: #0c1927;
  border-radius: 0.7rem;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

dt {
  color: #8fa2b6;
}

dd {
  color: #e1f7ff;
  text-align: right;
}

.button-group {
  display: grid;
  margin-top: 1.2rem;
  gap: 0.7rem;
}

button {
  min-height: 2.8rem;
  border-radius: 0.7rem;
  font-weight: 700;
}

.success-button {
  color: #06131f;
  background: #83ddff;
}

.failure-button {
  color: #ffdede;
  background: #6b3440;
}

button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.result {
  margin-top: 1.2rem;
}

.result h2 {
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
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

.error-result pre {
  color: #ffd4d4;
}
</style>
