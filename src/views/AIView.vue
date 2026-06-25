<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { postCourse, postCourseRecommend } from '@/api/course'
import { getPlaceDetail } from '@/api/place'
import { useToastStore } from '@/stores/toast'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-js-api'
const CITIES = ['인천', '통영', '대전', '부산', '강릉', '전주', '진주', '공주', '성주', '여수']
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const router = useRouter()
const toastStore = useToastStore()
const conversation = ref(null)
const prompt = ref('')
const step = ref('intro')
const selectedCity = ref('')
const selectedDate = ref('')
const selectedCourse = ref(null)
const selectedPlace = ref(null)
const selectedPlaceDetail = ref(null)
const modalMapRoot = ref(null)
const mapErrorMessage = ref('')
const calendarCursor = ref(new Date())
const isBotThinking = ref(false)
const isPlaceDetailLoading = ref(false)
const placeDetailErrorMessage = ref('')
const isSavingCourse = ref(false)
const messages = ref([
  createAssistantMessage('안녕하세요! AI가 야간 여행 계획을 도와드립니다.'),
])

let map = null
let mapMarkers = []
let mapPolyline = null
let isAlive = true

const isRecommending = computed(() => step.value === 'recommending')
const canSubmitPrompt = computed(() => step.value === 'content' && prompt.value.trim().length > 0)
const calendarTitle = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
  }).format(calendarCursor.value),
)

const calendarDays = computed(() => {
  const year = calendarCursor.value.getFullYear()
  const month = calendarCursor.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    days.push(null)
  }

  for (let date = 1; date <= lastDay.getDate(); date += 1) {
    const day = new Date(year, month, date)
    days.push({
      date,
      value: formatDate(day),
      isToday: formatDate(day) === formatDate(new Date()),
    })
  }

  return days
})

function createAssistantMessage(content, control = null) {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    control,
    sentAt: formatTime(),
  }
}

function createUserMessage(content) {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    content,
    sentAt: formatTime(),
  }
}

function formatTime() {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date())
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatMinutes(minutes) {
  if (!Number.isFinite(minutes)) return '-'
  if (minutes < 60) return `${minutes}분`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return remainingMinutes ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
}

function formatDistance(distance) {
  if (!Number.isFinite(distance)) return '-'

  return `${distance.toFixed(1)}km`
}

function formatHours(openingTime, closingTime) {
  if (!openingTime && !closingTime) {
    return '영업시간 정보 없음'
  }

  return `${openingTime ?? '-'} - ${closingTime ?? '-'}`
}

function normalizePlaceName(place, index) {
  return place.name && !place.name.includes('?') ? place.name : `장소 ${index + 1}`
}

function normalizeCategory(category) {
  if (!category || category.includes('?')) return '장소'

  return category
}

function normalizeRecommendations(recommendations = []) {
  return recommendations.slice(0, 3).map((course, courseIndex) => ({
    ...course,
    rank: course.rank ?? courseIndex + 1,
    places: (course.places ?? []).map((place, placeIndex) => ({
      ...place,
      displayName: normalizePlaceName(place, placeIndex),
      displayCategory: normalizeCategory(place.category),
    })),
  }))
}

function getCourseSummary(course) {
  return course.places.map((place) => place.displayName).join(' - ')
}

function mapPlaceDetail(placeData) {
  const tags = placeData.tags ?? []

  return {
    id: placeData.placeId,
    title: placeData.name,
    image: placeData.imageUrl,
    categories: [placeData.category, ...tags].filter(Boolean),
    description: placeData.description,
    address: placeData.roadAddress || placeData.address || '주소 정보 없음',
    addressDetail: placeData.roadAddress ? placeData.address : '',
    phone: placeData.phone || '전화번호 정보 없음',
    hours: formatHours(placeData.openingTime, placeData.closingTime),
    likeCount: placeData.likeCount ?? 0,
    reviewCount: placeData.reviewCount ?? 0,
  }
}

