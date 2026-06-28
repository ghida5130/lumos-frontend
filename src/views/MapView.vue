<script setup>
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import clusterIconUrl from "@/assets/images/commonIcon/cluster.png";
import fPinIconUrl from "@/assets/images/commonIcon/fPin2.png";
import gPinIconUrl from "@/assets/images/commonIcon/gPin2.png";
import sPinIconUrl from "@/assets/images/commonIcon/sPin2.png";

const GOOGLE_MAPS_API_KEY = "AIzaSyBtICOXs5sJoQEIdpUcGOoLDdp_yqDk_4E";
const GOOGLE_MAPS_SCRIPT_ID = "google-maps-js-api";
const MAP_PLACES_STORAGE_KEY = "lumos:map-places";
const CATEGORY_PIN_ICONS = {
  숙소: sPinIconUrl,
  ACCOMMODATION: sPinIconUrl,
  관광지: gPinIconUrl,
  TOURIST_SPOT: gPinIconUrl,
  식당: fPinIconUrl,
  맛집: fPinIconUrl,
  RESTAURANT: fPinIconUrl,
};

const props = defineProps({
  places: {
    type: Array,
    default: () => [],
  },
});

const router = useRouter();
const mapRoot = ref(null);
const selectedPlace = ref(null);
const selectedClusterPlaces = ref([]);
const sheetMode = ref("compact");
const sheetDragOffset = ref(0);
const isMapReady = ref(false);
const errorMessage = ref("");
const storedPlaces = ref(readStoredPlaces());

let map = null;
let markers = [];
let markerClusterer = null;
let sheetStartY = 0;
let sheetDidDrag = false;

const placesForMap = computed(() => (props.places.length ? props.places : storedPlaces.value));
const isSheetExpanded = computed(() => sheetMode.value === "expanded");

const validPlaces = computed(() =>
  placesForMap.value
    .map((place) => ({
      ...place,
      latitude: Number(place.latitude ?? place.lat),
      longitude: Number(place.longitude ?? place.lng),
    }))
    .filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude)),
);

function readStoredPlaces() {
  try {
    const storedValue = sessionStorage.getItem(MAP_PLACES_STORAGE_KEY);
    const parsedValue = JSON.parse(storedValue ?? "[]");

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

const defaultCenter = computed(() => {
  if (!validPlaces.value.length) {
    return { lat: 37.5665, lng: 126.978 };
  }

  return {
    lat: validPlaces.value[0].latitude,
    lng: validPlaces.value[0].longitude,
  };
});

function loadGoogleMaps() {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error("Google Maps API 키를 입력해주세요."));
  }

  const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(window.google.maps), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: GOOGLE_MAPS_API_KEY,
      v: "weekly",
      language: "ko",
      region: "KR",
    });

    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(window.google.maps), { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });
}

function getPinIconUrl(category) {
  return CATEGORY_PIN_ICONS[category] ?? gPinIconUrl;
}

function createPinIcon(place, isSelected = false) {
  const width = isSelected ? 41 : 33;
  const height = isSelected ? 50 : 40;

  return {
    url: getPinIconUrl(place?.category),
    scaledSize: new window.google.maps.Size(width, height),
    anchor: new window.google.maps.Point(width / 2, height),
  };
}

function updateMarkerStyles() {
  markers.forEach(({ marker, place }) => {
    const isSelected = selectedPlace.value?.id === place.id;

    marker.setIcon(createPinIcon(place, isSelected));
    marker.setZIndex(isSelected ? 20 : 10);
  });
}

function selectPlace(place) {
  selectedPlace.value = place;
  selectedClusterPlaces.value = [];
  sheetMode.value = "compact";
  sheetDragOffset.value = 0;
  updateMarkerStyles();

  map.panTo({
    lat: place.latitude,
    lng: place.longitude,
  });
}

function clearSelectedPlace() {
  selectedPlace.value = null;
  selectedClusterPlaces.value = [];
  sheetMode.value = "compact";
  sheetDragOffset.value = 0;
  updateMarkerStyles();
}

function expandSheet() {
  sheetMode.value = "expanded";
  sheetDragOffset.value = 0;
}

function collapseSheet() {
  sheetMode.value = "compact";
  sheetDragOffset.value = 0;
}

function toggleSheet() {
  if (sheetDidDrag) {
    sheetDidDrag = false;
    return;
  }

  if (isSheetExpanded.value) {
    collapseSheet();
  } else {
    expandSheet();
  }
}

function goToDetail(place) {
  if (!place?.id) return;

  router.push({
    name: "detail",
    query: { id: place.id },
  });
}

