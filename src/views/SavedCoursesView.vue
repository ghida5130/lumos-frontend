<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getUserCourseDetail, getUserCourses } from '@/api/users'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-js-api'

const router = useRouter()

const courses = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const selectedCourse = ref(null)
const courseDetail = ref(null)
const isDetailLoading = ref(false)
const detailErrorMessage = ref('')
const mapRoot = ref(null)
const mapErrorMessage = ref('')

let map = null
let mapMarkers = []
let mapPolyline = null

function formatDate(dateText) {
  if (!dateText) return ''
  return dateText.replace('T', ' ').slice(0, 16)
}

function formatMinutes(minutes) {
  if (!Number.isFinite(minutes)) return '-'
  if (minutes < 60) return `${minutes}분`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return remainingMinutes ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
}

function formatTheme(theme) {
  return {
    AI_RECOMMEND: '추천 코스',
    'AI_RECOMMEND(theme)': '추천 코스',
  }[theme] ?? theme ?? '-'
}

function mapCourse(course) {
  return {
    id: course.courseId,
    cityName: course.cityName,
    title: course.title,
    description: course.description,
    theme: formatTheme(course.theme),
    duration: formatMinutes(course.totalDurationMinutes),
    placeCount: course.placeCount ?? 0,
    createdAt: formatDate(course.createdAt),
    updatedAt: formatDate(course.updatedAt),
  }
}

function mapCourseDetail(course) {
  return {
    id: course.courseId,
    cityName: course.cityName,
    title: course.title,
    description: course.description,
    theme: formatTheme(course.theme),
    duration: formatMinutes(course.totalDurationMinutes),
    travelDuration: formatMinutes(course.totalTravelMinutes),
    createdAt: formatDate(course.createdAt),
    updatedAt: formatDate(course.updatedAt),
    places: (course.places ?? [])
      .map((place) => ({
        id: place.placeId,
        order: place.sequence,
        name: place.placeName,
        latitude: place.latitude,
        longitude: place.longitude,
      }))
      .sort((a, b) => a.order - b.order),
  }
}

function loadGoogleMaps() {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps)
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error('Google Maps API 키를 입력해주세요.'))
  }

  const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID)

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(window.google.maps), { once: true })
      existingScript.addEventListener('error', reject, { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const params = new URLSearchParams({
      key: GOOGLE_MAPS_API_KEY,
      v: 'weekly',
      language: 'ko',
      region: 'KR',
    })

    script.id = GOOGLE_MAPS_SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    script.async = true
    script.defer = true
    script.addEventListener('load', () => resolve(window.google.maps), { once: true })
    script.addEventListener('error', reject, { once: true })
    document.head.appendChild(script)
  })
}

function createCoursePin() {
  const svg = `
    <svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
      <filter id="shadow" x="-30%" y="-20%" width="160%" height="160%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.35"/>
      </filter>
      <path filter="url(#shadow)" d="M17 2C9.8 2 4 7.8 4 15c0 9.7 13 25 13 25s13-15.3 13-25C30 7.8 24.2 2 17 2Z" fill="#8cddff" stroke="#071321" stroke-width="2"/>
    </svg>
  `

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(34, 42),
    anchor: new window.google.maps.Point(17, 42),
    labelOrigin: new window.google.maps.Point(17, 17),
  }
}

function clearMap() {
  mapMarkers.forEach((marker) => marker.setMap(null))
  mapMarkers = []

  if (mapPolyline) {
    mapPolyline.setMap(null)
    mapPolyline = null
  }

  map = null
}

