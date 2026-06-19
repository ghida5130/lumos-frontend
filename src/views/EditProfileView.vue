<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getNicknameDuplicate } from '@/api/auth'
import { getUserInfo, patchUserInfo } from '@/api/users'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const user = ref(null)
const nickname = ref('')
const checkedNickname = ref('')
const isNicknameAvailable = ref(false)
const isLoading = ref(false)
const isCheckingNickname = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

const normalizedNickname = computed(() => nickname.value.trim())
const hasNicknameChanged = computed(() => normalizedNickname.value !== (user.value?.nickname ?? ''))
const canCheckNickname = computed(
  () => normalizedNickname.value.length > 0 && !isCheckingNickname.value && hasNicknameChanged.value,
)
const canSubmit = computed(
  () =>
    hasNicknameChanged.value &&
    checkedNickname.value === normalizedNickname.value &&
    isNicknameAvailable.value &&
    !isSubmitting.value,
)

function formatDateTime(value) {
  if (!value) return ''

  return value.replace('T', ' ').slice(0, 16)
}

function resetNicknameCheck() {
  checkedNickname.value = ''
  isNicknameAvailable.value = false
}

async function loadUserInfo() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const userInfo = await getUserInfo()
    user.value = userInfo
    nickname.value = userInfo.nickname ?? ''
    resetNicknameCheck()
  } catch {
    errorMessage.value = '내 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

async function checkNickname() {
  if (!canCheckNickname.value) return

  isCheckingNickname.value = true

  try {
    const result = await getNicknameDuplicate(normalizedNickname.value)
    checkedNickname.value = normalizedNickname.value
    isNicknameAvailable.value = Boolean(result.available)

    if (result.available) {
      toastStore.success('사용 가능한 닉네임입니다.')
    } else {
      toastStore.warning('이미 사용 중인 닉네임입니다.')
    }
  } catch {
    resetNicknameCheck()
    toastStore.error('닉네임 중복 확인에 실패했습니다.')
  } finally {
    isCheckingNickname.value = false
  }
}

async function submitProfile() {
  if (!canSubmit.value) return

  isSubmitting.value = true

  try {
    const formData = new FormData()
    formData.append('nickname', normalizedNickname.value)

    const updatedUser = await patchUserInfo(formData)
    authStore.setUser(updatedUser)
    toastStore.success('프로필 수정이 완료되었습니다.')
    router.replace({ name: 'mypage' })
  } catch {
    toastStore.error('프로필 수정에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

watch(nickname, () => {
  if (checkedNickname.value !== normalizedNickname.value) {
    isNicknameAvailable.value = false
  }
})

loadUserInfo()
</script>

<template>
  <main class="edit-profile-view">
    <section class="profile-panel">
      <header class="profile-heading">
        <h2>프로필 수정</h2>
        <p>현재는 닉네임만 수정할 수 있습니다.</p>
      </header>

      <p v-if="isLoading" class="state-message">내 정보를 불러오는 중입니다.</p>
      <p v-else-if="errorMessage" class="state-message">{{ errorMessage }}</p>

      <form v-else-if="user" class="profile-form" @submit.prevent="submitProfile">
        <div class="avatar-preview">
          <img v-if="user.profileImageUrl" :src="user.profileImageUrl" alt="" />
          <span v-else>{{ user.nickname?.slice(0, 1) || '?' }}</span>
        </div>

        <label class="form-field">
          <span>이메일</span>
          <input :value="user.email" type="email" disabled />
        </label>

        <label class="form-field">
          <span>권한</span>
          <input :value="user.role" type="text" disabled />
        </label>

        <label class="form-field">
          <span>가입일</span>
          <input :value="formatDateTime(user.createdAt)" type="text" disabled />
        </label>

        <label class="form-field">
          <span>프로필 이미지 URL</span>
          <input :value="user.profileImageUrl" type="text" disabled />
        </label>

        <div class="form-field">
          <span>닉네임</span>
          <div class="nickname-row">
            <input
              v-model="nickname"
              type="text"
              autocomplete="nickname"
              placeholder="닉네임을 입력해주세요"
              :disabled="isSubmitting"
            />
            <button type="button" :disabled="!canCheckNickname" @click="checkNickname">
              {{ isCheckingNickname ? '확인 중' : '중복확인' }}
            </button>
          </div>
          <p
            v-if="checkedNickname === normalizedNickname && isNicknameAvailable"
            class="field-hint field-hint--success"
          >
            사용 가능한 닉네임입니다.
          </p>
          <p v-else-if="hasNicknameChanged" class="field-hint">
            수정하려면 닉네임 중복확인이 필요합니다.
          </p>
        </div>

        <button class="submit-button" type="submit" :disabled="!canSubmit">
          {{ isSubmitting ? '수정 중입니다' : '수정하기' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.edit-profile-view {
  min-height: calc(100vh - 3rem);
  padding: 1.4rem 1rem 7rem;
  color: #f7f9fc;
}

.profile-panel {
  width: min(100%, 38rem);
  margin: 0 auto;
  padding: 1.1rem;
  background: #20262d;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0.85rem;
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.16);
}

.profile-heading h2 {
  font-size: 1.05rem;
  font-weight: 800;
}

.profile-heading p {
  margin-top: 0.55rem;
  color: #aeb8c7;
  font-size: 0.78rem;
}

.state-message {
  padding: 2.5rem 0 1.8rem;
  color: #91a0b4;
  font-size: 0.82rem;
  text-align: center;
}

.profile-form {
  display: grid;
  gap: 0.85rem;
  margin-top: 1.2rem;
}

.avatar-preview {
  display: grid;
  width: 4.4rem;
  height: 4.4rem;
  margin: 0 auto 0.35rem;
  overflow: hidden;
  place-items: center;
  color: #dff8f2;
  background: #69b4a5;
  border-radius: 50%;
  font-size: 1.3rem;
  font-weight: 900;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.form-field {
  display: grid;
  gap: 0.45rem;
}

.form-field > span {
  color: #d6dfeb;
  font-size: 0.72rem;
  font-weight: 700;
}

.form-field input {
  width: 100%;
  min-height: 2.75rem;
  padding: 0 0.85rem;
  color: #f7f9fc;
  background: #121a25;
  border: 1px solid #314258;
  border-radius: 0.65rem;
  font-size: 0.82rem;
}

.form-field input:disabled {
  color: #8d9bad;
  background: rgba(18, 26, 37, 0.62);
}

.form-field input::placeholder {
  color: #657286;
}

.form-field input:focus {
  border-color: #72d3ff;
  box-shadow: 0 0 0 0.18rem rgba(114, 211, 255, 0.12);
}

.nickname-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 5.7rem;
  gap: 0.5rem;
}

.nickname-row button {
  min-height: 2.75rem;
  color: #071321;
  background: #8cddff;
  border-radius: 0.65rem;
  font-size: 0.76rem;
  font-weight: 850;
}

.nickname-row button:disabled,
.submit-button:disabled {
  cursor: default;
  opacity: 0.5;
}

.field-hint {
  color: #91a0b4;
  font-size: 0.68rem;
}

.field-hint--success {
  color: #8fe6c8;
}

.submit-button {
  min-height: 2.85rem;
  margin-top: 0.35rem;
  color: #071321;
  background: #8cddff;
  border-radius: 999px;
  box-shadow: 0 0.5rem 1.4rem rgba(72, 207, 255, 0.22);
  font-size: 0.86rem;
  font-weight: 900;
}
</style>
