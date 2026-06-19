<script setup>
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { deleteUser } from '@/api/users'
import { clearAuthSession } from '@/services/authSession'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const toastStore = useToastStore()

const password = ref('')
const isConfirmOpen = ref(false)
const isSubmitting = ref(false)

const canSubmit = computed(() => password.value.trim().length > 0 && !isSubmitting.value)

function openConfirm() {
  if (!canSubmit.value) return

  isConfirmOpen.value = true
}

function closeConfirm() {
  if (isSubmitting.value) return

  isConfirmOpen.value = false
}

async function submitWithdraw() {
  if (!canSubmit.value) return

  isSubmitting.value = true

  try {
    await deleteUser({ password: password.value })
    isConfirmOpen.value = false
    clearAuthSession()
    await nextTick()
    toastStore.success('회원탈퇴가 완료되었습니다.')
    router.replace('/')
  } catch (error) {
    isConfirmOpen.value = false
    await nextTick()

    if (error.statusCode === 400) {
      toastStore.warning('비밀번호가 일치하지 않습니다.')
    } else if (error.statusCode === 401) {
      toastStore.warning('로그인이 필요합니다.')
    } else {
      toastStore.error('회원탈퇴 처리에 실패했습니다.')
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="withdraw-view">
    <section class="withdraw-panel">
      <header class="withdraw-heading">
        <h2>회원 탈퇴</h2>
        <p>계정 삭제를 진행하려면 현재 비밀번호를 입력해주세요.</p>
      </header>

      <form class="withdraw-form" @submit.prevent="openConfirm">
        <label for="withdraw-password">비밀번호</label>
        <input
          id="withdraw-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="현재 비밀번호를 입력해주세요"
          :disabled="isSubmitting"
        />

        <button type="submit" :disabled="!canSubmit">회원탈퇴</button>
      </form>
    </section>

    <Teleport to="body">
      <div v-if="isConfirmOpen" class="confirm-backdrop" @click.self="closeConfirm">
        <article class="confirm-dialog">
          <h3>정말 탈퇴하시겠습니까?</h3>
          <p v-if="isSubmitting">잠시 기다려주십시오. 회원탈퇴 요청을 처리하고 있습니다.</p>
          <p v-else>탈퇴가 완료되면 현재 로그인 세션이 종료됩니다.</p>

          <div class="confirm-actions">
            <button type="button" :disabled="isSubmitting" @click="closeConfirm">취소</button>
            <button type="button" :disabled="isSubmitting" @click="submitWithdraw">
              {{ isSubmitting ? '처리 중' : '탈퇴' }}
            </button>
          </div>
        </article>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
.withdraw-view {
  min-height: calc(100vh - 3rem);
  padding: 1.4rem 1rem 7rem;
  color: #f7f9fc;
}

.withdraw-panel {
  width: min(100%, 38rem);
  margin: 0 auto;
  padding: 1.1rem;
  background: #20262d;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0.85rem;
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.16);
}

.withdraw-heading h2 {
  font-size: 1.05rem;
  font-weight: 800;
}

.withdraw-heading p {
  margin-top: 0.55rem;
  color: #aeb8c7;
  font-size: 0.78rem;
  line-height: 1.55;
}

.withdraw-form {
  display: grid;
  gap: 0.75rem;
  margin-top: 1.2rem;
}

.withdraw-form label {
  color: #d6dfeb;
  font-size: 0.75rem;
  font-weight: 700;
}

.withdraw-form input {
  width: 100%;
  min-height: 2.9rem;
  padding: 0 0.9rem;
  color: #f7f9fc;
  background: #121a25;
  border: 1px solid #314258;
  border-radius: 0.65rem;
  font-size: 0.85rem;
}

.withdraw-form input::placeholder {
  color: #657286;
}

.withdraw-form input:focus {
  border-color: #72d3ff;
  box-shadow: 0 0 0 0.18rem rgba(114, 211, 255, 0.12);
}

.withdraw-form button {
  min-height: 2.85rem;
  margin-top: 0.3rem;
  color: #fff5f7;
  background: #e74f68;
  border-radius: 999px;
  box-shadow: 0 0.5rem 1.4rem rgba(231, 79, 104, 0.22);
  font-size: 0.86rem;
  font-weight: 800;
}

.withdraw-form button:disabled {
  cursor: default;
  opacity: 0.5;
}

.confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 12000;
  display: grid;
  padding: 1rem;
  background: rgba(3, 9, 15, 0.68);
  place-items: center;
  backdrop-filter: blur(0.45rem);
}

.confirm-dialog {
  width: min(100%, 22rem);
  padding: 1.1rem;
  color: #f7f9fc;
  background: #121d29;
  border: 1px solid rgba(199, 214, 229, 0.18);
  border-radius: 0.95rem;
  box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.42);
}

.confirm-dialog h3 {
  font-size: 1rem;
  font-weight: 850;
}

.confirm-dialog p {
  margin-top: 0.55rem;
  color: #aeb8c7;
  font-size: 0.78rem;
  line-height: 1.55;
}

.confirm-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
  margin-top: 1.1rem;
}

.confirm-actions button {
  min-height: 2.55rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
}

.confirm-actions button:first-child {
  color: #dbe4ee;
  background: rgba(255, 255, 255, 0.075);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.confirm-actions button:last-child {
  color: #fff5f7;
  background: #e74f68;
}

.confirm-actions button:disabled {
  cursor: wait;
  opacity: 0.6;
}
</style>
