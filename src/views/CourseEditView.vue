<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { patchCourse } from '@/api/course'
import { getPlaceDetail, getPlaceList } from '@/api/place'
import { getUserCourseDetail } from '@/api/users'
import { useToastStore } from '@/stores/toast'

const PAGE_SIZE = 10
const PLACE_FILTER_OPTIONS = ['전체', '관광지', '숙소', '식당']

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const courseId = computed(() => String(route.query.courseId ?? ''))
const form = ref(createEmptyCourse())
const places = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')

const pickerMode = ref('replace')
const pickerTargetIndex = ref(-1)
const isPickerOpen = ref(false)
const placeSearchKeyword = ref('')
const appliedPlaceKeyword = ref('')
const selectedPlaceCategory = ref('')
const appliedPlaceCategory = ref('')
const placeResults = ref([])
const isPlaceLoading = ref(false)
const placeErrorMessage = ref('')
const placePage = ref(0)
const placeTotalPages = ref(0)
const selectedPreviewPlace = ref(null)
const isPreviewLoading = ref(false)
const previewErrorMessage = ref('')
const previewRequestId = ref(0)
const draggingPlaceIndex = ref(null)
const dragOverPlaceIndex = ref(null)
const dragStartY = ref(0)
const dragCurrentY = ref(0)

const selectedCourseIdLabel = computed(() => courseId.value || '-')
const canSubmit = computed(
  () => form.value.title.trim() && form.value.description.trim() && places.value.length > 0,
)
const placeLastPage = computed(() => Math.max(placeTotalPages.value - 1, 0))
const durationNotice = computed(
  () => `${formatMinutes(form.value.totalDurationMinutes)} · 관광지 변경 후 자동 계산 예정`,
)
const draggedPlaceStyle = computed(() => {
  if (draggingPlaceIndex.value === null) return {}

  return {
    transform: `translateY(${dragCurrentY.value - dragStartY.value}px) scale(1.02)`,
    zIndex: 5,
  }
})

function createEmptyCourse() {
  return {
    cityId: null,
    title: '',
    description: '',
    theme: 'AI_RECOMMEND',
    startTime: null,
    endTime: null,
    totalDurationMinutes: 0,
    totalTravelMinutes: 0,
    transport: 'CAR',
  }
}

function formatMinutes(minutes) {
  const value = Number(minutes)

  if (!Number.isFinite(value)) return '-'
  if (value < 60) return `${value}분`

  const hours = Math.floor(value / 60)
  const remainingMinutes = value % 60

  return remainingMinutes ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
}

function formatHours(openingTime, closingTime) {
  if (!openingTime && !closingTime) return ''

  return `${openingTime ?? '-'} - ${closingTime ?? '-'}`
}

function mapCourse(course) {
  form.value = {
    cityId: course.cityId ?? null,
    title: course.title ?? '',
    description: course.description ?? '',
    theme: course.theme ?? 'AI_RECOMMEND',
    startTime: course.startTime ?? null,
    endTime: course.endTime ?? null,
    totalDurationMinutes: course.totalDurationMinutes ?? 0,
    totalTravelMinutes: course.totalTravelMinutes ?? 0,
    transport: course.transport ?? 'CAR',
  }

  places.value = (course.places ?? [])
    .map((place) => ({
      placeId: place.placeId,
      name: place.placeName || place.name || '이름 없는 장소',
      sequence: place.sequence,
      travelMinutesFromPrevious: place.travelMinutesFromPrevious ?? 0,
      latitude: place.latitude,
      longitude: place.longitude,
      category: place.category ?? '',
      imageUrl: place.imageUrl ?? '',
      summary: place.summary ?? '',
    }))
    .sort((a, b) => a.sequence - b.sequence)
    .map((place, index) => ({ ...place, sequence: index + 1 }))
}

