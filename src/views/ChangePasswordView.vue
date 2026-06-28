<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { patchUserPassword } from '@/api/users'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const toastStore = useToastStore()

const currentPassword = ref('')
const currentPasswordConfirm = ref('')
const newPassword = ref('')
const fieldMessage = ref('')
const isSubmitting = ref(false)

const canSubmit = computed(
  () =>
    currentPassword.value &&
    currentPasswordConfirm.value &&
    newPassword.value &&
    !isSubmitting.value,
)

function validateCurrentPassword() {
  if (currentPassword.value !== currentPasswordConfirm.value) {
    fieldMessage.value = '입력한 현재 비밀번호가 서로 다릅니다.'
    return false
  }

  fieldMessage.value = ''
  return true
}

async function submitPasswordChange() {
  if (!canSubmit.value || !validateCurrentPassword()) return

  isSubmitting.value = true

  try {
    await patchUserPassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })

    toastStore.success('비밀번호가 변경되었습니다.')
    router.replace({ name: 'mypage' })
  } catch (error) {
    if (error.statusCode === 400) {
      fieldMessage.value = '입력한 현재 비밀번호가 일치하지 않습니다.'
    } else if (error.statusCode === 401) {
      toastStore.warning('로그인이 필요합니다.')
    } else {
      toastStore.error('비밀번호 변경에 실패했습니다.')
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="change-password-view">
    <section class="password-panel">
      <header class="password-heading">
        <h2>비밀번호 변경</h2>
        <p>현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.</p>
      </header>

      <form class="password-form" @submit.prevent="submitPasswordChange">
        <label>
          <span>현재 비밀번호</span>
          <input
            v-model="currentPassword"
            type="password"
            autocomplete="current-password"
            placeholder="현재 비밀번호를 입력해주세요"
            :disabled="isSubmitting"
          />
        </label>

        <label>
          <span>현재 비밀번호 확인</span>
          <input
            v-model="currentPasswordConfirm"
            type="password"
            autocomplete="current-password"
            placeholder="현재 비밀번호를 한 번 더 입력해주세요"
            :disabled="isSubmitting"
          />
        </label>

        <label>
          <span>새 비밀번호</span>
          <input
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            placeholder="새 비밀번호를 입력해주세요"
            :disabled="isSubmitting"
          />
        </label>

        <p v-if="fieldMessage" class="field-message">{{ fieldMessage }}</p>

        <button type="submit" :disabled="!canSubmit">
          {{ isSubmitting ? '변경 중' : '비밀번호 변경' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.change-password-view {
  min-height: calc(100vh - 3rem);
  padding: 1.4rem 1rem 7rem;
  color: #f7f9fc;
}

.password-panel {
  width: min(100%, 38rem);
  margin: 0 auto;
  padding: 1.1rem;
  background: #20262d;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0.85rem;
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.16);
}

.password-heading h2 {
  font-size: 1.05rem;
  font-weight: 800;
}

.password-heading p {
  margin-top: 0.55rem;
  color: #aeb8c7;
  font-size: 0.78rem;
  line-height: 1.55;
}

.password-form {
  display: grid;
  gap: 0.85rem;
  margin-top: 1.2rem;
}

.password-form label {
  display: grid;
  gap: 0.45rem;
}

.password-form span {
  color: #d6dfeb;
  font-size: 0.75rem;
  font-weight: 700;
}

.password-form input {
  width: 100%;
  min-height: 2.9rem;
  padding: 0 0.9rem;
  color: #f7f9fc;
  background: #121a25;
  border: 1px solid #314258;
  border-radius: 0.65rem;
  font-size: 0.85rem;
}

.password-form input::placeholder {
  color: #657286;
}

.password-form input:focus {
  border-color: #72d3ff;
  box-shadow: 0 0 0 0.18rem rgba(114, 211, 255, 0.12);
}

.field-message {
  color: #ffbaba;
  font-size: 0.8rem;
  line-height: 1.45;
}

.password-form button {
  min-height: 2.85rem;
  margin-top: 0.3rem;
  color: #071321;
  background: #8cddff;
  border-radius: 999px;
  box-shadow: 0 0.5rem 1.4rem rgba(72, 207, 255, 0.22);
  font-size: 0.86rem;
  font-weight: 900;
}

.password-form button:disabled {
  cursor: default;
  opacity: 0.5;
}
</style>
