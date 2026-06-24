<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  deleteReview,
  deleteReviewLike,
  getReviews,
  patchReview,
  postReviewLike,
  uploadReviewImageToCloudinary,
} from "@/api/review";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";

const PAGE_SIZE = 10;

const authStore = useAuthStore();
const toastStore = useToastStore();

const reviews = ref([]);
const page = ref(0);
const isInitialLoading = ref(false);
const isLoadingMore = ref(false);
const hasMore = ref(true);
const errorMessage = ref("");
const pendingReviewLikes = ref(new Set());
const loadMoreTarget = ref(null);
const editingReview = ref(null);
const deletingReview = ref(null);
const editContent = ref("");
const editImageFiles = ref([]);
const editImagePreviews = ref([]);
const isSubmittingEdit = ref(false);
const isDeletingReview = ref(false);
let observer = null;

const canLoadMore = computed(
  () => hasMore.value && !isInitialLoading.value && !isLoadingMore.value && !errorMessage.value,
);
const canSubmitEdit = computed(
  () => editContent.value.trim().length > 0 && !isSubmittingEdit.value,
);

function formatCreatedAt(createdAt) {
  if (!createdAt) {
    return "";
  }

  return createdAt.replace("T", " ").slice(0, 16);
}

function getFallbackAvatarName(nickname) {
  return nickname?.trim()?.slice(0, 1) || "?";
}

function normalizeImages(imageUrls) {
  return Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [];
}

function getReviewUserId(reviewData = {}) {
  return (
    reviewData.userId ??
    reviewData.memberId ??
    reviewData.writerId ??
    reviewData.authorId ??
    reviewData.user?.userId ??
    reviewData.user?.id ??
    null
  );
}

function mapReview(reviewData, pageNumber, index) {
  const images = normalizeImages(reviewData.imageUrls);

  return {
    feedKey: `${pageNumber}-${reviewData.reviewId}-${index}`,
    id: reviewData.reviewId,
    userId: getReviewUserId(reviewData),
    placeName: reviewData.placeName || "장소 정보 없음",
    author: reviewData.nickname || "익명",
    profileImageUrl: reviewData.profileImageUrl || reviewData.profileImage || "",
    avatar: getFallbackAvatarName(reviewData.nickname),
    content: reviewData.content || "",
    likeCount: reviewData.likeCount ?? 0,
    likedByMe: Boolean(reviewData.likedByMe),
    createdAt: formatCreatedAt(reviewData.createdAt),
    createdAtDateTime: reviewData.createdAt,
    images,
    currentImageIndex: 0,
    touchStartX: 0,
  };
}

function isLocalPreview(preview) {
  return preview.source === "local";
}

function canEditReview(review) {
  return (
    authStore.userId !== null &&
    review.userId !== null &&
    String(review.userId) === String(authStore.userId)
  );
}

function resetEditForm() {
  editContent.value = "";
  editImageFiles.value = [];

  editImagePreviews.value
    .filter(isLocalPreview)
    .forEach((preview) => URL.revokeObjectURL(preview.url));
  editImagePreviews.value = [];
  editingReview.value = null;
}

function openEditDialog(review) {
  if (!authStore.isLoggedIn) {
    toastStore.warning("로그인이 필요합니다.");
    return;
  }

  if (!canEditReview(review)) {
    return;
  }

  resetEditForm();
  editingReview.value = review;
  editContent.value = review.content;
  editImagePreviews.value = review.images.map((imageUrl, index) => ({
    id: `${review.id}-remote-${index}`,
    name: `리뷰 이미지 ${index + 1}`,
    url: imageUrl,
    source: "remote",
  }));
}

function closeEditDialog({ force = false } = {}) {
  if (isSubmittingEdit.value && !force) {
    return;
  }

  resetEditForm();
}

function openDeleteDialog(review) {
  if (!authStore.isLoggedIn) {
    toastStore.warning("로그인이 필요합니다.");
    return;
  }

  if (!canEditReview(review)) {
    return;
  }

  deletingReview.value = review;
}

function closeDeleteDialog() {
  if (isDeletingReview.value) {
    return;
  }

  deletingReview.value = null;
}

