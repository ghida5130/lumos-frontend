<script setup>
// 사용한 라이브러리
// 1. axios : 기존 fetch(API 요청)를 편하게 사용 (try-catch 구조 사용 가능)
// 2. tanstack/vue-query : 요청의 성공, 실패, 대기 등 서버 요청 상태를 편하게 관리

import axios from "axios";
import { computed, ref } from "vue";
import { useMutation } from "@tanstack/vue-query";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { setAuthSession } from "@/services/authSession";
import googleIcon from "@/assets/images/commonIcon/google.svg";

const route = useRoute();
const router = useRouter();

const email = ref("");
const password = ref("");
const googleLoginUrl = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/google`;

// axios 객체 생성 (요청 URL, 최대 대기시간, 헤더, bearer 설정)
const loginApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
});

// 생성한 axios 객체에 post, URL, body를 추가하여 바로 사용가능한 postLogin 함수 생성
async function postLogin(body) {
  const { data } = await loginApi.post("/api/auth/login", body);
  return data.data;
}

// vue-query에서 post 요청에 사용하는 useMutation
const loginMutation = useMutation({
  mutationFn: postLogin,
  meta: {
    errorMode: "local",
  },
  onSuccess: (data) => {
    setAuthSession(data);

    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    router.replace(redirect);
  },
});

// 이메일이 비었는지, 비밀번호가 비었는지, 요청이 진행중인지 확인하여 제출 가능 상태 확인 함수
// 셋 중 하나라도 false면 로그인 버튼 비활성화
const canSubmit = computed(
  () => email.value.trim() && password.value && !loginMutation.isPending.value,
);

// mutation의 에러 메시지 표시용 함수
const errorMessage = computed(() => {
  const error = loginMutation.error.value;

  if (!error) return "";

  return error.response?.data?.message ?? error.message ?? "로그인에 실패했습니다.";
});

// 로그인 버튼을 눌렀을때 실행되는 로그인 함수
function submitLogin() {
  if (!canSubmit.value) return;

  loginMutation.reset();
  loginMutation.mutate({
    email: email.value.trim(),
    password: password.value,
  });
}
</script>

<template>
  <main class="login-view">
    <section class="login-panel" aria-labelledby="login-title">
      <header class="login-header">
        <p class="eyebrow">Lumos</p>
        <h1 id="login-title">로그인</h1>
        <p>여행 코스와 저장한 장소를 이어서 확인하세요.</p>
      </header>

      <form class="login-form" @submit.prevent="submitLogin">
        <label>
          <span>이메일</span>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="example@example.com"
            required
          />
        </label>

        <label>
          <span>비밀번호</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="비밀번호를 입력하세요"
            required
          />
        </label>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <button type="submit" :disabled="!canSubmit">
          {{ loginMutation.isPending.value ? "로그인 중..." : "로그인" }}
        </button>
        <a class="google-login-link" :href="googleLoginUrl">
          <img class="google-login-icon" :src="googleIcon" alt="" aria-hidden="true" />
          구글 로그인
        </a>
      </form>

      <RouterLink class="signup-link" :to="{ name: 'signup' }">회원가입</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.login-view {
  display: grid;
  min-height: calc(100vh - 8rem);
  padding: 2rem 1rem 7rem;
  place-items: center;
  color: #f7f9fc;
}

.login-panel {
  width: min(100%, 24rem);
}

.login-header {
  margin-bottom: 1.75rem;
}

.eyebrow {
  color: #69b4a5;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin-top: 0.45rem;
  font-size: 1.7rem;
  font-weight: 800;
}

.login-header p:last-child {
  margin-top: 0.7rem;
  color: #c7d1de;
  font-size: 0.88rem;
  line-height: 1.5;
}

.login-form {
  display: grid;
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.45rem;
}

label span {
  color: #dce5ef;
  font-size: 0.82rem;
  font-weight: 700;
}

input {
  width: 100%;
  min-height: 3rem;
  padding: 0 0.95rem;
  color: #f7f9fc;
  background: #20262d;
  border: 1px solid #3b4148;
  border-radius: 0.7rem;
  font-size: 0.95rem;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

input::placeholder {
  color: #7f8a98;
}

input:focus {
  border-color: #69b4a5;
  box-shadow: 0 0 0 3px rgba(105, 180, 165, 0.16);
}

.error-message {
  color: #ffbaba;
  font-size: 0.8rem;
  line-height: 1.45;
}

button {
  min-height: 3rem;
  margin-top: 0.25rem;
  color: #071321;
  background: #69b4a5;
  border-radius: 0.7rem;
  font-size: 0.95rem;
  font-weight: 800;
  transition:
    background 0.2s ease,
    opacity 0.2s ease,
    transform 0.2s ease;
}

button:not(:disabled):active {
  background: #7dc7ba;
  transform: scale(0.99);
}

button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.signup-link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  margin-top: 0.85rem;
  color: #dce5ef;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.7rem;
  font-size: 0.86rem;
  font-weight: 700;
}

.google-login-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 3rem;
  color: #dce5ef;
  background: #20262d;
  border: 1px solid #3b4148;
  border-radius: 0.7rem;
  font-size: 0.95rem;
  font-weight: 800;
}

.google-login-icon {
  flex: 0 0 auto;
  width: 1.25rem;
  height: 1.25rem;
}
</style>