async function renderMap() {
  clearMap()
  mapErrorMessage.value = ''
  await nextTick()

  if (!courseDetail.value || !mapRoot.value) return

  const places = courseDetail.value.places.filter((place) =>
    Number.isFinite(Number(place.latitude)) && Number.isFinite(Number(place.longitude)),
  )

  if (!places.length) {
    mapErrorMessage.value = '지도에 표시할 좌표가 없습니다.'
    return
  }

  try {
    await loadGoogleMaps()

    const path = places.map((place) => ({
      lat: Number(place.latitude),
      lng: Number(place.longitude),
    }))
    const bounds = new window.google.maps.LatLngBounds()

    map = new window.google.maps.Map(mapRoot.value, {
      center: path[0],
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
      backgroundColor: '#071321',
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#142235' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#d5e5f5' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#071321' }] },
        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1d3044' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#26394e' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#06111e' }] },
      ],
    })

    mapMarkers = places.map((place, index) => {
      const position = path[index]
      bounds.extend(position)

      return new window.google.maps.Marker({
        position,
        map,
        title: place.name,
        icon: createCoursePin(),
        label: {
          text: String(place.order ?? index + 1),
          color: '#071321',
          fontFamily: 'SUIT, Arial, sans-serif',
          fontSize: '13px',
          fontWeight: '800',
        },
        zIndex: 20 + index,
      })
    })

    mapPolyline = new window.google.maps.Polyline({
      path,
      map,
      strokeColor: '#8cddff',
      strokeOpacity: 0.92,
      strokeWeight: 4,
    })

    map.fitBounds(bounds, 56)
  } catch (error) {
    mapErrorMessage.value = error.message || '지도를 불러오지 못했습니다.'
  }
}

async function openCourse(course) {
  selectedCourse.value = course
  courseDetail.value = null
  detailErrorMessage.value = ''
  isDetailLoading.value = true
  document.body.style.overflow = 'hidden'

  try {
    const detail = await getUserCourseDetail(course.id)
    courseDetail.value = mapCourseDetail(detail)
  } catch {
    detailErrorMessage.value = '저장한 경로 상세 정보를 불러오지 못했습니다.'
  } finally {
    isDetailLoading.value = false
  }

  if (courseDetail.value) {
    await renderMap()
  }
}