function handleEditImageChange(event) {
  const files = Array.from(event.target.files ?? []);
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));

  if (files.length !== imageFiles.length) {
    toastStore.warning("이미지 파일만 업로드할 수 있습니다.");
  }

  editImagePreviews.value
    .filter(isLocalPreview)
    .forEach((preview) => URL.revokeObjectURL(preview.url));
  editImageFiles.value = imageFiles;
  editImagePreviews.value = imageFiles.map((file) => ({
    id: `${file.name}-${file.lastModified}-${file.size}`,
    name: file.name,
    url: URL.createObjectURL(file),
    source: "local",
  }));
  event.target.value = "";
}

async function getSubmittedEditImageUrls() {
  if (!editImageFiles.value.length) {
    return editImagePreviews.value.map((preview) => preview.url);
  }

  const imageUrls = await Promise.all(
    editImageFiles.value.map(async (file) => {
      const uploadResult = await uploadReviewImageToCloudinary(file);

      return uploadResult.secure_url ?? uploadResult.url;
    }),
  );

  return imageUrls.filter(Boolean);
}

async function loadReviews(targetPage = 0) {
  const isFirstPage = targetPage === 0;

  if (isFirstPage) {
    isInitialLoading.value = true;
    errorMessage.value = "";
  } else {
    if (!canLoadMore.value) {
      return;
    }

    isLoadingMore.value = true;
  }

  try {
    const result = await getReviews({
      page: targetPage,
      size: PAGE_SIZE,
      authenticated: authStore.isLoggedIn,
    });
    const nextReviews = (result.content ?? []).map((review, index) =>
      mapReview(review, targetPage, index),
    );

    reviews.value = isFirstPage ? nextReviews : [...reviews.value, ...nextReviews];
    page.value = targetPage;

    hasMore.value = nextReviews.length > 0;
  } catch {
    if (isFirstPage) {
      reviews.value = [];
    }

    errorMessage.value = "리뷰를 불러오지 못했습니다.";
  } finally {
    isInitialLoading.value = false;
    isLoadingMore.value = false;
  }
}

function loadNextPage() {
  if (!canLoadMore.value) {
    return;
  }

  loadReviews(page.value + 1);
}

function showPreviousImage(review) {
  review.currentImageIndex = Math.max(review.currentImageIndex - 1, 0);
}

function showNextImage(review) {
  review.currentImageIndex = Math.min(review.currentImageIndex + 1, review.images.length - 1);
}

function handleTouchStart(review, event) {
  review.touchStartX = event.touches[0]?.clientX ?? 0;
}

function handleTouchEnd(review, event) {
  const touchEndX = event.changedTouches[0]?.clientX ?? 0;
  const diffX = review.touchStartX - touchEndX;

  if (Math.abs(diffX) < 40) {
    return;
  }

  if (diffX > 0) {
    showNextImage(review);
  } else {
    showPreviousImage(review);
  }
}

async function toggleReviewLike(reviewId) {
  if (pendingReviewLikes.value.has(reviewId)) {
    return;
  }

  const targetReview = reviews.value.find((review) => review.id === reviewId);

  if (!targetReview) {
    return;
  }

  const previousLikeCount = targetReview.likeCount;
  const previousLikedByMe = targetReview.likedByMe;
  pendingReviewLikes.value = new Set([...pendingReviewLikes.value, reviewId]);
  targetReview.likedByMe = !previousLikedByMe;
  targetReview.likeCount = Math.max(0, targetReview.likeCount + (previousLikedByMe ? -1 : 1));

  try {
    if (previousLikedByMe) {
      await deleteReviewLike(reviewId);
      toastStore.success("리뷰 좋아요가 취소되었습니다.");
    } else {
      await postReviewLike(reviewId);
      toastStore.success("리뷰 좋아요가 추가되었습니다.");
    }
  } catch (error) {
    targetReview.likeCount = previousLikeCount;
    targetReview.likedByMe = previousLikedByMe;

    if (error.statusCode === 401) {
      toastStore.warning("로그인이 필요합니다.");
    } else if (error.statusCode === 409) {
      toastStore.info(
        previousLikedByMe ? "이미 좋아요가 취소되었습니다." : "이미 좋아요 처리되었습니다.",
      );
    } else if (error.statusCode === 500) {
      toastStore.error("서버 내부 오류가 발생했습니다.");
    } else {
      toastStore.error(
        previousLikedByMe ? "리뷰 좋아요 취소에 실패했습니다." : "리뷰 좋아요 처리에 실패했습니다.",
      );
    }
  } finally {
    const nextPendingLikes = new Set(pendingReviewLikes.value);
    nextPendingLikes.delete(reviewId);
    pendingReviewLikes.value = nextPendingLikes;
  }
}