function getCourseSaveBody(course) {
  return {
    city: selectedCity.value,
    date: selectedDate.value,
    courses: [
      {
        rank: course.rank,
        totalScore: course.totalScore,
        totalDistanceKm: course.totalDistanceKm,
        estimatedMoveMinutes: course.estimatedMoveMinutes,
        places: course.places.map((place) => ({
          order: place.order,
          placeId: place.placeId,
          name: place.name,
          category: place.category,
          latitude: place.latitude,
          longitude: place.longitude,
          score: place.score,
          tagScore: place.tagScore,
          distanceScore: place.distanceScore,
          tags: place.tags ?? [],
        })),
      },
    ],
  }
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

async function scrollToLatestMessage() {
  await nextTick()
  conversation.value?.scrollTo({
    top: conversation.value.scrollHeight,
    behavior: 'smooth',
  })
}

async function showAssistantMessage(content, control, nextStep, delayMs = 680) {
  isBotThinking.value = true
  await scrollToLatestMessage()
  await sleep(delayMs)

  if (!isAlive) return

  isBotThinking.value = false
  messages.value.push(createAssistantMessage(content, control))
  step.value = nextStep
  await scrollToLatestMessage()
}

async function selectCity(city) {
  if (step.value !== 'city') return

  selectedCity.value = city
  messages.value.push(createUserMessage(city))
  step.value = 'transition'
  await showAssistantMessage('여행을 계획중인 날짜를 선택해주세요.', 'date', 'date')
}

function moveCalendar(monthOffset) {
  const nextDate = new Date(calendarCursor.value)

  nextDate.setMonth(nextDate.getMonth() + monthOffset)
  calendarCursor.value = nextDate
}

async function selectDate(date) {
  if (step.value !== 'date') return

  selectedDate.value = date
  messages.value.push(createUserMessage(date))
  step.value = 'transition'
  await showAssistantMessage('계획중인 여행에 대해 자유롭게 작성해주세요.', 'content', 'content')
}

async function submitPrompt() {
  const content = prompt.value.trim()

  if (!content || step.value !== 'content') return

  prompt.value = ''
  messages.value.push(createUserMessage(content))
  const loadingMessage = createAssistantMessage('AI가 여행 취향과 장소 흐름을 분석중입니다.', 'loading')

  messages.value.push(loadingMessage)
  step.value = 'recommending'
  scrollToLatestMessage()

  try {
    const result = await postCourseRecommend({
      city: selectedCity.value,
      date: selectedDate.value,
      content,
    })
    const recommendations = normalizeRecommendations(result.recommendations)

    loadingMessage.content = '분석이 끝났어요. 마음에 드는 경로를 선택해 상세 정보를 확인해보세요.'
    loadingMessage.control = 'recommendations'
    loadingMessage.recommendations = recommendations
    step.value = 'done'
  } catch (error) {
    loadingMessage.content =
      error.statusCode === 401
        ? '로그인이 필요합니다. 로그인 후 다시 추천을 요청해주세요.'
        : '추천 경로를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
    loadingMessage.control = null
    step.value = 'content'
  } finally {
    scrollToLatestMessage()
  }
}

function openCourse(course) {
  selectedCourse.value = course
}

function closeCourse() {
  selectedCourse.value = null
  closePlaceDetail()
  clearModalMap()
}

async function openPlaceDetail(place) {
  selectedPlace.value = place
  selectedPlaceDetail.value = null
  placeDetailErrorMessage.value = ''
  isPlaceDetailLoading.value = true

  try {
    const placeData = await getPlaceDetail(place.placeId)
    selectedPlaceDetail.value = mapPlaceDetail(placeData)
  } catch {
    placeDetailErrorMessage.value = '장소 상세 정보를 불러오지 못했습니다.'
  } finally {
    isPlaceDetailLoading.value = false
  }
}

function closePlaceDetail() {
  selectedPlace.value = null
  selectedPlaceDetail.value = null
  placeDetailErrorMessage.value = ''
  isPlaceDetailLoading.value = false
}

async function saveSelectedCourse() {
  if (!selectedCourse.value || isSavingCourse.value) return

  isSavingCourse.value = true
  const savedCourseRank = selectedCourse.value.rank

  try {
    await postCourse(getCourseSaveBody(selectedCourse.value))
    toastStore.success(`${savedCourseRank}번 경로가 저장되었습니다.`)
    closeCourse()
    messages.value.push(
      createAssistantMessage(
        '저장한 경로를 확인하거나 추가 추천을 받을 수 있습니다',
        'afterSave',
      ),
    )
    await scrollToLatestMessage()
  } catch (error) {
    if (error.statusCode === 401) {
      toastStore.warning('로그인이 필요합니다.')
    } else {
      toastStore.error('코스 저장에 실패했습니다.')
    }
  } finally {
    isSavingCourse.value = false
  }
}

function goToSavedCourses() {
  router.push({ name: 'saved-courses' })
}

function clearModalMap() {
  mapMarkers.forEach((marker) => marker.setMap(null))
  mapMarkers = []

  if (mapPolyline) {
    mapPolyline.setMap(null)
    mapPolyline = null
  }

  map = null
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

function createCoursePin(order) {
  const svg = `
    <svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
      <filter id="shadow" x="-30%" y="-20%" width="160%" height="160%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.35"/>
      </filter>
      <path filter="url(#shadow)" d="M17 2C9.8 2 4 7.8 4 15c0 9.7 13 25 13 25s13-15.3 13-25C30 7.8 24.2 2 17 2Z" fill="#8cddff" stroke="#071321" stroke-width="2"/>
      <text x="17" y="19" dominant-baseline="middle" text-anchor="middle" fill="#071321" font-family="Arial, sans-serif" font-size="13" font-weight="800">${order}</text>
    </svg>
  `

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(34, 42),
    anchor: new window.google.maps.Point(17, 42),
  }
}

async function renderModalMap() {
  clearModalMap()
  mapErrorMessage.value = ''
  await nextTick()

  if (!selectedCourse.value || !modalMapRoot.value) return

  const places = selectedCourse.value.places.filter((place) =>
    Number.isFinite(Number(place.latitude)) && Number.isFinite(Number(place.longitude)),
  )

  if (!places.length) {
    mapErrorMessage.value = '지도에 표시할 좌표가 없습니다.'
    return
  }

  try {
    await loadGoogleMaps()

    const center = {
      lat: Number(places[0].latitude),
      lng: Number(places[0].longitude),
    }

    map = new window.google.maps.Map(modalMapRoot.value, {
      center,
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

    const path = places.map((place) => ({
      lat: Number(place.latitude),
      lng: Number(place.longitude),
    }))
    const bounds = new window.google.maps.LatLngBounds()

    mapMarkers = places.map((place, index) => {
      const position = path[index]

      bounds.extend(position)

      return new window.google.maps.Marker({
        position,
        map,
        title: place.displayName,
        icon: createCoursePin(place.order ?? index + 1),
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

watch(selectedCourse, (course) => {
  if (course) {
    renderModalMap()
  }
})

onMounted(() => {
  document.body.classList.add('ai-scroll-lock')
  showAssistantMessage('여행을 계획중인 도시를 선택해주세요.', 'city', 'city', 760)
})

onBeforeUnmount(() => {
  isAlive = false
  document.body.classList.remove('ai-scroll-lock')
  clearModalMap()
})
</script>

<template>
  <main class="ai-view">
    <section ref="conversation" class="conversation">
      <header class="guide-heading">
        <span class="guide-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="m12 5 .75 2.25L15 8l-2.25.75L12 11l-.75-2.25L9 8l2.25-.75L12 5Z" />
            <path d="m17.5 11 .5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5Z" />
            <path d="m8 13 .6 1.9 1.9.6-1.9.6L8 18l-.6-1.9-1.9-.6 1.9-.6L8 13Z" />
          </svg>
        </span>
        <h1>Lumina AI Guide</h1>
      </header>

      <ol class="message-list">
        <li
          v-for="message in messages"
          :key="message.id"
          class="message-row"
          :class="`message-row--${message.role}`"
        >
          <article class="message">
            <p>{{ message.content }}</p>

            <div v-if="message.control === 'city' && step === 'city'" class="city-options">
              <button v-for="city in CITIES" :key="city" type="button" @click="selectCity(city)">
                {{ city }}
              </button>
            </div>

            <section v-if="message.control === 'date' && step === 'date'" class="calendar-panel">
              <header class="calendar-header">
                <button type="button" aria-label="이전 달" @click="moveCalendar(-1)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <strong>{{ calendarTitle }}</strong>
                <button type="button" aria-label="다음 달" @click="moveCalendar(1)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </header>

              <div class="calendar-weekdays">
                <span v-for="weekday in WEEKDAY_LABELS" :key="weekday">{{ weekday }}</span>
              </div>

              <div class="calendar-grid">
                <template v-for="(day, index) in calendarDays" :key="day?.value ?? `empty-${index}`">
                  <span v-if="!day"></span>
                  <button
                    v-else
                    type="button"
                    :class="{ today: day.isToday, selected: day.value === selectedDate }"
                    @click="selectDate(day.value)"
                  >
                    {{ day.date }}
                  </button>
                </template>
              </div>
            </section>

            <div v-if="message.control === 'loading'" class="thinking-panel">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div v-if="message.control === 'recommendations'" class="recommendation-list">
              <button
                v-for="course in message.recommendations"
                :key="course.rank"
                type="button"
                @click="openCourse(course)"
              >
                <strong>{{ course.rank }}번째 경로</strong>
                <span>{{ getCourseSummary(course) }}</span>
              </button>
            </div>

            <div v-if="message.control === 'afterSave'" class="after-save-actions">
              <button type="button" @click="goToSavedCourses">저장 경로 확인</button>
              <button type="button" disabled>다시 추천</button>
            </div>
          </article>
          <time>{{ message.sentAt }}</time>
        </li>

        <li v-if="isBotThinking" class="message-row message-row--assistant typing-row">
          <article class="message typing-message" aria-label="AI가 답변을 준비중입니다">
            <span></span>
            <span></span>
            <span></span>
          </article>
        </li>
      </ol>
    </section>

    <form v-if="step === 'content'" class="prompt-form" @submit.prevent="submitPrompt">
      <label class="prompt-label" for="ai-prompt">계획중인 여행 내용</label>
      <textarea
        id="ai-prompt"
        v-model="prompt"
        rows="1"
        placeholder="예: 9시에 바닷가 야경을 보고 11시에 해산물을 먹고 싶어요"
        @keydown.enter.exact.prevent="submitPrompt"
      ></textarea>

      <button
        class="send-button"
        type="submit"
        :disabled="!canSubmitPrompt"
        aria-label="메시지 보내기"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 18V6m0 0-5 5m5-5 5 5" />
        </svg>
      </button>
    </form>

    <div v-else-if="isRecommending" class="analysis-bar">
      <span class="analysis-spinner" aria-hidden="true"></span>
      <span>AI가 추천 경로를 분석중입니다</span>
    </div>

    <Teleport to="body">
      <div v-if="selectedCourse" class="course-modal-backdrop" @click.self="closeCourse">
        <article class="course-modal">
          <header class="modal-header">
            <div>
              <span>추천 경로 {{ selectedCourse.rank }}</span>
              <h2>{{ getCourseSummary(selectedCourse) }}</h2>
            </div>
            <button type="button" aria-label="닫기" @click="closeCourse">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <section class="modal-map-section">
            <div ref="modalMapRoot" class="modal-map"></div>
            <p v-if="mapErrorMessage" class="map-error">{{ mapErrorMessage }}</p>
          </section>

          <dl class="course-stats">
            <div>
              <dt>총 거리</dt>
              <dd>{{ formatDistance(selectedCourse.totalDistanceKm) }}</dd>
            </div>
            <div>
              <dt>이동 시간</dt>
              <dd>{{ formatMinutes(selectedCourse.estimatedMoveMinutes) }}</dd>
            </div>
            <div>
              <dt>추천 점수</dt>
              <dd>{{ selectedCourse.totalScore?.toFixed?.(1) ?? '-' }}</dd>
            </div>
          </dl>

          <ol class="course-place-list">
            <li v-for="place in selectedCourse.places" :key="`${selectedCourse.rank}-${place.placeId}`">
              <button type="button" @click="openPlaceDetail(place)">
                <span>{{ place.order }}</span>
                <div>
                  <strong>{{ place.displayName }}</strong>
                  <p>{{ place.displayCategory }}</p>
                  <ul v-if="place.tags?.length">
                    <li v-for="tag in place.tags.slice(0, 4)" :key="tag">{{ normalizeCategory(tag) }}</li>
                  </ul>
                </div>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </li>
          </ol>

          <footer class="course-modal-footer">
            <button
              class="save-course-button"
              type="button"
              :disabled="isSavingCourse"
              @click="saveSelectedCourse"
            >
              {{ isSavingCourse ? '저장 중입니다' : '이 경로 추가하기' }}
            </button>
          </footer>
        </article>

        <div v-if="selectedPlace" class="place-detail-dim" @click="closePlaceDetail"></div>

        <article v-if="selectedPlace" class="place-detail-modal">
          <header class="place-detail-header">
            <div>
              <span>장소 상세정보</span>
              <h3>{{ selectedPlace.displayName }}</h3>
            </div>
            <button type="button" aria-label="장소 상세 닫기" @click="closePlaceDetail">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <p v-if="isPlaceDetailLoading" class="place-detail-state">
            장소 상세 정보를 불러오는 중입니다.
          </p>
          <p v-else-if="placeDetailErrorMessage" class="place-detail-state">
            {{ placeDetailErrorMessage }}
          </p>

          <template v-else-if="selectedPlaceDetail">
            <figure class="place-detail-image">
              <img
                v-if="selectedPlaceDetail.image"
                :src="selectedPlaceDetail.image"
                :alt="selectedPlaceDetail.title"
              />
            </figure>

            <div class="place-detail-body">
              <ul class="place-detail-categories">
                <li v-for="category in selectedPlaceDetail.categories" :key="category">
                  #{{ category }}
                </li>
              </ul>

              <div class="place-detail-title-row">
                <h4>{{ selectedPlaceDetail.title }}</h4>
                <span aria-label="좋아요 수">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M20.8 4.6c-1.9-1.8-4.9-1.7-6.7.2L12 7l-2.1-2.2C8.1 2.9 5.1 2.8 3.2 4.6 1.1 6.6 1 9.9 3 12l9 8.7 9-8.7c2-2.1 1.9-5.4-.2-7.4Z"
                    />
                  </svg>
                  {{ selectedPlaceDetail.likeCount }}
                </span>
              </div>

              <section class="place-detail-description">
                <h5>소개</h5>
                <p>{{ selectedPlaceDetail.description }}</p>
              </section>

              <address class="place-detail-info">
                <div>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
                    <circle cx="12" cy="10" r="2" />
                  </svg>
                  <span>
                    <strong>주소</strong>
                    {{ selectedPlaceDetail.address }}
                    <small v-if="selectedPlaceDetail.addressDetail">{{
                      selectedPlaceDetail.addressDetail
                    }}</small>
                  </span>
                </div>
                <div>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M6.6 3h3l1.5 4-2 1.2a15 15 0 0 0 6.7 6.7l1.2-2 4 1.5v3c0 .9-.7 1.6-1.6 1.6C11.4 19 5 12.6 5 4.6 5 3.7 5.7 3 6.6 3Z"
                    />
                  </svg>
                  <span>
                    <strong>전화번호</strong>
                    {{ selectedPlaceDetail.phone }}
                  </span>
                </div>
                <div>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  <span>
                    <strong>영업시간</strong>
                    {{ selectedPlaceDetail.hours }}
                  </span>
                </div>
              </address>
            </div>
          </template>
        </article>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
.ai-view {
  position: fixed;
  inset: 3rem 0 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  color: #f7f9fc;
  background: transparent;
}

.conversation {
  flex: 1;
  width: min(100%, 48rem);
  margin: 0 auto;
  padding: 1.25rem 1rem 7.8rem;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scrollbar-width: thin;
  scrollbar-color: #314258 transparent;
  -webkit-overflow-scrolling: touch;
}

.guide-heading {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.guide-heading h1 {
  color: #d8e2ee;
  font-size: 0.82rem;
  font-weight: 600;
}

.guide-mark {
  display: grid;
  flex: 0 0 auto;
  width: 1.8rem;
  height: 1.8rem;
  place-items: center;
  color: #07111d;
  background: #48cfff;
  border-radius: 50%;
  box-shadow: 0 0 1.1rem rgba(72, 207, 255, 0.22);
}

.guide-mark svg {
  width: 1rem;
  fill: currentColor;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.message-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: min(92%, 36rem);
  animation: messageIn 0.36s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.message-row--user {
  align-self: flex-end;
  align-items: flex-end;
}

.message {
  width: 100%;
  padding: 0.95rem 1rem;
  background: #172233;
  border: 1px solid #314258;
  border-radius: 0.4rem 1rem 1rem;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.12);
  transform-origin: left bottom;
}

.message-row--user .message {
  width: auto;
  max-width: 100%;
  color: #07111d;
  background: #72d3ff;
  border-color: #72d3ff;
  border-radius: 1rem 0.4rem 1rem 1rem;
  transform-origin: right bottom;
}

.message p {
  overflow-wrap: anywhere;
  font-size: 0.88rem;
  line-height: 1.58;
  white-space: pre-wrap;
}

.message-row time {
  margin: 0.4rem 0.25rem 0;
  color: #657286;
  font-size: 0.62rem;
}

.city-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 0.9rem;
  animation: controlIn 0.32s ease-out 0.08s both;
}

.city-options button,
.recommendation-list button,
.after-save-actions button {
  color: #dff8f2;
  background: rgba(127, 199, 178, 0.1);
  border: 1px solid rgba(127, 199, 178, 0.22);
  border-radius: 0.65rem;
  font-weight: 800;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.city-options button {
  min-height: 2.45rem;
  font-size: 0.82rem;
}

.city-options button:hover,
.recommendation-list button:hover,
.after-save-actions button:hover:not(:disabled) {
  background: rgba(127, 199, 178, 0.18);
  border-color: rgba(140, 221, 255, 0.36);
  box-shadow: 0 0.6rem 1.2rem rgba(0, 0, 0, 0.16);
  transform: translateY(-0.08rem);
}

.calendar-panel {
  margin-top: 0.9rem;
  padding: 0.8rem;
  background: rgba(7, 19, 33, 0.54);
  border: 1px solid rgba(126, 143, 165, 0.16);
  border-radius: 0.85rem;
  animation: controlIn 0.34s ease-out 0.08s both;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.calendar-header strong {
  color: #eef4fb;
  font-size: 0.9rem;
  font-weight: 800;
}

.calendar-header button {
  display: grid;
  width: 2rem;
  height: 2rem;
  color: #dbe4ee;
  background: rgba(255, 255, 255, 0.065);
  border-radius: 50%;
  place-items: center;
}

.calendar-header svg {
  width: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.calendar-weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.35rem;
}

.calendar-weekdays {
  margin-top: 0.8rem;
  color: #7f8da0;
  font-size: 0.66rem;
  font-weight: 700;
  text-align: center;
}

.calendar-grid {
  margin-top: 0.45rem;
}

.calendar-grid button,
.calendar-grid span {
  display: grid;
  min-height: 2.2rem;
  place-items: center;
  border-radius: 0.55rem;
  font-size: 0.76rem;
}

.calendar-grid button {
  color: #dbe7f2;
  background: rgba(255, 255, 255, 0.055);
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;
}

.calendar-grid button.today {
  color: #8cddff;
  border: 1px solid rgba(140, 221, 255, 0.4);
}

.calendar-grid button.selected,
.calendar-grid button:hover {
  color: #071321;
  background: #8cddff;
  transform: translateY(-0.05rem);
}

.thinking-panel {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.85rem;
}

.typing-row {
  max-width: 7rem;
}

.typing-message {
  display: flex;
  gap: 0.35rem;
  width: auto;
  padding: 0.8rem 0.9rem;
  border-radius: 0.8rem 1rem 1rem;
}

.thinking-panel span,
.typing-message span,
.analysis-spinner {
  display: block;
  width: 0.48rem;
  height: 0.48rem;
  background: #8cddff;
  border-radius: 50%;
}

.thinking-panel span,
.typing-message span {
  animation: thinking 0.9s ease-in-out infinite;
}

.thinking-panel span:nth-child(2),
.typing-message span:nth-child(2) {
  animation-delay: 0.14s;
}

.thinking-panel span:nth-child(3),
.typing-message span:nth-child(3) {
  animation-delay: 0.28s;
}

.recommendation-list {
  display: grid;
  gap: 0.55rem;
  margin-top: 0.9rem;
  animation: controlIn 0.32s ease-out 0.1s both;
}

.recommendation-list button {
  display: grid;
  gap: 0.35rem;
  min-height: 4rem;
  padding: 0.8rem;
  text-align: left;
}

.recommendation-list strong {
  color: #eef4fb;
  font-size: 0.82rem;
}

.recommendation-list span {
  color: #aeb8c7;
  font-size: 0.74rem;
  line-height: 1.4;
}

.after-save-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
  margin-top: 0.9rem;
  animation: controlIn 0.32s ease-out 0.08s both;
}

.after-save-actions button {
  min-height: 2.55rem;
  padding: 0 0.75rem;
  font-size: 0.78rem;
}

.after-save-actions button:first-child {
  color: #071321;
  background: #8cddff;
  border-color: rgba(140, 221, 255, 0.9);
  box-shadow: 0 0.5rem 1.2rem rgba(72, 207, 255, 0.2);
}

.after-save-actions button:first-child:hover {
  background: #a8e7ff;
}

.after-save-actions button:disabled {
  cursor: default;
  color: #7e8b9d;
  background: rgba(255, 255, 255, 0.045);
  border-color: rgba(255, 255, 255, 0.07);
  opacity: 0.75;
}

.prompt-form,
.analysis-bar {
  position: fixed;
  right: 0;
  bottom: 1rem;
  left: 0;
  width: calc(100% - 2rem);
  max-width: 46rem;
  margin: 0 auto;
  background: rgba(23, 34, 51, 0.92);
  border: 1px solid #314258;
  box-shadow:
    0 0 1.5rem rgba(72, 207, 255, 0.14),
    0 0.75rem 2rem rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(1rem);
}

.prompt-form {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-height: 3.25rem;
  padding: 0.45rem 0.55rem 0.45rem 0.9rem;
  border-radius: 1.8rem;
  animation: inputIn 0.34s ease-out both;
}

.prompt-label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.prompt-form textarea {
  flex: 1;
  min-width: 0;
  max-height: 6rem;
  padding: 0.55rem 0;
  color: #f7f9fc;
  line-height: 1.35;
}

.prompt-form textarea::placeholder {
  color: #657286;
  font-size: 0.78rem;
}

.send-button {
  display: grid;
  flex: 0 0 auto;
  width: 2.35rem;
  height: 2.35rem;
  color: #07111d;
  background: #72d3ff;
  border-radius: 50%;
  place-items: center;
}

.send-button:disabled {
  cursor: default;
  opacity: 0.48;
}

.send-button svg {
  width: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.analysis-bar {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-height: 3.25rem;
  padding: 0 1rem;
  color: #dbe8f2;
  border-radius: 1rem;
  font-size: 0.82rem;
  font-weight: 700;
  animation: inputIn 0.34s ease-out both;
}

.analysis-spinner {
  flex: 0 0 auto;
  animation: pulse 0.9s ease-in-out infinite;
}

.course-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 11000;
  display: grid;
  padding: 1rem;
  background: rgba(3, 9, 15, 0.68);
  place-items: center;
  backdrop-filter: blur(0.45rem);
}

.course-modal {
  width: min(100%, 42rem);
  max-height: min(90vh, 46rem);
  overflow-y: auto;
  color: #f7f9fc;
  background:
    linear-gradient(180deg, rgba(127, 199, 178, 0.1), transparent 12rem),
    #121d29;
  border: 1px solid rgba(199, 214, 229, 0.18);
  border-radius: 1.1rem;
  box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.42);
  animation: modalIn 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1rem 0.85rem;
}

.modal-header span {
  color: #cdebe4;
  font-size: 0.7rem;
  font-weight: 800;
}

.modal-header h2 {
  margin-top: 0.45rem;
  color: #f4f8fc;
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.35;
}

.modal-header button {
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

.modal-header svg {
  width: 0.9rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.8;
}

.modal-map-section {
  position: relative;
  margin: 0 1rem;
  overflow: hidden;
  background: #071321;
  border: 1px solid rgba(126, 143, 165, 0.2);
  border-radius: 0.85rem;
}

.modal-map {
  width: 100%;
  height: 15rem;
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

.course-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
  padding: 0.85rem 1rem 0;
}

.course-stats div {
  padding: 0.7rem;
  background: rgba(255, 255, 255, 0.055);
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 0.7rem;
}

.course-stats dt {
  color: #8c9aab;
  font-size: 0.64rem;
}

.course-stats dd {
  margin-top: 0.35rem;
  color: #eef4fb;
  font-size: 0.8rem;
  font-weight: 800;
}

.course-place-list {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
}

.course-place-list li {
  display: block;
}

.course-place-list button {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) 1rem;
  gap: 0.75rem;
  width: 100%;
  padding: 0.65rem;
  color: inherit;
  text-align: left;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.055);
  border-radius: 0.75rem;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.course-place-list button:hover {
  background: rgba(140, 221, 255, 0.08);
  border-color: rgba(140, 221, 255, 0.28);
  transform: translateY(-0.06rem);
}

.course-place-list button > span {
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

.course-place-list button > svg {
  align-self: center;
  width: 1rem;
  fill: none;
  stroke: #8cddff;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.course-place-list strong {
  color: #eef4fb;
  font-size: 0.9rem;
  font-weight: 800;
}

.course-place-list p {
  margin-top: 0.25rem;
  color: #8fa0b5;
  font-size: 0.68rem;
}

.course-place-list ul {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.course-place-list ul li {
  display: block;
  padding: 0.22rem 0.45rem;
  color: #cdebe4;
  background: rgba(127, 199, 178, 0.12);
  border-radius: 999px;
  font-size: 0.6rem;
}

.course-modal-footer {
  position: sticky;
  bottom: 0;
  padding: 0.85rem 1rem 1rem;
  background: linear-gradient(180deg, rgba(18, 29, 41, 0), #121d29 28%);
}

.save-course-button {
  width: 100%;
  min-height: 2.9rem;
  color: #071321;
  background: #8cddff;
  border: 1px solid rgba(140, 221, 255, 0.85);
  border-radius: 999px;
  box-shadow: 0 0.75rem 1.6rem rgba(72, 207, 255, 0.22);
  font-size: 0.88rem;
  font-weight: 900;
  transition:
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.save-course-button:hover {
  background: #a8e7ff;
  box-shadow: 0 0.9rem 1.9rem rgba(72, 207, 255, 0.3);
}

.save-course-button:active {
  transform: scale(0.985);
}

.save-course-button:disabled {
  cursor: wait;
  opacity: 0.62;
  transform: none;
}

.place-detail-dim {
  position: fixed;
  inset: 0;
  z-index: 11050;
  background: rgba(3, 8, 14, 0.58);
  backdrop-filter: blur(0.5rem);
  animation: dimIn 0.2s ease-out both;
}

.place-detail-modal {
  position: fixed;
  z-index: 11100;
  width: min(calc(100% - 2rem), 34rem);
  max-height: min(82vh, 42rem);
  overflow-y: auto;
  color: #f7f9fc;
  background: #0f1a27;
  border: 1px solid rgba(199, 214, 229, 0.2);
  border-radius: 1rem;
  box-shadow: 0 1.4rem 4rem rgba(0, 0, 0, 0.48);
  animation: modalIn 0.24s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.place-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
}

.place-detail-header span {
  color: #8cddff;
  font-size: 0.68rem;
  font-weight: 800;
}

.place-detail-header h3 {
  margin-top: 0.35rem;
  color: #f4f8fc;
  font-size: 1.05rem;
  font-weight: 850;
}

.place-detail-header button {
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

.place-detail-header svg {
  width: 0.9rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.8;
}

.place-detail-state {
  padding: 2.4rem 1rem 2.8rem;
  color: #91a0b4;
  font-size: 0.82rem;
  text-align: center;
}

.place-detail-image {
  width: calc(100% - 2rem);
  aspect-ratio: 16 / 8;
  margin: 0 auto;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(70, 103, 130, 0.2), rgba(12, 22, 35, 0.06)), #071321;
  border-radius: 0.8rem;
}

.place-detail-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.place-detail-body {
  padding: 1rem;
}

.place-detail-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.place-detail-categories li {
  padding: 0.3rem 0.55rem;
  color: #d9f6ff;
  background: rgba(72, 207, 255, 0.1);
  border-radius: 999px;
  font-size: 0.68rem;
}

.place-detail-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.85rem;
}

.place-detail-title-row h4 {
  min-width: 0;
  color: #f4f8fc;
  font-size: 1.16rem;
  font-weight: 850;
}

.place-detail-title-row span {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.3rem;
  color: #e8f8ff;
  font-size: 0.84rem;
  font-weight: 800;
}

.place-detail-title-row svg {
  width: 0.95rem;
  fill: #ff6f9f;
}

.place-detail-description {
  margin-top: 0.9rem;
}

.place-detail-description h5,
.place-detail-info strong {
  display: block;
  margin-bottom: 0.45rem;
  color: #72d3ff;
  font-size: 0.72rem;
  font-weight: 700;
}

.place-detail-description p {
  color: #c4ced9;
  font-size: 0.82rem;
  line-height: 1.62;
}

.place-detail-info {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #314258;
  font-style: normal;
}

.place-detail-info div {
  display: flex;
  gap: 0.65rem;
  color: #d1dae4;
  font-size: 0.78rem;
  line-height: 1.45;
}

.place-detail-info svg {
  flex: 0 0 auto;
  width: 1rem;
  fill: none;
  stroke: #72d3ff;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.place-detail-info small {
  display: block;
  margin-top: 0.2rem;
  color: #7e8b9d;
  font-size: 0.66rem;
}

@keyframes thinking {
  0%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  50% {
    opacity: 1;
    transform: translateY(-0.22rem);
  }
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(0.6rem) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes controlIn {
  from {
    opacity: 0;
    transform: translateY(0.45rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes inputIn {
  from {
    opacity: 0;
    transform: translateY(0.7rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: translateY(0.7rem) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dimIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(0.84);
  }

  50% {
    opacity: 1;
    transform: scale(1.12);
  }
}

@media (min-width: 600px) {
  .conversation {
    padding-right: 1.5rem;
    padding-left: 1.5rem;
  }

  .message-row {
    max-width: min(78%, 36rem);
  }

  .city-options {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (min-width: 900px) {
  .ai-view {
    position: absolute;
    inset: 3rem 0 0;
    z-index: 20;
  }

  .conversation {
    width: 100%;
    max-width: none;
    padding-right: 1.25rem;
    padding-left: 1.25rem;
  }

  .message-row {
    max-width: min(86%, 28rem);
  }

  .city-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .prompt-form,
  .analysis-bar {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    left: 1rem;
    width: auto;
    max-width: none;
  }

  .course-modal-backdrop,
  .place-detail-dim {
    top: 2rem;
    right: auto;
    bottom: 2rem;
    left: calc(50% + 12.5rem + clamp(1.5rem, 3.5vw, 3rem) - 16rem);
    width: 32rem;
    border-radius: 2rem;
  }

  .course-modal-backdrop {
    overflow: hidden;
  }

  .course-modal {
    width: min(100%, 30rem);
    max-height: calc(100vh - 6rem);
  }

  .place-detail-modal {
    top: 50%;
    left: calc(50% + 12.5rem + clamp(1.5rem, 3.5vw, 3rem) - 15rem);
    width: 30rem;
    max-height: calc(100vh - 7rem);
    animation: none;
    transform: translateY(-50%);
  }
}
</style>