async function loadCourses() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await getUserCourses()

    courses.value = (result.content ?? []).map(mapCourse)
  } catch {
    courses.value = []
    errorMessage.value = '저장한 여행 경로를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

function closeCourse() {
  selectedCourse.value = null
  courseDetail.value = null
  detailErrorMessage.value = ''
  isDetailLoading.value = false
  document.body.style.overflow = ''
  clearMap()
}

function goToPlaceDetail(placeId) {
  router.push({ name: 'detail', query: { id: placeId } })
}

function goToCourseEdit() {
  const courseId = courseDetail.value?.id ?? selectedCourse.value?.id

  if (!courseId) return

  router.push({ name: 'course-edit', query: { courseId } })
}

onMounted(() => {
  loadCourses()
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  clearMap()
})
</script>

<template>
  <main class="saved-courses-view">
    <section class="saved-courses-content">
      <header class="saved-courses-heading">
        <p>내가 저장한 코스</p>
        <h2>여행 경로 {{ courses.length }}개</h2>
      </header>

      <p v-if="isLoading" class="status-message">저장한 여행 경로를 불러오는 중입니다.</p>
      <p v-else-if="errorMessage" class="status-message">{{ errorMessage }}</p>

      <section v-else-if="courses.length" class="course-list" aria-label="저장한 여행 경로">
        <button
          v-for="(course, index) in courses"
          :key="course.id"
          class="course-row"
          type="button"
          @click="openCourse(course)"
        >
          <span class="course-row-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="course-row-main">
            <span class="course-row-kicker">
              <span class="city-chip">{{ course.cityName }}</span>
              <span class="course-created-at">{{ course.createdAt }}</span>
            </span>
            <strong>{{ course.title }}</strong>
            <small>{{ course.description }}</small>
          </span>
          <span class="course-row-side">
            <span class="theme-chip">{{ course.theme }}</span>
            <small>{{ course.duration }}</small>
            <span class="place-count">{{ course.placeCount }}곳</span>
            <svg class="chevron-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </span>
        </button>
      </section>

      <section v-else class="empty-state">
        <h2>저장한 여행 경로가 없습니다</h2>
        <p>AI가 추천한 여행 경로를 저장하면 이곳에서 다시 확인할 수 있습니다.</p>
      </section>
    </section>

    <Teleport to="body">
      <div v-if="selectedCourse" class="course-sheet-backdrop" @click.self="closeCourse">
        <section class="course-sheet" aria-modal="true" role="dialog">
          <div class="sheet-handle" aria-hidden="true"></div>

          <header class="sheet-header">
            <div>
              <p>저장한 야간 여행 경로</p>
              <h2>{{ courseDetail?.title || selectedCourse.title }}</h2>
              <span class="city-chip">{{ courseDetail?.cityName || selectedCourse.cityName }}</span>
            </div>
            <button type="button" aria-label="닫기" @click="closeCourse">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <p v-if="isDetailLoading" class="sheet-state">저장한 경로 상세 정보를 불러오는 중입니다.</p>
          <p v-else-if="detailErrorMessage" class="sheet-state">{{ detailErrorMessage }}</p>

          <div v-if="isDetailLoading" class="sheet-skeleton" aria-hidden="true">
            <span class="skeleton-line skeleton-line--wide"></span>
            <span class="skeleton-line"></span>
            <div class="skeleton-map"></div>
            <div class="skeleton-stats">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="skeleton-places">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          <template v-else-if="courseDetail">
            <p class="sheet-description">{{ courseDetail.description }}</p>

            <section class="sheet-map-section">
              <div ref="mapRoot" class="sheet-map"></div>
              <p v-if="mapErrorMessage" class="map-error">{{ mapErrorMessage }}</p>
            </section>

            <dl class="sheet-stats">
              <div>
                <dt>도시</dt>
                <dd>{{ courseDetail.cityName }}</dd>
              </div>
              <div>
                <dt>유형</dt>
                <dd>{{ courseDetail.theme }}</dd>
              </div>
              <div>
                <dt>장소</dt>
                <dd>{{ courseDetail.places.length }}개</dd>
              </div>
              <div>
                <dt>총 소요</dt>
                <dd>{{ courseDetail.duration }}</dd>
              </div>
            </dl>

            <div class="route-flow-heading">
              <span>Route Flow</span>
              <strong>{{ courseDetail.places.length }} stops</strong>
            </div>

            <ol class="sheet-place-list">
              <li v-for="place in courseDetail.places" :key="place.id">
                <button type="button" @click="goToPlaceDetail(place.id)">
                  <span>{{ place.order }}</span>
                  <strong>{{ place.name }}</strong>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </li>
            </ol>

            <footer class="sheet-footer">
              <span>저장 {{ courseDetail.createdAt }}</span>
              <span v-if="courseDetail.updatedAt">수정 {{ courseDetail.updatedAt }}</span>
            </footer>

            <button type="button" class="course-edit-button" @click="goToCourseEdit">
              코스 수정하기
            </button>
          </template>
        </section>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
.saved-courses-view {
  min-height: calc(100vh - 3rem);
  padding: 0.75rem 0 6.5rem;
  color: #f7f9fc;
}

.saved-courses-content {
  width: min(100%, 44rem);
  margin: 0 auto;
}

.saved-courses-heading,
.status-message,
.empty-state {
  width: calc(100% - 2rem);
  margin-right: auto;
  margin-left: auto;
}

.saved-courses-heading {
  margin-top: 0.45rem;
  margin-bottom: 0.75rem;
}

.saved-courses-heading p {
  margin-bottom: 0.4rem;
  color: #91a0b4;
  font-size: 0.78rem;
  font-weight: 400;
}

.saved-courses-heading h2 {
  font-size: 1.35rem;
  font-weight: 700;
}

.status-message {
  margin-top: 3rem;
  color: #91a0b4;
  font-size: 0.9rem;
  text-align: center;
}

.course-list {
  display: grid;
  overflow: hidden;
  width: 100%;
  background: rgba(15, 23, 34, 0.46);
  border-top: 1px solid rgba(126, 143, 165, 0.16);
  border-bottom: 1px solid rgba(126, 143, 165, 0.16);
}

.course-row + .course-row {
  border-top: 1px solid rgba(126, 143, 165, 0.12);
}

.course-row {
  display: grid;
  grid-template-columns: 3.75rem minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: center;
  width: 100%;
  min-height: 4.9rem;
  padding: 0.62rem 1rem;
  color: inherit;
  background: transparent;
  border: 0;
  text-align: left;
  transition:
    background 0.2s ease,
    padding 0.2s ease;
}

.course-row:hover,
.course-row:focus-visible {
  background: rgba(33, 45, 59, 0.76);
  outline: none;
  padding-left: 1.08rem;
}

.course-row-index {
  display: grid;
  width: 3.75rem;
  aspect-ratio: 1;
  color: #dff7f0;
  background:
    linear-gradient(135deg, rgba(127, 199, 178, 0.22), rgba(72, 115, 147, 0.12)),
    #101a26;
  border: 1px solid rgba(126, 143, 165, 0.16);
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 800;
  place-items: center;
}

.course-row-main,
.course-row-side {
  display: grid;
  min-width: 0;
}

.course-row-main {
  gap: 0.28rem;
}

.course-row-main strong,
.course-row-main small,
.course-row-side span,
.course-row-side small,
.course-row-kicker span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-row-kicker {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  color: #7f8da0;
  font-size: 0.62rem;
}

.course-row-main strong {
  color: #eef4fb;
  font-size: 0.88rem;
  font-weight: 700;
}

.course-row-main small {
  display: -webkit-box;
  color: #9eabbc;
  font-size: 0.72rem;
  line-height: 1.32;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.course-row-side {
  display: grid;
  grid-template-columns: auto 0.95rem;
  align-items: center;
  justify-items: end;
  gap: 0.3rem 0.45rem;
  max-width: 6.7rem;
  color: #90a0b3;
}

.course-row-side small {
  grid-column: 1;
  font-size: 0.62rem;
}

.place-count {
  grid-column: 1;
  color: #8fe6c8;
  font-size: 0.62rem;
  font-weight: 800;
}

.chevron-icon {
  grid-column: 2;
  grid-row: 1 / span 3;
  width: 0.95rem;
  fill: none;
  stroke: #728196;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.city-chip,
.theme-chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 1.3rem;
  padding: 0 0.42rem;
  overflow: hidden;
  border-radius: 999px;
  font-size: 0.6rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.city-chip {
  width: fit-content;
  color: #e6f7f2;
  background: rgba(127, 199, 178, 0.16);
  border: 1px solid rgba(127, 199, 178, 0.3);
}

.theme-chip {
  grid-column: 1;
  color: #cdebe4;
  background: rgba(127, 199, 178, 0.12);
  border: 1px solid rgba(127, 199, 178, 0.22);
}

.course-sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 12000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(3, 9, 15, 0.72);
  backdrop-filter: blur(0.48rem);
}

.course-sheet {
  width: min(100%, 44rem);
  height: min(calc(100vh - 3.6rem), 44rem);
  max-height: calc(100vh - 3.6rem);
  overflow-y: auto;
  padding: 0.7rem 1rem 1.3rem;
  color: #f7f9fc;
  background: #101a27;
  border: 1px solid rgba(199, 214, 229, 0.2);
  border-bottom: 0;
  border-radius: 1.25rem 1.25rem 0 0;
  box-shadow: 0 -1rem 3.5rem rgba(0, 0, 0, 0.48);
  animation: sheetUp 0.24s ease-out both;
}

.sheet-handle {
  width: 2.6rem;
  height: 0.25rem;
  margin: 0 auto 0.85rem;
  background: #536275;
  border-radius: 999px;
}

.sheet-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.05rem;
}

.sheet-header p {
  margin-bottom: 0.42rem;
  color: #8fe6c8;
  font-size: 0.68rem;
  font-weight: 850;
}

.sheet-header h2 {
  margin-bottom: 0.62rem;
  color: #f4f8fc;
  font-size: 1.24rem;
  font-weight: 900;
  line-height: 1.35;
}

.sheet-header button {
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

.sheet-header svg,
.sheet-place-list svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sheet-header svg {
  width: 0.9rem;
  stroke-width: 1.8;
}

.sheet-state {
  padding: 1.1rem 0 0.75rem;
  color: #91a0b4;
  font-size: 0.82rem;
  text-align: center;
}

.sheet-skeleton {
  display: grid;
  gap: 0.85rem;
  margin-top: 0.65rem;
}

.skeleton-line,
.skeleton-map,
.skeleton-stats span,
.skeleton-places span {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.075);
  border-radius: 0.7rem;
  position: relative;
}

.skeleton-line::after,
.skeleton-map::after,
.skeleton-stats span::after,
.skeleton-places span::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  content: '';
  animation: skeletonSweep 1.25s ease-in-out infinite;
}