async function submitEditReview() {
  if (!editingReview.value || !canSubmitEdit.value) {
    return;
  }

  const targetReview = editingReview.value;
  isSubmittingEdit.value = true;
  toastStore.info("리뷰를 수정하는 중입니다.");

  try {
    const imageUrls = await getSubmittedEditImageUrls();
    const trimmedContent = editContent.value.trim();

    await patchReview(targetReview.id, {
      content: trimmedContent,
      imageUrls,
    });

    reviews.value = reviews.value.map((review) =>
      review.feedKey === targetReview.feedKey
        ? {
            ...review,
            content: trimmedContent,
            images: imageUrls,
            currentImageIndex: 0,
          }
        : review,
    );

    toastStore.success("리뷰가 수정되었습니다.");
    closeEditDialog({ force: true });
  } catch (error) {
    if (error.statusCode === 401) {
      toastStore.warning("로그인이 필요합니다.");
    } else {
      toastStore.error("리뷰 수정에 실패했습니다.");
    }
  } finally {
    isSubmittingEdit.value = false;
  }
}

async function confirmDeleteReview() {
  if (!deletingReview.value || isDeletingReview.value) {
    return;
  }

  const targetReview = deletingReview.value;
  isDeletingReview.value = true;
  toastStore.info("리뷰를 삭제하는 중입니다.");

  try {
    await deleteReview(targetReview.id);
    reviews.value = reviews.value.filter((review) => review.feedKey !== targetReview.feedKey);
    toastStore.success("리뷰가 삭제되었습니다.");
    deletingReview.value = null;
  } catch (error) {
    if (error.statusCode === 401) {
      toastStore.warning("로그인이 필요합니다.");
    } else {
      toastStore.error("리뷰 삭제에 실패했습니다.");
    }
  } finally {
    isDeletingReview.value = false;
  }
}

onMounted(() => {
  loadReviews(0);

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        loadNextPage();
      }
    },
    {
      rootMargin: "240px 0px",
    },
  );

  if (loadMoreTarget.value) {
    observer.observe(loadMoreTarget.value);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
  editImagePreviews.value
    .filter(isLocalPreview)
    .forEach((preview) => URL.revokeObjectURL(preview.url));
});
</script>