function mapPlaceResult(place) {
  return {
    placeId: place.placeId,
    name: place.name,
    category: place.category,
    imageUrl: place.imageUrl,
    summary: place.summary || place.description || '',
    latitude: place.latitude,
    longitude: place.longitude,
    likeCount: place.likeCount ?? 0,
    tags: place.tags ?? [],
  }
}

function normalizeSelectedPlace(place, detail) {
  return {
    placeId: place.placeId,
    name: place.name || detail?.name || '이름 없는 장소',
    category: place.category || detail?.category || '',
    imageUrl: place.imageUrl || detail?.imageUrl || '',
    summary: detail?.description || place.summary || place.description || '',
    cityName: detail?.cityName || place.cityName || '',
    address: detail?.roadAddress || detail?.address || place.address || '',
    addressDetail: detail?.roadAddress ? detail.address : place.addressDetail || '',
    phone: detail?.phone || place.phone || '',
    hours: formatHours(detail?.openingTime, detail?.closingTime) || place.hours || '',
    tags: detail?.tags || place.tags || [],
    latitude: detail?.latitude ?? place.latitude ?? null,
    longitude: detail?.longitude ?? place.longitude ?? null,
    travelMinutesFromPrevious: 0,
  }
}

function syncSequences() {
  places.value = places.value.map((place, index) => ({
    ...place,
    sequence: index + 1,
  }))
}

