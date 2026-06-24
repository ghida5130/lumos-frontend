<script setup>
import { computed, ref, watch } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { RouterLink, useRouter } from 'vue-router'
import { getEmailDuplicate, getNicknameDuplicate, postNewUser } from '@/api/auth'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const toastStore = useToastStore()

const email = ref('')
const password = ref('')
const nickname = ref('')
const checkedEmail = ref('')
const checkedNickname = ref('')
const isEmailAvailable = ref(false)
const isNicknameAvailable = ref(false)
const isCheckingEmail = ref(false)
const isCheckingNickname = ref(false)
const emailCheckMessage = ref('')
const nicknameCheckMessage = ref('')

const normalizedEmail = computed(() => email.value.trim())
const normalizedNickname = computed(() => nickname.value.trim())

const signupMutation = useMutation({
  mutationFn: postNewUser,
  meta: {
    errorMode: 'local',
  },
  onSuccess: () => {
    toastStore.success('회원가입이 완료되었습니다. 로그인해주세요.')
    router.replace({ name: 'home' })
  },
})

const canSubmit = computed(
  () =>
    normalizedEmail.value &&
    password.value &&
    normalizedNickname.value &&
    checkedEmail.value === normalizedEmail.value &&
    checkedNickname.value === normalizedNickname.value &&
    isEmailAvailable.value &&
    isNicknameAvailable.value &&
    !signupMutation.isPending.value,
)

const canCheckEmail = computed(
  () =>
    normalizedEmail.value &&
    checkedEmail.value !== normalizedEmail.value &&
    !isCheckingEmail.value &&
    !signupMutation.isPending.value,
)

const canCheckNickname = computed(
  () =>
    normalizedNickname.value &&
    checkedNickname.value !== normalizedNickname.value &&
    !isCheckingNickname.value &&
    !signupMutation.isPending.value,
)

const errorMessage = computed(() => {
  const error = signupMutation.error.value

  if (!error) return ''

  return error.response?.data?.message ?? error.message ?? '회원가입에 실패했습니다.'
})

function resetEmailCheck() {
  checkedEmail.value = ''
  isEmailAvailable.value = false
}

function resetNicknameCheck() {
  checkedNickname.value = ''
  isNicknameAvailable.value = false
}

async function checkEmail() {
  if (!canCheckEmail.value) return

  isCheckingEmail.value = true
  emailCheckMessage.value = ''

  try {
    const result = await getEmailDuplicate(normalizedEmail.value)

    checkedEmail.value = normalizedEmail.value
    isEmailAvailable.value = Boolean(result.available)
    emailCheckMessage.value = result.available
      ? '사용 가능한 이메일입니다.'
      : '이미 사용 중인 이메일입니다.'
  } catch {
    resetEmailCheck()
    emailCheckMessage.value = '이메일 중복 확인에 실패했습니다.'
  } finally {
    isCheckingEmail.value = false
  }
}

async function checkNickname() {
  if (!canCheckNickname.value) return

  isCheckingNickname.value = true
  nicknameCheckMessage.value = ''

  try {
    const result = await getNicknameDuplicate(normalizedNickname.value)

    checkedNickname.value = normalizedNickname.value
    isNicknameAvailable.value = Boolean(result.available)
    nicknameCheckMessage.value = result.available
      ? '사용 가능한 닉네임입니다.'
      : '이미 사용 중인 닉네임입니다.'
  } catch {
    resetNicknameCheck()
    nicknameCheckMessage.value = '닉네임 중복 확인에 실패했습니다.'
  } finally {
    isCheckingNickname.value = false
  }
}

function submitSignup() {
  if (!canSubmit.value) return

  signupMutation.reset()
  signupMutation.mutate({
    email: normalizedEmail.value,
    password: password.value,
    nickname: normalizedNickname.value,
  })
}

watch(email, () => {
  if (checkedEmail.value !== normalizedEmail.value) {
    resetEmailCheck()
    emailCheckMessage.value = normalizedEmail.value ? '이메일 중복 확인이 필요합니다.' : ''
  }
})

watch(nickname, () => {
  if (checkedNickname.value !== normalizedNickname.value) {
    resetNicknameCheck()
    nicknameCheckMessage.value = normalizedNickname.value ? '닉네임 중복 확인이 필요합니다.' : ''
  }
})
</script>

<template>
  <main class="signup-view">
    <section class="signup-panel" aria-labelledby="signup-title">
      <header class="signup-header">
        <p class="eyebrow">Lumos</p>
        <h1 id="signup-title">회원가입</h1>
        <p>야간 여행 기록과 저장한 장소를 나만의 계정에 담아보세요.</p>
      </header>

      <form class="signup-form" @submit.prevent="submitSignup">
        <div class="form-field">
          <span>이메일</span>
          <div class="check-row">
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="example@example.com"
              required
            />
            <button type="button" :disabled="!canCheckEmail" @click="checkEmail">
              {{ isCheckingEmail ? '확인 중' : '중복확인' }}
            </button>
          </div>
          <p
            v-if="emailCheckMessage"
            class="field-message"
            :class="{ 'field-message--success': isEmailAvailable }"
          >
            {{ emailCheckMessage }}
          </p>
        </div>

        <label>
          <span>비밀번호</span>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            placeholder="비밀번호를 입력하세요"
            required
          />
        </label>

        <div class="form-field">
          <span>닉네임</span>
          <div class="check-row">
            <input
              v-model="nickname"
              type="text"
              autocomplete="nickname"
              placeholder="닉네임을 입력하세요"
              required
            />
            <button type="button" :disabled="!canCheckNickname" @click="checkNickname">
              {{ isCheckingNickname ? '확인 중' : '중복확인' }}
            </button>
          </div>
          <p
            v-if="nicknameCheckMessage"
            class="field-message"
            :class="{ 'field-message--success': isNicknameAvailable }"
          >
            {{ nicknameCheckMessage }}
          </p>
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <button type="submit" :disabled="!canSubmit">
          {{ signupMutation.isPending.value ? '가입 중...' : '회원가입' }}
        </button>
      </form>

      <RouterLink class="login-link" :to="{ name: 'login' }">이미 계정이 있나요? 로그인</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.signup-view {
  display: grid;
  min-height: calc(100vh - 8rem);
  padding: 2rem 1rem 7rem;
  place-items: center;
  color: #f7f9fc;
}

.signup-panel {
  width: min(100%, 24rem);
}

.signup-header {
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

.signup-header p:last-child {
  margin-top: 0.7rem;
  color: #c7d1de;
  font-size: 0.88rem;
  line-height: 1.5;
}

.signup-form {
  display: grid;
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.45rem;
}

label span,
.form-field > span {
  color: #dce5ef;
  font-size: 0.82rem;
  font-weight: 700;
}

.form-field {
  display: grid;
  gap: 0.45rem;
}

.check-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 5.6rem;
  gap: 0.5rem;
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

.field-message {
  color: #ffbaba;
  font-size: 0.8rem;
  line-height: 1.45;
}

.field-message--success {
  color: #8fe6c8;
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

.check-row button {
  margin-top: 0;
  padding: 0 0.6rem;
  font-size: 0.78rem;
}

button:not(:disabled):active {
  background: #7dc7ba;
  transform: scale(0.99);
}

button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.login-link {
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
</style>