<template>
  <main class="feed-view">
    <section class="feed-list">
      <section v-if="isInitialLoading" class="feed-skeleton-list" aria-label="피드 로딩 중">
        <article v-for="index in 3" :key="index" class="feed-skeleton">
          <header>
            <span></span>
            <div>
              <i></i>
              <i></i>
            </div>
          </header>
          <span class="feed-skeleton-media"></span>
          <div class="feed-skeleton-copy">
            <i></i>
            <i></i>
          </div>
        </article>
      </section>
      <p v-else-if="errorMessage" class="status-message">{{ errorMessage }}</p>
      <p v-else-if="!reviews.length" class="status-message">표시할 리뷰가 없습니다.</p>

      <template v-else>
        <article
          v-for="review in reviews"
          :key="review.feedKey"
          class="feed-card"
          :class="{ 'feed-card--text': !review.images.length }"
        >
          <header class="post-header">
            <img
              v-if="review.profileImageUrl"
              class="avatar"
              :src="review.profileImageUrl"
              :alt="`${review.author} 프로필`"
            />
            <span v-else class="avatar avatar-fallback" aria-hidden="true">{{
              review.avatar
            }}</span>

            <div class="author-info">
              <strong>{{ review.author }}</strong>
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
                  <circle cx="12" cy="10" r="2" />
                </svg>
                {{ review.placeName }}
              </span>
            </div>

            <time v-if="review.createdAt" class="created-at" :datetime="review.createdAtDateTime">
              {{ review.createdAt }}
            </time>
          </header>

          <figure
            v-if="review.images.length"
            class="post-media"
            @touchstart.passive="handleTouchStart(review, $event)"
            @touchend.passive="handleTouchEnd(review, $event)"
          >
            <img
              :src="review.images[review.currentImageIndex]"
              :alt="`${review.placeName} 리뷰 이미지 ${review.currentImageIndex + 1}`"
            />

            <button
              class="image-nav image-nav--prev"
              type="button"
              aria-label="이전 이미지"
              :disabled="review.currentImageIndex === 0"
              @click="showPreviousImage(review)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              class="image-nav image-nav--next"
              type="button"
              aria-label="다음 이미지"
              :disabled="review.currentImageIndex >= review.images.length - 1"
              @click="showNextImage(review)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>

            <figcaption class="image-count">
              {{ review.currentImageIndex + 1 }} / {{ review.images.length }}
            </figcaption>
          </figure>

          <div class="post-content">
            <p>{{ review.content }}</p>

            <footer class="post-actions">
              <button
                v-if="canEditReview(review)"
                class="edit-button"
                type="button"
                @click="openEditDialog(review)"
              >
                수정
              </button>
              <button
                v-if="canEditReview(review)"
                class="delete-button"
                type="button"
                @click="openDeleteDialog(review)"
              >
                삭제
              </button>

              <button
                class="like-button"
                :class="{ 'like-button--active': review.likedByMe }"
                type="button"
                :disabled="pendingReviewLikes.has(review.id)"
                @click="toggleReviewLike(review.id)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M20.8 4.6c-1.9-1.8-4.9-1.7-6.7.2L12 7l-2.1-2.2C8.1 2.9 5.1 2.8 3.2 4.6 1.1 6.6 1 9.9 3 12l9 8.7 9-8.7c2-2.1 1.9-5.4-.2-7.4Z"
                  />
                </svg>
                <span class="like-count">{{ review.likeCount }}</span>
              </button>
            </footer>
          </div>
        </article>
      </template>

      <p v-if="isLoadingMore" class="status-message status-message--small">
        리뷰를 더 불러오는 중입니다.
      </p>
      <div ref="loadMoreTarget" class="load-more-target" aria-hidden="true"></div>
    </section>

    <div v-if="editingReview" class="edit-dialog-backdrop" @click.self="closeEditDialog">
      <article class="edit-dialog" role="dialog" aria-modal="true">
        <header class="edit-dialog-header">
          <div>
            <h3>리뷰 수정</h3>
            <p>{{ editingReview.placeName }}</p>
          </div>
          <button type="button" aria-label="닫기" @click="closeEditDialog">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div class="edit-dialog-body">
          <label class="edit-form-field">
            <span>내용</span>
            <textarea
              v-model="editContent"
              rows="5"
              placeholder="리뷰 내용을 입력하세요"
              :disabled="isSubmittingEdit"
            ></textarea>
          </label>

          <label class="edit-form-field">
            <span>이미지</span>
            <input
              type="file"
              accept="image/*"
              multiple
              :disabled="isSubmittingEdit"
              @change="handleEditImageChange"
            />
          </label>

          <ul v-if="editImagePreviews.length" class="edit-preview-list">
            <li v-for="preview in editImagePreviews" :key="preview.id">
              <img :src="preview.url" :alt="preview.name" />
            </li>
          </ul>
        </div>

        <footer class="edit-dialog-footer">
          <button type="button" class="cancel-button" @click="closeEditDialog">취소</button>
          <button
            type="button"
            class="submit-button"
            :disabled="!canSubmitEdit"
            @click="submitEditReview"
          >
            {{ isSubmittingEdit ? "수정 중..." : "수정하기" }}
          </button>
        </footer>
      </article>
    </div>

    <div v-if="deletingReview" class="delete-dialog-backdrop" @click.self="closeDeleteDialog">
      <article class="delete-dialog" role="dialog" aria-modal="true">
        <header>
          <h3>리뷰 삭제</h3>
          <p>이 리뷰를 삭제하시겠습니까?</p>
        </header>
        <p class="delete-preview">{{ deletingReview.content }}</p>
        <footer>
          <button type="button" class="cancel-button" @click="closeDeleteDialog">취소</button>
          <button
            type="button"
            class="delete-confirm-button"
            :disabled="isDeletingReview"
            @click="confirmDeleteReview"
          >
            {{ isDeletingReview ? "삭제 중..." : "삭제" }}
          </button>
        </footer>
      </article>
    </div>
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

.status-message {
  padding: 3rem 1rem;
  color: #91a0b4;
  text-align: center;
}

.status-message--small {
  padding: 1rem;
  font-size: 0.78rem;
}

.feed-card {
  overflow: hidden;
  margin-bottom: 1.5rem;
  background: #172233;
  border: 1px solid #314258;
  border-radius: 0.75rem;
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.15);
  animation: feedCardIn 0.22s ease both;
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

