<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { getNicknameDuplicate } from "@/api/auth";
import {
  getUserInfo,
  patchUserInfo,
  postProfileImageSignature,
  uploadImageToCloudinary,
  patchProfileImage,
} from "@/api/users";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const user = ref(null);
const nickname = ref("");
const checkedNickname = ref("");
const isNicknameAvailable = ref(false);
const isLoading = ref(false);
const isCheckingNickname = ref(false);
const isSubmitting = ref(false);
const showImageDialog = ref(false);
const profileImageFile = ref(null);
const imagePreviewUrl = ref("");
const isUploadingImage = ref(false);
const errorMessage = ref("");

const normalizedNickname = computed(() => nickname.value.trim());
const hasNicknameChanged = computed(
  () => normalizedNickname.value !== (user.value?.nickname ?? ""),
);
const canCheckNickname = computed(
  () =>
    normalizedNickname.value.length > 0 && !isCheckingNickname.value && hasNicknameChanged.value,
);
const canSubmit = computed(
  () =>
    hasNicknameChanged.value &&
    checkedNickname.value === normalizedNickname.value &&
    isNicknameAvailable.value &&
    !isSubmitting.value,
);

function formatDateTime(value) {
  if (!value) return "";

  return value.replace("T", " ").slice(0, 16);
}

function resetNicknameCheck() {
  checkedNickname.value = "";
  isNicknameAvailable.value = false;
}

async function loadUserInfo() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const userInfo = await getUserInfo();
    user.value = userInfo;
    nickname.value = userInfo.nickname ?? "";
    resetNicknameCheck();
  } catch {
    errorMessage.value = "내 정보를 불러오지 못했습니다.";
  } finally {
    isLoading.value = false;
  }
}

async function checkNickname() {
  if (!canCheckNickname.value) return;

  isCheckingNickname.value = true;

  try {
    const result = await getNicknameDuplicate(normalizedNickname.value);
    checkedNickname.value = normalizedNickname.value;
    isNicknameAvailable.value = Boolean(result.available);

    if (result.available) {
      toastStore.success("사용 가능한 닉네임입니다.");
    } else {
      toastStore.warning("이미 사용 중인 닉네임입니다.");
    }
  } catch {
    resetNicknameCheck();
    toastStore.error("닉네임 중복 확인에 실패했습니다.");
  } finally {
    isCheckingNickname.value = false;
  }
}

async function submitProfile() {
  if (!canSubmit.value) return;

  isSubmitting.value = true;

  try {
    const updatedUser = await patchUserInfo({
      nickname: normalizedNickname.value,
    });
    authStore.setUser(updatedUser);
    toastStore.success("프로필 수정이 완료되었습니다.");
    router.replace({ name: "mypage" });
  } catch {
    toastStore.error("프로필 수정에 실패했습니다.");
  } finally {
    isSubmitting.value = false;
  }
}

function openImageDialog() {
  profileImageFile.value = null;
  imagePreviewUrl.value = "";
  showImageDialog.value = true;
}

function closeImageDialog() {
  showImageDialog.value = false;

  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value);
  }

  profileImageFile.value = null;
  imagePreviewUrl.value = "";
}

function handleProfileImageChange(event) {
  const file = event.target.files?.[0];

  if (!file) {
    profileImageFile.value = null;
    imagePreviewUrl.value = "";
    return;
  }

  if (!file.type.startsWith("image/")) {
    if (imagePreviewUrl.value) {
      URL.revokeObjectURL(imagePreviewUrl.value);
    }

    profileImageFile.value = null;
    imagePreviewUrl.value = "";
    event.target.value = "";
    toastStore.warning("이미지 파일만 업로드할 수 있습니다.");
    return;
  }

  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value);
  }

  profileImageFile.value = file;
  imagePreviewUrl.value = URL.createObjectURL(file);
}

async function uploadProfileImage() {
  if (!profileImageFile.value || !user.value) return;

  isUploadingImage.value = true;
  toastStore.info("프로필 이미지를 업로드 중입니다.");

  try {
    const signatureData = await postProfileImageSignature();
    const formData = new FormData();

    formData.append("file", profileImageFile.value);
    formData.append("api_key", signatureData.apiKey);
    formData.append("timestamp", signatureData.timestamp);
    formData.append("signature", signatureData.signature);
    formData.append("folder", signatureData.folder);
    formData.append("public_id", signatureData.publicId);
    formData.append("overwrite", "true");

    const cloudinaryResponse = await uploadImageToCloudinary(signatureData.uploadUrl, formData);
    const profileBody = {
      publicId: cloudinaryResponse.public_id,
      imageUrl: cloudinaryResponse.secure_url ?? cloudinaryResponse.url,
      version: cloudinaryResponse.version,
      signature: cloudinaryResponse.signature,
    };

    await patchProfileImage(profileBody);

    authStore.setUser({
      ...user.value,
      profileImageUrl: profileBody.imageUrl,
    });

    user.value = {
      ...user.value,
      profileImageUrl: profileBody.imageUrl,
    };
    toastStore.success("프로필 이미지가 변경되었습니다.");
    closeImageDialog();
  } catch {
    toastStore.error("프로필 이미지 업로드에 실패했습니다.");
  } finally {
    isUploadingImage.value = false;
  }
}