function stopSheetDrag() {
  window.removeEventListener("pointermove", handleSheetPointerMove);
  window.removeEventListener("pointerup", handleSheetPointerUp);
  window.removeEventListener("pointercancel", handleSheetPointerUp);
}

function handleSheetPointerDown(event) {
  if (event.button !== undefined && event.button !== 0) return;

  sheetStartY = event.clientY;
  sheetDidDrag = false;
  sheetDragOffset.value = 0;
  window.addEventListener("pointermove", handleSheetPointerMove);
  window.addEventListener("pointerup", handleSheetPointerUp);
  window.addEventListener("pointercancel", handleSheetPointerUp);
}

function handleSheetPointerMove(event) {
  const deltaY = event.clientY - sheetStartY;
  const minOffset = isSheetExpanded.value ? -24 : -110;
  const maxOffset = isSheetExpanded.value ? 190 : 90;

  if (Math.abs(deltaY) > 6) {
    sheetDidDrag = true;
  }

  sheetDragOffset.value = Math.min(Math.max(deltaY, minOffset), maxOffset);
}

function handleSheetPointerUp() {
  const offset = sheetDragOffset.value;

  if (!isSheetExpanded.value && offset < -48) {
    expandSheet();
  } else if (isSheetExpanded.value && offset > 78) {
    collapseSheet();
  } else if (!isSheetExpanded.value && offset > 72) {
    clearSelectedPlace();
  } else {
    sheetDragOffset.value = 0;
  }

  stopSheetDrag();
}

function createClusterIcon(count) {
  const size = count >= 100 ? 46 : count >= 10 ? 42 : 35;

  return {
    url: clusterIconUrl,
    scaledSize: new window.google.maps.Size(size, size),
    anchor: new window.google.maps.Point(size / 2, size / 2),
    labelOrigin: new window.google.maps.Point(size / 2, size / 2),
  };
}

function createClusterLabel(count) {
  return {
    text: count > 99 ? "99+" : String(count),
    color: "#f7fbff",
    className: "map-cluster-label",
    fontFamily: "SUIT, Arial, sans-serif",
    fontSize: count >= 100 ? "11px" : count >= 10 ? "12px" : "13px",
    fontWeight: "900",
  };
}

function showClusterPlaces(cluster, clusterMap) {
  const clusterMarkers = cluster.markers ?? [];

  selectedPlace.value = null;
  selectedClusterPlaces.value = clusterMarkers.map((marker) => marker.__place).filter(Boolean);
  sheetMode.value = "compact";
  sheetDragOffset.value = 0;
  updateMarkerStyles();

  if (cluster.position) {
    clusterMap.panTo(cluster.position);
  }
}

function fitBounds() {
  if (!validPlaces.value.length || !map) return;

  const bounds = new window.google.maps.LatLngBounds();

  validPlaces.value.forEach((place) => {
    bounds.extend({
      lat: place.latitude,
      lng: place.longitude,
    });
  });

  map.fitBounds(bounds, 64);

  if (validPlaces.value.length === 1) {
    map.setZoom(14);
  }
}

function renderMarkers() {
  if (markerClusterer) {
    markerClusterer.clearMarkers();
    markerClusterer = null;
  }

  markers.forEach(({ marker }) => marker.setMap(null));
  markers = [];

  validPlaces.value.forEach((place) => {
    const marker = new window.google.maps.Marker({
      position: {
        lat: place.latitude,
        lng: place.longitude,
      },
      title: place.title,
      icon: createPinIcon(place, false),
      zIndex: 10,
    });

    marker.__place = place;
    marker.addListener("click", () => {
      selectPlace(place);
    });

    markers.push({ marker, place });
  });

  if (!markers.length) return;

  markerClusterer = new MarkerClusterer({
    map,
    markers: markers.map(({ marker }) => marker),
    renderer: {
      render({ count, position }) {
        const baseZIndex = window.google.maps.Marker.MAX_ZINDEX ?? 1000000;

        return new window.google.maps.Marker({
          position,
          icon: createClusterIcon(count),
          label: createClusterLabel(count),
          zIndex: baseZIndex + count,
        });
      },
    },
    onClusterClick: (_event, cluster, clusterMap) => {
      showClusterPlaces(cluster, clusterMap);
    },
  });
}