.skeleton-line {
  width: 72%;
  height: 0.8rem;
}

.skeleton-line--wide {
  width: 100%;
}

.skeleton-map {
  height: 16.2rem;
  border-radius: 0.95rem;
}

.skeleton-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.55rem;
}

.skeleton-stats span {
  height: 3.8rem;
}

.skeleton-places {
  display: grid;
  gap: 0.62rem;
}

.skeleton-places span {
  height: 3.35rem;
}

.sheet-description {
  margin-top: 0.95rem;
  color: #ccd6e1;
  font-size: 0.84rem;
  line-height: 1.6;
}

.sheet-map-section {
  position: relative;
  margin-top: 1rem;
  overflow: hidden;
  background: #071321;
  border: 1px solid rgba(140, 221, 255, 0.2);
  border-radius: 0.95rem;
  box-shadow: 0 0.85rem 2rem rgba(0, 0, 0, 0.28);
}

.sheet-map {
  width: 100%;
  height: 16.2rem;
}

.map-error {
  position: absolute;
  inset: 0;
  display: grid;
  padding: 1rem;
  color: #aeb8c7;
  background: rgba(7, 19, 33, 0.9);
  font-size: 0.78rem;
  place-items: center;
  text-align: center;
}

.sheet-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.55rem;
  margin-top: 0.85rem;
}