watch(nickname, () => {
  if (checkedNickname.value !== normalizedNickname.value) {
    isNicknameAvailable.value = false;
  }
});

onBeforeUnmount(() => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value);
  }
});

loadUserInfo();
</script>

<template>
  <main class="edit-profile-view">
    <section class="profile-panel">
      <header class="profile-heading">
        <h2>프로필 수정</h2>
        <p>닉네임과 프로필 이미지를 변경할 수 있습니다.</p>
      </header>

      <p v-if="isLoading" class="state-message">내 정보를 불러오는 중입니다.</p>
      <p v-else-if="errorMessage" class="state-message">{{ errorMessage }}</p>

      <form v-else-if="user" class="profile-form" @submit.prevent="submitProfile">
        <div class="avatar-preview">
          <img v-if="user.profileImageUrl" :src="user.profileImageUrl" alt="프로필 이미지" />
          <span v-else>{{ user.nickname?.slice(0, 1) || "?" }}</span>
        </div>

        <div class="profile-image-field">
          <button type="button" class="image-button" @click="openImageDialog">
            프로필 이미지 변경
          </button>
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
              {{ isCheckingNickname ? "확인 중" : "중복확인" }}
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
          {{ isSubmitting ? "수정 중입니다" : "수정하기" }}
        </button>
      </form>
    </section>

    <div v-if="showImageDialog" class="image-dialog-backdrop" @click.self="closeImageDialog">
      <article class="image-dialog" role="dialog" aria-modal="true">
        <header class="dialog-header">
          <div>
            <h3>프로필 이미지 변경</h3>
            <p>새 이미지를 선택하면 업로드가 시작됩니다.</p>
          </div>
          <button type="button" class="close-button" @click="closeImageDialog" aria-label="닫기">
            ✕
          </button>
        </header>

        <div class="dialog-content">
          <label class="upload-field">
            <span>이미지 선택</span>
            <input type="file" accept="image/*" @change="handleProfileImageChange" />
          </label>

          <div v-if="imagePreviewUrl" class="preview-box">
            <img :src="imagePreviewUrl" alt="업로드할 이미지 미리보기" />
          </div>

          <button
            class="upload-button"
            type="button"
            :disabled="!profileImageFile || isUploadingImage"
            @click="uploadProfileImage"
          >
            {{ isUploadingImage ? "업로드 중입니다" : "업로드하기" }}
          </button>
        </div>
      </article>
    </div>
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
.submit-button:disabled,
.image-button:disabled,
.upload-button:disabled {
  cursor: default;
  opacity: 0.5;
}

.profile-image-field {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-button,
.upload-button {
  min-height: 2.5rem;
  padding: 0 1rem;
  color: #071321;
  background: #8cddff;
  border-radius: 0.65rem;
  font-size: 0.76rem;
  font-weight: 850;
}

.image-dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 20;
}

.image-dialog {
  width: min(100%, 28rem);
  background: #20262d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  box-shadow: 0 1rem 2.5rem rgba(0, 0, 0, 0.24);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem 1.25rem 0.8rem;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1rem;
}

.dialog-header p {
  margin: 0.4rem 0 0;
  color: #aeb8c7;
  font-size: 0.78rem;
}

.close-button {
  color: #d6dfeb;
  background: transparent;
  border: none;
  font-size: 1.15rem;
  cursor: pointer;
}

.dialog-content {
  display: grid;
  gap: 1rem;
  padding: 0 1.25rem 1.25rem;
}

.upload-field {
  display: grid;
  gap: 0.55rem;
}

.upload-field span {
  color: #d6dfeb;
  font-size: 0.72rem;
  font-weight: 700;
}

.upload-field input[type="file"] {
  width: 100%;
  min-height: 2.75rem;
  color: #f7f9fc;
  background: #121a25;
  border: 1px solid #314258;
  border-radius: 0.65rem;
  padding: 0.7rem 0.85rem;
}

.preview-box {
  min-height: 10rem;
  background: #121a25;
  border: 1px solid #314258;
  border-radius: 0.85rem;
  padding: 0.75rem;
  display: grid;
  place-items: center;
}

.preview-box img {
  max-width: 100%;
  max-height: 14rem;
  object-fit: contain;
  border-radius: 0.75rem;
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