.avatar-fallback {
  display: grid;
  place-items: center;
  color: #071321;
  background: #72d3ff;
  font-size: 0.78rem;
  font-weight: 800;
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
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-info span {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  overflow: hidden;
  color: #72d3ff;
  font-size: 0.64rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-info svg {
  flex: 0 0 auto;
  width: 0.65rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
}

.created-at {
  flex: 0 0 auto;
  color: #77869a;
  font-size: 0.62rem;
}

.post-media {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #0e1826;
  touch-action: pan-y;
}

.post-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-nav {
  position: absolute;
  top: 50%;
  display: grid;
  width: 2.1rem;
  height: 2.1rem;
  place-items: center;
  color: #f7fbff;
  background: rgba(7, 19, 33, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 50%;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.22);
  transform: translateY(-50%);
}

.image-nav--prev {
  left: 0.7rem;
}

.image-nav--next {
  right: 0.7rem;
}

.image-nav svg {
  width: 1.1rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.image-nav:disabled {
  cursor: default;
  opacity: 0.35;
}

.image-count {
  position: absolute;
  right: 0.7rem;
  bottom: 0.7rem;
  padding: 0.25rem 0.5rem;
  color: #f7fbff;
  background: rgba(7, 19, 33, 0.72);
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
}

.post-content {
  padding: 0.85rem;
}

.feed-card--text .post-content {
  margin: 0 0.8rem 0.9rem;
  padding: 0.9rem;
  background: rgba(10, 19, 32, 0.25);
  border: 1px solid #28394f;
  border-radius: 0.5rem;
}

.post-content p {
  color: #b6c0cd;
  font-size: 0.82rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.post-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  margin-top: 0.85rem;
}

.like-count {
  color: #e8f8ff;
  font-size: 0.78rem;
  font-weight: 800;
}

.like-button:not(.like-button--active) .like-count {
  color: #071321;
}

.edit-button,
.delete-button {
  min-height: 2rem;
  padding: 0 0.68rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
}

.edit-button {
  color: #dbe8f2;
  background: rgba(255, 255, 255, 0.075);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.delete-button {
  color: #ffced7;
  background: rgba(255, 111, 159, 0.1);
  border: 1px solid rgba(255, 111, 159, 0.18);
}

.like-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-width: 4.1rem;
  min-height: 2rem;
  padding: 0 0.7rem;
  color: #071321;
  background: #8cddff;
  border: 1px solid rgba(140, 221, 255, 0.8);
  border-radius: 999px;
  box-shadow: 0 0.35rem 0.9rem rgba(72, 207, 255, 0.22);
  font-size: 0.72rem;
  font-weight: 800;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.like-button svg {
  width: 0.82rem;
  fill: #071321;
}

.like-button--active {
  color: #fff7fa;
  background: #ff6f9f;
  border-color: rgba(255, 111, 159, 0.85);
  box-shadow: 0 0.45rem 1rem rgba(255, 111, 159, 0.24);
}

.like-button--active svg {
  fill: currentColor;
}

.like-button:hover {
  background: #a8e7ff;
  box-shadow: 0 0.45rem 1rem rgba(72, 207, 255, 0.3);
}

.like-button--active:hover {
  background: #ff86ad;
  box-shadow: 0 0.5rem 1.1rem rgba(255, 111, 159, 0.3);
}

.like-button:active {
  transform: scale(0.97);
}

.like-button:disabled {
  cursor: wait;
  opacity: 0.68;
  transform: none;
}

.edit-dialog-backdrop,
.delete-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: grid;
  padding: 1rem;
  background: rgba(3, 8, 14, 0.66);
  place-items: center;
  backdrop-filter: blur(0.35rem);
}

.edit-dialog,
.delete-dialog {
  color: #f7f9fc;
  background: #111c29;
  border: 1px solid rgba(199, 214, 229, 0.16);
  border-radius: 1rem;
  box-shadow: 0 1.3rem 3rem rgba(0, 0, 0, 0.38);
  animation: feedCardIn 0.22s ease both;
}

.edit-dialog {
  width: min(100%, 32rem);
  max-height: min(90vh, 44rem);
  overflow-y: auto;
}

.edit-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1rem 0.8rem;
}

.edit-dialog-header h3,
.delete-dialog h3 {
  font-size: 1rem;
  font-weight: 850;
}

.edit-dialog-header p,
.delete-dialog header p {
  margin-top: 0.35rem;
  color: #91a0b4;
  font-size: 0.72rem;
}

.edit-dialog-header > button {
  display: grid;
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  color: #dbe4ee;
  background: rgba(255, 255, 255, 0.075);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  place-items: center;
}

.edit-dialog-header svg {
  width: 0.9rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.8;
}

.edit-dialog-body {
  display: grid;
  gap: 0.9rem;
  padding: 0 1rem 1rem;
}

.edit-form-field {
  display: grid;
  gap: 0.5rem;
}

.edit-form-field > span {
  color: #d6dfeb;
  font-size: 0.72rem;
  font-weight: 750;
}

.edit-form-field textarea,
.edit-form-field input[type="file"] {
  width: 100%;
  color: #f7f9fc;
  background: #121a25;
  border: 1px solid #314258;
  border-radius: 0.65rem;
  font-size: 0.82rem;
}

.edit-form-field textarea {
  min-height: 8rem;
  padding: 0.8rem 0.85rem;
  line-height: 1.5;
  resize: vertical;
}

.edit-form-field textarea::placeholder {
  color: #657286;
}

.edit-form-field input[type="file"] {
  min-height: 2.75rem;
  padding: 0.7rem 0.85rem;
}

.edit-preview-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
}

.edit-preview-list li {
  overflow: hidden;
  aspect-ratio: 1;
  background: #121a25;
  border: 1px solid #314258;
  border-radius: 0.55rem;
}

.edit-preview-list img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit-dialog-footer {
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
  padding: 0.85rem 1rem 1rem;
  background: linear-gradient(180deg, rgba(17, 28, 41, 0), #111c29 26%);
}

.cancel-button,
.submit-button,
.delete-confirm-button {
  min-height: 2.75rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 850;
}

.cancel-button {
  color: #dbe4ee;
  background: rgba(255, 255, 255, 0.075);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.submit-button {
  color: #071321;
  background: #8cddff;
  box-shadow: 0 0.5rem 1.2rem rgba(72, 207, 255, 0.18);
}

.submit-button:disabled,
.cancel-button:disabled {
  cursor: default;
  opacity: 0.55;
}

.delete-dialog {
  width: min(100%, 25rem);
}

.delete-dialog header {
  padding: 1rem 1rem 0.65rem;
}

.delete-preview {
  max-height: 7rem;
  margin: 0 1rem;
  overflow: hidden;
  color: #91a0b4;
  background: #121a25;
  border: 1px solid #314258;
  border-radius: 0.7rem;
  padding: 0.8rem;
  font-size: 0.78rem;
  line-height: 1.5;
}

.delete-dialog footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
  padding: 0.9rem 1rem 1rem;
}

.delete-confirm-button {
  color: #fff7fa;
  background: #d94f76;
  box-shadow: 0 0.5rem 1.2rem rgba(217, 79, 118, 0.2);
}

.delete-confirm-button:disabled {
  cursor: wait;
  opacity: 0.58;
}

.load-more-target {
  height: 1px;
}

.feed-skeleton-list {
  display: grid;
  gap: 1.5rem;
}

.feed-skeleton {
  overflow: hidden;
  background: #172233;
  border: 1px solid #314258;
  border-radius: 0.75rem;
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.15);
}

.feed-skeleton header {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  gap: 0.65rem;
  align-items: center;
  padding: 0.75rem 0.8rem;
}

.feed-skeleton header > span,
.feed-skeleton i,
.feed-skeleton-media {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.075);
}

.feed-skeleton header > span {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
}

.feed-skeleton header div,
.feed-skeleton-copy {
  display: grid;
  gap: 0.5rem;
}

.feed-skeleton i {
  height: 0.72rem;
  border-radius: 0.45rem;
}

.feed-skeleton header i:first-child {
  width: 42%;
}

.feed-skeleton header i:last-child,
.feed-skeleton-copy i:first-child {
  width: 72%;
}

.feed-skeleton-media {
  display: block;
  aspect-ratio: 4 / 3;
}

.feed-skeleton-copy {
  padding: 0.85rem;
}

.feed-skeleton-copy i:last-child {
  width: 48%;
}

.feed-skeleton header > span::after,
.feed-skeleton i::after,
.feed-skeleton-media::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  content: "";
  animation: skeletonSweep 1.25s ease-in-out infinite;
}

@keyframes skeletonSweep {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
}

@keyframes feedCardIn {
  from {
    opacity: 0;
    transform: translateY(0.45rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
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