async function initializeMap() {
  try {
    await loadGoogleMaps();
    await nextTick();

    if (!mapRoot.value) return;

    map = new window.google.maps.Map(mapRoot.value, {
      center: defaultCenter.value,
      zoom: 12,
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
      gestureHandling: "greedy",
      backgroundColor: "#071321",
      styles: [
        { elementType: "geometry", stylers: [{ color: "#142235" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#d5e5f5" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#071321" }] },
        {
          featureType: "administrative",
          elementType: "geometry.stroke",
          stylers: [{ color: "#2f4055" }],
        },
        { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1d3044" }] },
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#26394e" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0d1828" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9fb0c4" }] },
        { featureType: "transit", elementType: "geometry", stylers: [{ color: "#223249" }] },
        { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#06111e" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#62768e" }] },
      ],
    });

    map.addListener("click", clearSelectedPlace);
    renderMarkers();
    fitBounds();
    isMapReady.value = true;
  } catch (error) {
    errorMessage.value = error.message || "지도를 불러오지 못했습니다.";
  }
}

watch(
  placesForMap,
  () => {
    if (!map) return;

    clearSelectedPlace();
    renderMarkers();
    fitBounds();
  },
  { deep: true },
);

onMounted(() => {
  initializeMap();
});

onBeforeUnmount(() => {
  stopSheetDrag();

  if (markerClusterer) {
    markerClusterer.clearMarkers();
    markerClusterer = null;
  }

  markers.forEach(({ marker }) => marker.setMap(null));
  markers = [];
});
</script>

<template>
  <main class="map-view">
    <div ref="mapRoot" class="map-canvas"></div>

    <section v-if="errorMessage" class="map-state">
      <h2>지도를 준비할 수 없습니다</h2>
      <p>{{ errorMessage }}</p>
      <small>Google Maps API 키는 `MapView.vue`의 `GOOGLE_MAPS_API_KEY`에 입력하면 됩니다.</small>
    </section>

    <section v-else-if="!validPlaces.length" class="map-state">
      <h2>표시할 장소가 없습니다</h2>
      <p>목록에서 장소를 불러온 뒤 다시 지도로 확인해주세요.</p>
    </section>

    <div v-if="isMapReady" class="map-count-badge">{{ validPlaces.length }}개 장소</div>

    <Transition name="bottom-sheet">
      <aside
        v-if="selectedPlace"
        class="bottom-sheet"
        :class="{ 'bottom-sheet--expanded': isSheetExpanded }"
        :style="{ '--sheet-drag': `${sheetDragOffset}px` }"
        @click.stop
      >
        <button
          class="sheet-handle"
          type="button"
          :aria-label="isSheetExpanded ? '장소 정보 접기' : '장소 정보 펼치기'"
          @click="toggleSheet"
          @pointerdown.prevent="handleSheetPointerDown"
        >
          <span></span>
        </button>

        <button
          class="sheet-close"
          type="button"
          aria-label="장소 정보 닫기"
          @click="clearSelectedPlace"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div class="sheet-summary">
          <div class="sheet-image">
            <img v-if="selectedPlace.image" :src="selectedPlace.image" :alt="selectedPlace.title" />
          </div>

          <div class="sheet-copy">
            <span v-if="selectedPlace.category" class="category-chip">
              {{ selectedPlace.category }}
            </span>
            <h2>{{ selectedPlace.title }}</h2>
            <p>{{ selectedPlace.description }}</p>
          </div>
        </div>

        <div class="sheet-actions">
          <button type="button" class="sheet-secondary-button" @click="expandSheet">더 보기</button>
          <button type="button" class="sheet-primary-button" @click="goToDetail(selectedPlace)">
            상세보기
          </button>
        </div>

        <section class="sheet-detail" aria-label="장소 상세 요약">
          <dl class="sheet-detail-grid">
            <div>
              <dt>분류</dt>
              <dd>{{ selectedPlace.category || "장소" }}</dd>
            </div>
            <div>
              <dt>좋아요</dt>
              <dd>{{ selectedPlace.likeCount ?? 0 }}개</dd>
            </div>
          </dl>

          <p v-if="selectedPlace.description" class="sheet-detail-description">
            {{ selectedPlace.description }}
          </p>

          <ul v-if="selectedPlace.tags?.length" class="tag-list" aria-label="장소 태그">
            <li v-for="tag in selectedPlace.tags.slice(0, 6)" :key="tag">{{ tag }}</li>
          </ul>
        </section>
      </aside>
    </Transition>

    <Transition name="bottom-sheet">
      <aside
        v-if="selectedClusterPlaces.length"
        class="bottom-sheet cluster-sheet"
        :class="{ 'bottom-sheet--expanded': isSheetExpanded }"
        :style="{ '--sheet-drag': `${sheetDragOffset}px` }"
        @click.stop
      >
        <button
          class="sheet-handle"
          type="button"
          :aria-label="isSheetExpanded ? '장소 목록 접기' : '장소 목록 펼치기'"
          @click="toggleSheet"
          @pointerdown.prevent="handleSheetPointerDown"
        >
          <span></span>
        </button>

        <button
          class="sheet-close"
          type="button"
          aria-label="장소 목록 닫기"
          @click="clearSelectedPlace"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div class="cluster-sheet-header">
          <span class="category-chip">{{ selectedClusterPlaces.length }}개 장소</span>
          <h2>이 주변 장소</h2>
          <p>장소를 선택하면 지도 위 핀이 강조되고 상세 정보를 볼 수 있습니다.</p>
        </div>

        <ul class="cluster-place-list" aria-label="클러스터 장소 목록">
          <li v-for="place in selectedClusterPlaces" :key="place.id">
            <button type="button" @click="selectPlace(place)">
              <span class="cluster-place-name">{{ place.title }}</span>
              <span class="cluster-place-meta">
                {{ place.category || "장소" }}
              </span>
            </button>
          </li>
        </ul>
      </aside>
    </Transition>
  </main>
</template>

<style scoped>
:global(.map-cluster-label) {
  text-shadow:
    0 1px 2px rgba(7, 19, 33, 0.92),
    0 0 4px rgba(7, 19, 33, 0.86);
  line-height: 1;
}

.map-view {
  position: fixed;
  inset: 3rem 0 0;
  z-index: 2;
  overflow: hidden;
  color: #f7f9fc;
  background: #071321;
}

.map-canvas {
  width: 100%;
  height: 100%;
}

.map-state {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(calc(100% - 2rem), 24rem);
  padding: 1.2rem;
  background: rgba(18, 29, 41, 0.92);
  border: 1px solid rgba(126, 143, 165, 0.22);
  border-radius: 0.8rem;
  box-shadow: 0 1rem 2.5rem rgba(0, 0, 0, 0.34);
  text-align: center;
  transform: translate(-50%, -50%);
}

.map-state h2 {
  color: #eef4fb;
  font-size: 1rem;
  font-weight: 800;
}

.map-state p {
  margin-top: 0.6rem;
  color: #aeb8c7;
  font-size: 0.82rem;
  line-height: 1.45;
}

.map-state small {
  display: block;
  margin-top: 0.8rem;
  color: #7f8da0;
  font-size: 0.68rem;
  line-height: 1.45;
}

.map-count-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.45rem 0.7rem;
  color: #eaf6ff;
  background: rgba(12, 25, 39, 0.82);
  border: 1px solid rgba(126, 143, 165, 0.24);
  border-radius: 999px;
  box-shadow: 0 0.75rem 1.6rem rgba(0, 0, 0, 0.24);
  font-size: 0.74rem;
  font-weight: 800;
  backdrop-filter: blur(0.7rem);
}

.bottom-sheet {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  max-height: min(72vh, 38rem);
  margin: 0 auto;
  padding: 0.65rem 1rem calc(1rem + env(safe-area-inset-bottom));
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(127, 199, 178, 0.09), transparent 8rem), rgba(17, 29, 42, 0.96);
  border: 1px solid rgba(126, 143, 165, 0.24);
  border-bottom: 0;
  border-radius: 1.25rem 1.25rem 0 0;
  box-shadow: 0 -1rem 3rem rgba(0, 0, 0, 0.46);
  transform: translateY(var(--sheet-drag, 0px));
  transition:
    max-height 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  backdrop-filter: blur(1rem);
  will-change: transform, max-height;
}

.bottom-sheet--expanded {
  max-height: min(82vh, 44rem);
}

.sheet-handle {
  display: grid;
  align-self: center;
  width: 5rem;
  height: 1.55rem;
  place-items: center;
  touch-action: none;
  cursor: grab;
}

.sheet-handle:active {
  cursor: grabbing;
}

.sheet-handle span {
  width: 2.7rem;
  height: 0.28rem;
  background: rgba(219, 228, 238, 0.36);
  border-radius: 999px;
}

.sheet-close {
  position: absolute;
  top: 0.8rem;
  right: 0.85rem;
  display: grid;
  width: 1.9rem;
  height: 1.9rem;
  color: #dbe4ee;
  background: rgba(255, 255, 255, 0.075);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  place-items: center;
}

.sheet-close svg {
  width: 0.85rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.8;
}

.sheet-summary {
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr);
  gap: 0.85rem;
  align-items: center;
  padding-right: 2.5rem;
}

.sheet-image {
  overflow: hidden;
  width: 5rem;
  aspect-ratio: 1;
  background: linear-gradient(135deg, rgba(127, 199, 178, 0.22), rgba(72, 115, 147, 0.12)), #101a26;
  border-radius: 0.75rem;
}

.sheet-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sheet-copy {
  min-width: 0;
}

.category-chip {
  display: inline-flex;
  align-items: center;
  min-height: 1.35rem;
  padding: 0 0.45rem;
  color: #cdebe4;
  background: rgba(127, 199, 178, 0.12);
  border: 1px solid rgba(127, 199, 178, 0.22);
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 800;
}

.sheet-copy h2 {
  margin-top: 0.45rem;
  overflow: hidden;
  color: #eef4fb;
  font-size: 1.05rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sheet-copy p {
  display: -webkit-box;
  margin-top: 0.35rem;
  overflow: hidden;
  color: #aeb8c7;
  font-size: 0.76rem;
  line-height: 1.38;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.sheet-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem;
  margin-top: 0.85rem;
}

.sheet-actions button {
  min-height: 2.55rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
}

.sheet-secondary-button {
  color: #dbe8f2;
  background: rgba(255, 255, 255, 0.075);
  border: 1px solid rgba(255, 255, 255, 0.09);
}

.sheet-primary-button {
  color: #071321;
  background: #8cddff;
  border: 1px solid rgba(140, 221, 255, 0.82);
  box-shadow: 0 0.45rem 1.1rem rgba(72, 207, 255, 0.22);
}

.sheet-detail {
  display: grid;
  gap: 0.8rem;
  max-height: 0;
  margin-top: 0;
  overflow: hidden;
  opacity: 0;
  transform: translateY(0.75rem);
  transition:
    max-height 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    margin-top 0.28s ease,
    opacity 0.2s ease,
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.bottom-sheet--expanded .sheet-detail {
  max-height: 20rem;
  margin-top: 1rem;
  overflow-y: auto;
  opacity: 1;
  transform: translateY(0);
}

.sheet-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.sheet-detail-grid div {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.055);
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 0.7rem;
}

.sheet-detail-grid dt {
  color: #8fa0b5;
  font-size: 0.65rem;
  font-weight: 700;
}

.sheet-detail-grid dd {
  margin-top: 0.3rem;
  overflow: hidden;
  color: #eef4fb;
  font-size: 0.83rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sheet-detail-description {
  color: #aeb8c7;
  font-size: 0.8rem;
  line-height: 1.55;
}

.tag-list {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.55rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.tag-list li {
  flex: 0 0 auto;
  padding: 0.22rem 0.45rem;
  color: #93a2b6;
  background: rgba(255, 255, 255, 0.055);
  border-radius: 999px;
  font-size: 0.6rem;
}

.cluster-sheet-header {
  padding-right: 2.5rem;
}

.cluster-sheet-header h2 {
  margin-top: 0.45rem;
  color: #eef4fb;
  font-size: 1rem;
  font-weight: 800;
}

.cluster-sheet-header p {
  margin-top: 0.25rem;
  color: #9daabc;
  font-size: 0.72rem;
  line-height: 1.4;
}

.cluster-place-list {
  display: grid;
  gap: 0.45rem;
  max-height: 12.5rem;
  margin-top: 0.8rem;
  padding-right: 0.2rem;
  overflow-y: auto;
}

.bottom-sheet--expanded .cluster-place-list {
  max-height: min(48vh, 24rem);
}

.cluster-place-list button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 3rem;
  padding: 0.65rem 0.75rem;
  color: #eaf1f8;
  background: rgba(255, 255, 255, 0.055);
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 0.7rem;
  text-align: left;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.cluster-place-list button:hover,
.cluster-place-list button:focus-visible {
  background: rgba(127, 199, 178, 0.11);
  border-color: rgba(127, 199, 178, 0.26);
  transform: translateY(-1px);
}

.cluster-place-name {
  overflow: hidden;
  font-size: 0.84rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cluster-place-meta {
  flex: 0 0 auto;
  margin-left: 0.75rem;
  color: #8fa0b5;
  font-size: 0.66rem;
  font-weight: 700;
}

.bottom-sheet-enter-active,
.bottom-sheet-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.bottom-sheet-enter-from,
.bottom-sheet-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

@media (min-width: 720px) {
  .bottom-sheet {
    right: 1rem;
    left: 1rem;
    max-width: 34rem;
    border: 1px solid rgba(126, 143, 165, 0.24);
    border-bottom: 0;
  }
}

@media (min-width: 900px) {
  .map-view {
    position: absolute;
    inset: 3rem 0 0;
  }
}
</style>