async function loadCourse() {
  if (!courseId.value) {
    errorMessage.value = '수정할 코스 정보를 찾을 수 없습니다.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const course = await getUserCourseDetail(courseId.value)
    mapCourse(course)
  } catch {
    errorMessage.value = '코스 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

function movePlace(fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= places.value.length || fromIndex === toIndex) return

  const nextPlaces = [...places.value]
  const [movedPlace] = nextPlaces.splice(fromIndex, 1)
  nextPlaces.splice(toIndex, 0, movedPlace)
  places.value = nextPlaces
  syncSequences()
}

function deletePlace(index) {
  places.value = places.value.filter((_, placeIndex) => placeIndex !== index)
  syncSequences()
}

function startPlaceDrag(index, event) {
  draggingPlaceIndex.value = index
  dragOverPlaceIndex.value = index
  dragStartY.value = event.clientY
  dragCurrentY.value = event.clientY
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function movePlaceDrag(event) {
  if (draggingPlaceIndex.value === null) return

  dragCurrentY.value = event.clientY

  const target = document
    .elementFromPoint(event.clientX, event.clientY)
    ?.closest('[data-place-index]')
  const targetIndex = Number(target?.dataset.placeIndex)

  if (Number.isInteger(targetIndex)) {
    dragOverPlaceIndex.value = targetIndex
  }
}

function finishPlaceDrag(event) {
  if (draggingPlaceIndex.value === null) return

  movePlaceDrag(event)
  const targetIndex = dragOverPlaceIndex.value

  if (Number.isInteger(targetIndex)) {
    movePlace(draggingPlaceIndex.value, targetIndex)
  }

  draggingPlaceIndex.value = null
  dragOverPlaceIndex.value = null
  dragStartY.value = 0
  dragCurrentY.value = 0
}

function cancelPlaceDrag() {
  draggingPlaceIndex.value = null
  dragOverPlaceIndex.value = null
  dragStartY.value = 0
  dragCurrentY.value = 0
}

function openPlacePicker(mode, index = -1) {
  pickerMode.value = mode
  pickerTargetIndex.value = index
  isPickerOpen.value = true
  selectedPreviewPlace.value = null
  placeErrorMessage.value = ''

  if (!placeResults.value.length) {
    loadPlaces(0)
  }
}

function closePlacePicker() {
  isPickerOpen.value = false
  closePreviewDialog()
}

function closePreviewDialog() {
  selectedPreviewPlace.value = null
  isPreviewLoading.value = false
  previewErrorMessage.value = ''
  previewRequestId.value += 1
}

async function loadPlaces(targetPage = 0) {
  isPlaceLoading.value = true
  placeErrorMessage.value = ''

  try {
    const result = await getPlaceList({
      category: appliedPlaceCategory.value || undefined,
      keyword: appliedPlaceKeyword.value || undefined,
      page: targetPage,
      size: PAGE_SIZE,
    })

    placeResults.value = (result.content ?? []).map(mapPlaceResult)
    placePage.value = result.page ?? targetPage
    placeTotalPages.value = result.totalPages ?? 1
  } catch {
    placeResults.value = []
    placeTotalPages.value = 0
    placeErrorMessage.value = '관광지 목록을 불러오지 못했습니다.'
  } finally {
    isPlaceLoading.value = false
  }
}

async function applyPlaceSearch() {
  appliedPlaceKeyword.value = placeSearchKeyword.value.trim()
  appliedPlaceCategory.value = selectedPlaceCategory.value
  await loadPlaces(0)
}

function selectPlaceCategory(category) {
  selectedPlaceCategory.value = category === '전체' ? '' : category
}

async function goToPlacePage(targetPage) {
  if (targetPage < 0 || targetPage > placeLastPage.value || targetPage === placePage.value) return

  await loadPlaces(targetPage)
}

async function previewPlace(place) {
  const requestId = previewRequestId.value + 1
  previewRequestId.value = requestId
  selectedPreviewPlace.value = place
  isPreviewLoading.value = true
  previewErrorMessage.value = ''

  try {
    const detail = await getPlaceDetail(place.placeId)
    if (previewRequestId.value !== requestId) return

    selectedPreviewPlace.value = normalizeSelectedPlace(place, detail)
  } catch {
    if (previewRequestId.value !== requestId) return

    selectedPreviewPlace.value = normalizeSelectedPlace(place, null)
    previewErrorMessage.value = '상세 정보를 불러오지 못했습니다.'
  } finally {
    if (previewRequestId.value === requestId) {
      isPreviewLoading.value = false
    }
  }
}

function choosePlace(place) {
  const selectedPlace = normalizeSelectedPlace(place, null)

  if (pickerMode.value === 'replace' && pickerTargetIndex.value >= 0) {
    places.value = places.value.map((item, index) =>
      index === pickerTargetIndex.value
        ? {
            ...selectedPlace,
            travelMinutesFromPrevious: item.travelMinutesFromPrevious ?? 0,
          }
        : item,
    )
  } else {
    places.value = [...places.value, selectedPlace]
  }

  syncSequences()
  closePlacePicker()
}

function buildUpdateBody() {
  return {
    cityId: Number(form.value.cityId),
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    theme: form.value.theme,
    startTime: form.value.startTime,
    endTime: form.value.endTime,
    totalDurationMinutes: Number(form.value.totalDurationMinutes ?? 0),
    totalTravelMinutes: Number(form.value.totalTravelMinutes ?? form.value.totalDurationMinutes ?? 0),
    transport: form.value.transport,
    places: places.value.map((place, index) => ({
      placeId: Number(place.placeId),
      sequence: index + 1,
      travelMinutesFromPrevious: Number(place.travelMinutesFromPrevious ?? 0),
    })),
  }
}

async function submitCourse() {
  if (!canSubmit.value || isSaving.value) return

  isSaving.value = true

  try {
    await patchCourse(courseId.value, buildUpdateBody())
    toastStore.success('코스 수정이 완료되었습니다.')
    router.push({ name: 'saved-courses' })
  } catch {
    toastStore.error('코스 수정이 실패했습니다.')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadCourse()
})
</script>

<template>
  <main class="course-edit-view">
    <section class="course-edit-content">
      <header class="course-edit-heading">
        <p>Course Edit</p>
        <h2>코스 수정</h2>
        <span>courseId: {{ selectedCourseIdLabel }}</span>
      </header>

      <section v-if="isLoading" class="course-skeleton" aria-label="코스 정보 로딩 중">
        <span></span>
        <span></span>
        <span></span>
        <div></div>
      </section>

      <p v-else-if="errorMessage" class="status-message">{{ errorMessage }}</p>

      <form v-else class="course-edit-form" @submit.prevent="submitCourse">
        <section class="edit-section">
          <label class="field-label" for="course-title">코스 제목</label>
          <input id="course-title" v-model="form.title" type="text" placeholder="코스 제목" />

          <label class="field-label" for="course-description">코스 설명</label>
          <textarea
            id="course-description"
            v-model="form.description"
            rows="5"
            placeholder="코스 설명"
          ></textarea>

          <div class="duration-panel">
            <span>예상 소요시간</span>
            <strong>{{ formatMinutes(form.totalDurationMinutes) }}</strong>
            <small>{{ durationNotice }}</small>
          </div>
        </section>

        <section class="edit-section route-section">
          <div class="section-title-row">
            <div>
              <p>Route Flow</p>
              <h3>관광지 순서</h3>
            </div>
            <button type="button" class="secondary-action" @click="openPlacePicker('add')">
              관광지 추가
            </button>
          </div>

          <p v-if="!places.length" class="empty-route">등록된 관광지가 없습니다.</p>

          <ol v-else class="editable-place-list">
            <li
              v-for="(place, index) in places"
              :key="`${place.placeId}-${index}`"
              :class="{
                dragging: draggingPlaceIndex === index,
                'drop-target': dragOverPlaceIndex === index && draggingPlaceIndex !== index,
              }"
              :data-place-index="index"
              :style="draggingPlaceIndex === index ? draggedPlaceStyle : undefined"
            >
              <div class="place-order">{{ index + 1 }}</div>
              <button
                type="button"
                class="drag-handle"
                aria-label="순서 이동"
                @pointerdown="startPlaceDrag(index, $event)"
                @pointermove="movePlaceDrag"
                @pointerup="finishPlaceDrag"
                @pointercancel="cancelPlaceDrag"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 7h8M8 12h8M8 17h8" />
                </svg>
              </button>
              <div class="place-body">
                <strong>{{ place.name }}</strong>
                <span>{{ place.category || '관광지' }}</span>
                <small v-if="place.summary">{{ place.summary }}</small>
              </div>
              <div class="place-actions">
                <button type="button" @click="openPlacePicker('replace', index)">관광지변경</button>
                <button type="button" class="danger-action" @click="deletePlace(index)">삭제</button>
              </div>
            </li>
          </ol>
        </section>

        <button class="submit-button" type="submit" :disabled="!canSubmit || isSaving">
          {{ isSaving ? '수정 중입니다' : '수정완료' }}
        </button>
      </form>
    </section>

    <Teleport to="body">
      <div v-if="isPickerOpen" class="place-picker-backdrop" @click.self="closePlacePicker">
        <section class="place-picker" aria-modal="true" role="dialog">
          <header class="picker-header">
            <div>
              <p>{{ pickerMode === 'replace' ? '관광지 변경' : '관광지 추가' }}</p>
              <h2>관광지 선택</h2>
            </div>
            <button type="button" aria-label="닫기" @click="closePlacePicker">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <form class="picker-search" @submit.prevent="applyPlaceSearch">
            <input v-model="placeSearchKeyword" type="search" placeholder="관광지 검색" />
            <button type="submit">검색</button>
          </form>

          <div class="picker-filter-list" aria-label="관광지 유형">
            <button
              v-for="filter in PLACE_FILTER_OPTIONS"
              :key="filter"
              type="button"
              :class="{ active: selectedPlaceCategory === (filter === '전체' ? '' : filter) }"
              @click="selectPlaceCategory(filter)"
            >
              {{ filter }}
            </button>
          </div>

          <p v-if="isPlaceLoading" class="picker-state">관광지를 불러오는 중입니다.</p>
          <p v-else-if="placeErrorMessage" class="picker-state">{{ placeErrorMessage }}</p>

          <section v-else class="picker-layout">
            <ul class="picker-list">
              <li v-for="place in placeResults" :key="place.placeId">
                <button type="button" @click="previewPlace(place)">
                  <span class="picker-image">
                    <img v-if="place.imageUrl" :src="place.imageUrl" :alt="place.name" />
                  </span>
                  <span>
                    <strong>{{ place.name }}</strong>
                    <small>{{ place.category }}</small>
                    <em>{{ place.summary }}</em>
                  </span>
                </button>
              </li>
            </ul>
          </section>

          <nav v-if="placeTotalPages > 1" class="picker-pagination" aria-label="관광지 페이지">
            <button type="button" :disabled="placePage === 0" @click="goToPlacePage(placePage - 1)">
              이전
            </button>
            <span>{{ placePage + 1 }} / {{ placeTotalPages }}</span>
            <button
              type="button"
              :disabled="placePage >= placeLastPage"
              @click="goToPlacePage(placePage + 1)"
            >
              다음
            </button>
          </nav>

          <div
            v-if="selectedPreviewPlace"
            class="preview-dialog-backdrop"
            @click.self="closePreviewDialog"
          >
            <article class="picker-preview" role="dialog" aria-modal="true">
              <header>
                <div>
                  <p>{{ selectedPreviewPlace.category || '관광지' }}</p>
                  <h3>{{ selectedPreviewPlace.name }}</h3>
                </div>
                <button type="button" aria-label="닫기" @click="closePreviewDialog">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </header>

              <div v-if="isPreviewLoading" class="preview-loading" aria-label="관광지 상세 로딩 중">
                <span></span>
                <i></i>
                <i></i>
              </div>

              <template v-else>
                <span class="preview-image">
                  <img
                    v-if="selectedPreviewPlace.imageUrl"
                    :src="selectedPreviewPlace.imageUrl"
                    :alt="selectedPreviewPlace.name"
                  />
                </span>
                <small v-if="previewErrorMessage" class="preview-error">{{
                  previewErrorMessage
                }}</small>
                <span>{{ selectedPreviewPlace.summary || '상세 설명이 없습니다.' }}</span>
                <dl class="preview-detail-list">
                  <div v-if="selectedPreviewPlace.cityName">
                    <dt>지역</dt>
                    <dd>{{ selectedPreviewPlace.cityName }}</dd>
                  </div>
                  <div v-if="selectedPreviewPlace.address">
                    <dt>주소</dt>
                    <dd>
                      {{ selectedPreviewPlace.address }}
                      <small v-if="selectedPreviewPlace.addressDetail">{{
                        selectedPreviewPlace.addressDetail
                      }}</small>
                    </dd>
                  </div>
                  <div v-if="selectedPreviewPlace.phone">
                    <dt>전화</dt>
                    <dd>{{ selectedPreviewPlace.phone }}</dd>
                  </div>
                  <div v-if="selectedPreviewPlace.hours">
                    <dt>운영시간</dt>
                    <dd>{{ selectedPreviewPlace.hours }}</dd>
                  </div>
                </dl>
                <ul v-if="selectedPreviewPlace.tags?.length" class="preview-tag-list">
                  <li v-for="tag in selectedPreviewPlace.tags" :key="tag">#{{ tag }}</li>
                </ul>
                <button type="button" @click="choosePlace(selectedPreviewPlace)">
                  이 관광지 선택
                </button>
              </template>
            </article>
          </div>
        </section>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
.course-edit-view {
  min-height: calc(100vh - 3rem);
  padding: 1rem 0 6.5rem;
  color: #f7f9fc;
}

.course-edit-content {
  width: min(100%, 44rem);
  margin: 0 auto;
}

.course-edit-heading,
.course-edit-form,
.status-message,
.course-skeleton {
  width: calc(100% - 2rem);
  margin-right: auto;
  margin-left: auto;
}

.course-edit-heading {
  margin-top: 0.35rem;
  margin-bottom: 1rem;
  padding: 0.15rem 0 0.65rem;
}

.course-edit-heading p,
.section-title-row p,
.picker-header p,
.picker-preview p {
  color: #8fe6c8;
  font-size: 0.72rem;
  font-weight: 800;
}

.course-edit-heading h2 {
  margin-top: 0.45rem;
  color: #f4f8fc;
  font-size: 1.42rem;
  font-weight: 850;
  line-height: 1.25;
}

.course-edit-heading span {
  display: inline-flex;
  margin-top: 0.5rem;
  color: #91a0b4;
  font-size: 0.76rem;
}

.status-message {
  margin-top: 3rem;
  color: #91a0b4;
  font-size: 0.9rem;
  text-align: center;
}

.course-edit-form,
.edit-section {
  display: grid;
  gap: 0.9rem;
}

.edit-section {
  padding: 1rem;
  background: rgba(18, 29, 41, 0.82);
  border: 1px solid rgba(126, 143, 165, 0.15);
  border-radius: 0.95rem;
}

.field-label {
  color: #8cddff;
  font-size: 0.74rem;
  font-weight: 800;
}

.edit-section input,
.edit-section textarea,
.picker-search input {
  width: 100%;
  color: #f7f9fc;
  background: #172233;
  border: 1px solid #314258;
  border-radius: 0.72rem;
  outline: none;
}

.edit-section input,
.picker-search input {
  min-height: 3rem;
  padding: 0 0.9rem;
}

.edit-section textarea {
  resize: vertical;
  min-height: 8rem;
  padding: 0.85rem 0.9rem;
  line-height: 1.55;
}

.edit-section input:focus,
.edit-section textarea:focus,
.picker-search input:focus {
  border-color: rgba(140, 221, 255, 0.65);
}

.duration-panel {
  display: grid;
  gap: 0.35rem;
  padding: 0.85rem;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 0.72rem;
  opacity: 0.62;
}

.duration-panel span,
.duration-panel small {
  color: #a6b3c4;
  font-size: 0.74rem;
}

.duration-panel strong {
  color: #eef4fb;
  font-size: 1rem;
  font-weight: 900;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.section-title-row h3 {
  margin-top: 0.3rem;
  color: #f4f8fc;
  font-size: 1.05rem;
  font-weight: 900;
}

.secondary-action,
.place-actions button,
.picker-search button,
.picker-pagination button {
  color: #79cfff;
  background: rgba(72, 207, 255, 0.1);
  border: 1px solid rgba(114, 211, 255, 0.26);
  border-radius: 0.55rem;
  font-size: 0.74rem;
  font-weight: 800;
}

.secondary-action {
  min-height: 2.25rem;
  padding: 0 0.75rem;
}

.empty-route {
  color: #91a0b4;
  font-size: 0.84rem;
  text-align: center;
}

.editable-place-list {
  display: grid;
  gap: 0.65rem;
}

.editable-place-list li {
  display: grid;
  grid-template-columns: 2rem 2rem minmax(0, 1fr);
  gap: 0.72rem;
  align-items: start;
  position: relative;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 0.75rem;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
  will-change: transform;
}

.editable-place-list li.dragging {
  border-color: rgba(140, 221, 255, 0.35);
  box-shadow: 0 0.95rem 2rem rgba(0, 0, 0, 0.34);
  opacity: 0.92;
  pointer-events: none;
  transition: none;
}

.editable-place-list li.drop-target {
  border-color: rgba(140, 221, 255, 0.55);
  box-shadow: inset 0 0 0 1px rgba(140, 221, 255, 0.22);
  transform: translateY(0.18rem);
}

.place-order {
  display: grid;
  width: 2rem;
  height: 2rem;
  color: #071321;
  background: #8cddff;
  border-radius: 50%;
  font-size: 0.78rem;
  font-weight: 900;
  place-items: center;
}

.drag-handle {
  display: grid;
  width: 2rem;
  height: 2rem;
  color: #a6b3c4;
  touch-action: none;
  background: rgba(255, 255, 255, 0.055);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.55rem;
  place-items: center;
}

.drag-handle svg {
  width: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.8;
}

.place-body {
  display: grid;
  min-width: 0;
  gap: 0.32rem;
}

.place-body strong,
.place-body small {
  overflow: hidden;
  text-overflow: ellipsis;
}

.place-body strong {
  color: #eef4fb;
  font-size: 0.92rem;
  font-weight: 850;
  white-space: nowrap;
}

.place-body span {
  color: #8cddff;
  font-size: 0.7rem;
  font-weight: 800;
}

.place-body small {
  display: -webkit-box;
  color: #a6b3c4;
  font-size: 0.74rem;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.place-actions {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
}

.place-actions button {
  min-height: 2.2rem;
  padding: 0 0.45rem;
}

.place-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.place-actions .danger-action {
  color: #ffb6c5;
  background: rgba(255, 111, 159, 0.1);
  border-color: rgba(255, 111, 159, 0.24);
}

.submit-button {
  display: grid;
  width: 100%;
  min-height: 3.15rem;
  color: #071321;
  background: #8cddff;
  border: 0;
  border-radius: 0.72rem;
  box-shadow: 0 0.65rem 1.5rem rgba(72, 207, 255, 0.2);
  font-size: 0.92rem;
  font-weight: 900;
  place-items: center;
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.course-skeleton {
  display: grid;
  gap: 0.8rem;
}

.course-skeleton span,
.course-skeleton div {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.075);
  border-radius: 0.72rem;
}

.course-skeleton span {
  height: 3rem;
}

.course-skeleton div {
  height: 15rem;
}

.course-skeleton span::after,
.course-skeleton div::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  content: '';
  animation: skeletonSweep 1.25s ease-in-out infinite;
}

.place-picker-backdrop {
  position: fixed;
  inset: 0;
  z-index: 12000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(3, 9, 15, 0.72);
  backdrop-filter: blur(0.48rem);
}

.place-picker {
  width: min(100%, 44rem);
  height: min(calc(100vh - 3.6rem), 45rem);
  overflow-y: auto;
  padding: 0.95rem 1rem 1.3rem;
  color: #f7f9fc;
  background: #101a27;
  border: 1px solid rgba(199, 214, 229, 0.2);
  border-bottom: 0;
  border-radius: 1.25rem 1.25rem 0 0;
  box-shadow: 0 -1rem 3.5rem rgba(0, 0, 0, 0.48);
}

.picker-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.picker-header h2 {
  margin-top: 0.35rem;
  color: #f4f8fc;
  font-size: 1.18rem;
  font-weight: 900;
}

.picker-header > button {
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

.picker-header svg {
  width: 0.9rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.picker-search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 4.4rem;
  gap: 0.55rem;
  margin-top: 1rem;
}

.picker-search button {
  min-height: 3rem;
}

.picker-filter-list {
  display: flex;
  gap: 0.45rem;
  margin-top: 0.75rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.picker-filter-list button {
  flex: 0 0 auto;
  min-height: 2.15rem;
  padding: 0 0.75rem;
  color: #aeb9c8;
  background: #202b3a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
}

.picker-filter-list button.active {
  color: #071321;
  background: #8cddff;
  border-color: #8cddff;
}

.picker-state {
  padding: 2rem 0;
  color: #91a0b4;
  font-size: 0.84rem;
  text-align: center;
}

.picker-layout {
  display: grid;
  gap: 0.85rem;
  margin-top: 0.85rem;
}

.picker-list {
  display: grid;
  gap: 0.62rem;
}

.picker-list button {
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr);
  gap: 0.72rem;
  align-items: center;
  width: 100%;
  padding: 0.65rem;
  color: inherit;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 0.75rem;
  text-align: left;
}

.picker-image,
.preview-image {
  overflow: hidden;
  background: linear-gradient(135deg, rgba(70, 103, 130, 0.2), rgba(12, 22, 35, 0.06)), #0e1826;
  border-radius: 0.55rem;
}

.picker-image {
  aspect-ratio: 1;
}

.picker-image img,
.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.picker-list strong,
.picker-list small,
.picker-list em {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-list strong {
  color: #eef4fb;
  font-size: 0.9rem;
  font-style: normal;
  font-weight: 850;
  white-space: nowrap;
}

.picker-list small {
  margin-top: 0.3rem;
  color: #8cddff;
  font-size: 0.68rem;
  font-weight: 800;
}

.picker-list em {
  display: -webkit-box;
  margin-top: 0.38rem;
  color: #a6b3c4;
  font-size: 0.72rem;
  font-style: normal;
  line-height: 1.42;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.preview-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1;
  display: grid;
  padding: 1rem;
  background: rgba(3, 9, 15, 0.68);
  place-items: center;
}

.picker-preview {
  display: grid;
  gap: 0.75rem;
  width: min(100%, 22rem);
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  padding: 0.8rem;
  background: #101a27;
  border: 1px solid rgba(140, 221, 255, 0.24);
  border-radius: 0.85rem;
  box-shadow: 0 1.2rem 3rem rgba(0, 0, 0, 0.42);
  animation: previewIn 0.18s ease both;
}

.picker-preview header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.picker-preview header > button {
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

.picker-preview header svg {
  width: 0.9rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.preview-loading {
  display: grid;
  gap: 0.65rem;
}

.preview-loading span,
.preview-loading i {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.075);
  border-radius: 0.65rem;
}

.preview-loading span {
  aspect-ratio: 16 / 8;
}

.preview-loading i {
  height: 0.75rem;
}

.preview-loading i:nth-child(2) {
  width: 84%;
}

.preview-loading i:nth-child(3) {
  width: 56%;
}

.preview-loading span::after,
.preview-loading i::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  content: '';
  animation: skeletonSweep 1.25s ease-in-out infinite;
}

.preview-image {
  aspect-ratio: 16 / 8;
}

.picker-preview h3 {
  margin-top: 0.3rem;
  color: #f4f8fc;
  font-size: 1rem;
  font-weight: 900;
}

.picker-preview span {
  display: block;
  margin-top: 0.45rem;
  color: #c8d3df;
  font-size: 0.8rem;
  line-height: 1.55;
}

.preview-detail-list {
  display: grid;
  gap: 0.55rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.preview-detail-list div {
  display: grid;
  gap: 0.25rem;
}

.preview-detail-list dt {
  color: #8cddff;
  font-size: 0.68rem;
  font-weight: 850;
}

.preview-detail-list dd {
  color: #d5dee8;
  font-size: 0.76rem;
  line-height: 1.45;
}

.preview-detail-list dd small {
  display: block;
  margin-top: 0.18rem;
  color: #8c9aab;
  font-size: 0.68rem;
}

.preview-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.preview-tag-list li {
  padding: 0.3rem 0.55rem;
  color: #aeb9c8;
  background: #202b3a;
  border-radius: 999px;
  font-size: 0.65rem;
}

.preview-error {
  color: #ffb6c5;
  font-size: 0.72rem;
  font-weight: 800;
}

.picker-preview button {
  min-height: 2.8rem;
  color: #071321;
  background: #8cddff;
  border: 0;
  border-radius: 0.65rem;
  font-size: 0.86rem;
  font-weight: 900;
}

.picker-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  margin-top: 1rem;
}

.picker-pagination button {
  min-height: 2.25rem;
  padding: 0 0.8rem;
}

.picker-pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.picker-pagination span {
  color: #a6b3c4;
  font-size: 0.76rem;
}

@keyframes skeletonSweep {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
}

@keyframes previewIn {
  from {
    opacity: 0;
    transform: translateY(0.45rem) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 430px) {
  .place-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 640px) {
  .editable-place-list li {
    grid-template-columns: 2rem 2rem minmax(0, 1fr) 15rem;
  }

  .place-actions {
    grid-column: auto;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