.sheet-stats div {
  min-width: 0;
  padding: 0.72rem 0.68rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.085);
  border-radius: 0.72rem;
}

.sheet-stats dt {
  color: #8c9aab;
  font-size: 0.62rem;
}

.sheet-stats dd {
  margin-top: 0.34rem;
  overflow: hidden;
  color: #eef4fb;
  font-size: 0.8rem;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-flow-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.1rem;
  color: #8cddff;
}

.route-flow-heading span {
  font-size: 0.7rem;
  font-weight: 900;
}

.route-flow-heading strong {
  color: #91a0b4;
  font-size: 0.68rem;
  font-weight: 700;
}

.sheet-place-list {
  display: grid;
  gap: 0.62rem;
  margin-top: 0.62rem;
}

.sheet-place-list button {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) 1rem;
  gap: 0.7rem;
  align-items: center;
  width: 100%;
  padding: 0.72rem;
  color: inherit;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 0.75rem;
  text-align: left;
}

.sheet-place-list button:hover {
  background: rgba(140, 221, 255, 0.085);
  border-color: rgba(140, 221, 255, 0.22);
}

.sheet-place-list button > span {
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

.sheet-place-list strong {
  overflow: hidden;
  color: #eef4fb;
  font-size: 0.88rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sheet-place-list svg {
  width: 1rem;
  color: #8cddff;
  stroke-width: 1.8;
}

.sheet-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
  padding-top: 0.9rem;
  color: #8796aa;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.7rem;
}

.course-edit-button {
  display: grid;
  width: 100%;
  min-height: 3rem;
  margin-top: 1rem;
  color: #071321;
  background: #8cddff;
  border: 0;
  border-radius: 0.72rem;
  box-shadow: 0 0.65rem 1.5rem rgba(72, 207, 255, 0.2);
  font-size: 0.9rem;
  font-weight: 900;
  place-items: center;
}

.course-edit-button:hover,
.course-edit-button:focus-visible {
  background: #a2e4ff;
  outline: none;
}

.empty-state {
  margin-top: 4rem;
  padding: 2rem 1rem;
  color: #91a0b4;
  background: rgba(23, 34, 51, 0.82);
  border: 1px solid #314258;
  border-radius: 0.75rem;
  text-align: center;
}

.empty-state h2 {
  color: #dce5ee;
  font-size: 1rem;
  font-weight: 600;
}

.empty-state p {
  margin-top: 0.6rem;
  font-size: 0.78rem;
  line-height: 1.5;
}

@keyframes sheetUp {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}

@keyframes skeletonSweep {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
}

@media (max-width: 430px) {
  .course-row {
    grid-template-columns: 3.35rem minmax(0, 1fr) auto;
    gap: 0.55rem;
    padding-right: 0.75rem;
    padding-left: 0.75rem;
  }

  .course-row-index {
    width: 3.35rem;
  }

  .course-row-side {
    max-width: 5.7rem;
  }

  .sheet-stats,
  .skeleton-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 640px) {
  .course-row:hover,
  .course-row:focus-visible {
    padding-left: 1.12rem;
  }
}
</style>
