import { http, HttpResponse } from "msw";
import { mockDelay } from "./mockDelay";

const favoritePlaceIds = new Set();

export const placeHandlers = [
  // --------------------------- 장소 목록 조회 (query string 제외 단순 목록 조회) ---------------------------
  http.get("*/api/place", async () => {
    await mockDelay();

    return HttpResponse.json(placeList);
  }),

  // --------------------------- 장소 상세 정보 조회 ---------------------------
  http.get("*/api/place/:placeId", async ({ params }) => {
    await mockDelay();

    return HttpResponse.json({
      ...placeDetail,
      path: `/api/place/${params.placeId}`,
      data: {
        ...placeDetail.data,
        placeId: Number(params.placeId),
      },
    });
  }),

  // --------------------------- 장소 즐겨찾기 추가 ---------------------------
  http.post("*/api/place/:placeId/favorite", async ({ params, request }) => {
    await mockDelay();

    const placeId = Number(params.placeId);
    const path = `/api/place/${params.placeId}/favorite`;
    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");
    const responseBase = {
      timestamp: "2026-03-18T06:51:01.242Z",
      path,
      data: null,
    };

    if (!isValidAccessToken) {
      return HttpResponse.json(
        {
          ...responseBase,
          statusCode: 401,
          message: "인증이 필요합니다.",
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    if (!Number.isInteger(placeId) || placeId <= 0) {
      return HttpResponse.json(
        {
          ...responseBase,
          statusCode: 400,
          message: "올바른 장소 ID가 필요합니다.",
          error: "INVALID_PLACE_ID",
        },
        { status: 400 },
      );
    }

    if (placeId === 999) {
      return HttpResponse.json(
        {
          ...responseBase,
          statusCode: 404,
          message: "존재하지 않는 장소입니다.",
          error: "PLACE_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (favoritePlaceIds.has(placeId)) {
      return HttpResponse.json(
        {
          ...responseBase,
          statusCode: 409,
          message: "이미 즐겨찾기에 추가된 장소입니다.",
          error: "PLACE_FAVORITE_ALREADY_EXISTS",
        },
        { status: 409 },
      );
    }

    favoritePlaceIds.add(placeId);

    return HttpResponse.json(
      {
        ...responseBase,
        statusCode: 201,
        message: "장소 즐겨찾기 추가가 완료되었습니다.",
        error: null,
      },
      { status: 201 },
    );
  }),

  // --------------------------- 장소 즐겨찾기 삭제 ---------------------------
  http.delete("*/api/place/:placeId/favorite", async ({ params, request }) => {
    await mockDelay();

    const path = `/api/place/${params.placeId}/favorite`;
    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");

    if (!isValidAccessToken) {
      return HttpResponse.json({
        statusCode: 401,
        timestamp: "2026-03-18T06:51:01.242Z",
        path,
        message: "인증이 필요합니다.",
        data: null,
        error: "UNAUTHORIZED",
      });
    }

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-03-18T06:51:01.242Z",
      path,
      message: "장소 즐겨찾기 삭제가 완료되었습니다.",
      data: {
        placeId: 1,
        isFavorite: false,
      },
      error: null,
    });
  }),
];

const placeList = {
  statusCode: 200,
  timestamp: "2026-06-11T02:38:12.414559Z",
  path: "/api/place",
  message: "장소 목록 조회가 완료되었습니다.",
  data: {
    content: [
      {
        placeId: 1067,
        name: "웨이브온 커피",
        category: "식당",
        imageUrl:
          "https://m.waveoncoffee.com/web/upload/share-image-1-2a22e9393098c51758e353f4fd7d0893.jpg",
        summary:
          "기장 바다 전망을 감상할 수 있는 대형 오션뷰 카페이다. 기장 해안 드라이브, 해동용궁사, 송정 일대 관광 코스와 함께 방문하기 좋다. 운영시간은 방문 전 확인하는 것이 권장된다.",
        latitude: 35.3217,
        longitude: 129.2687,
        likeCount: 0,
        tags: ["먹거리", "오션뷰", "카페", "해안"],
      },
      {
        placeId: 1066,
        name: "해동용궁사",
        category: "관광지",
        imageUrl:
          "https://mblogthumb-phinf.pstatic.net/MjAxNzA1MDlfNTAg/MDAxNDk0MzM1MjA4NzE2.UPNqm-_ArxLi0WvlMGvCl-KsG1wUUA4hKwIYvQ5n3h4g.m_-TUJAXCREPpGouuj4B_3Mg9HoIOCH2w6cTzA_aO3Yg.JPEG.imck81/CK8_3346.JPG?type=w800",
        summary:
          "바다와 맞닿은 절경으로 잘 알려진 기장의 대표 사찰이다. 새벽과 일출 시간대 방문에 특히 적합하며, 기장 해안 여행 코스와 함께 구성하기 좋다.",
        latitude: 35.1883,
        longitude: 129.2233,
        likeCount: 0,
        tags: ["사찰", "실외", "전망", "해안"],
      },
      {
        placeId: 1065,
        name: "도희네 조개구이",
        category: "식당",
        imageUrl:
          "https://media.triple.guide/triple-cms/c_limit,f_auto,h_1024,w_1024/5e803eec-e090-4607-993e-1c050c4661c0.jpeg",
        summary:
          "청사포 해안가에 위치한 조개구이 전문 식당이다. 청사포, 블루라인파크, 다릿돌전망대와 함께 야간 먹거리 코스로 방문하기 좋다. 매일 10:00부터 05:00까지 운영되는 것으로 안내된다.",
        latitude: 35.1603,
        longitude: 129.1938,
        likeCount: 0,
        tags: ["고기구이", "먹거리", "식사", "해산", "해안"],
      },
      {
        placeId: 1064,
        name: "전포카페거리",
        category: "관광지",
        imageUrl: null,
        summary:
          "개성 있는 카페, 편집숍, 식당이 모여 있는 부산 대표 카페거리이다. 서면과 가까워 저녁 식사 후 카페 코스로 방문하기 좋으며, 점포별 운영시간은 상이하다.",
        latitude: 35.1577,
        longitude: 129.0637,
        likeCount: 0,
        tags: ["먹거리", "문화공간", "식사", "실외", "카페"],
      },
      {
        placeId: 1063,
        name: "서면 젊음의거리",
        category: "관광지",
        imageUrl: null,
        summary:
          "부산의 대표 번화가 중 하나로, 식당, 주점, 카페, 쇼핑 시설이 밀집해 있는 상권이다. 야간 관광 후 식사와 이동 거점으로 활용하기 좋으며, 점포별 운영시간은 상이하다.",
        latitude: 35.1559,
        longitude: 129.0595,
        likeCount: 0,
        tags: ["먹거리", "술집", "식사", "실외", "카페"],
      },
      {
        placeId: 1062,
        name: "BIFF광장",
        category: "관광지",
        imageUrl: null,
        summary:
          "남포동을 대표하는 번화가이자 먹거리 거리이다. 씨앗호떡, 분식, 영화 관련 조형물 등으로 잘 알려져 있으며, 자갈치시장과 부평깡통야시장과 함께 야간 관광 코스로 방문하기 좋다.",
        latitude: 35.0985,
        longitude: 129.0292,
        likeCount: 0,
        tags: ["먹거리", "문화공간", "분식", "실외"],
      },
      {
        placeId: 1061,
        name: "송도구름산책로",
        category: "관광지",
        imageUrl: null,
        summary:
          "송도해수욕장 앞 바다 위로 이어진 해상 산책로이다. 해상케이블카와 송도해수욕장 야경을 함께 감상하기 좋으며, 운영시간은 현장 상황에 따라 변동될 수 있다.",
        latitude: 35.0764,
        longitude: 129.021,
        likeCount: 0,
        tags: ["산책", "실외", "야경", "오션뷰", "해안"],
      },
      {
        placeId: 1060,
        name: "송도해수욕장",
        category: "관광지",
        imageUrl: null,
        summary:
          "부산의 오래된 해수욕장 중 하나로, 송도 해안 관광의 중심지이다. 송도해상케이블카, 송도구름산책로, 송도용궁구름다리와 함께 야간 해안 코스로 방문하기 좋으며, 해변은 상시 이용 가능하다.",
        latitude: 35.0769,
        longitude: 129.0187,
        likeCount: 0,
        tags: ["산책", "실외", "해수욕장", "해안"],
      },
      {
        placeId: 1059,
        name: "동백섬",
        category: "관광지",
        imageUrl: null,
        summary:
          "해운대해수욕장과 더베이101 사이에 위치한 해안 산책 명소이다. 야간에는 마린시티와 광안대교의 야경을 감상하며 산책할 수 있으며, 상시 개방된다.",
        latitude: 35.1539,
        longitude: 129.1516,
        likeCount: 0,
        tags: ["산책", "실외", "야경", "오션뷰", "해안"],
      },
      {
        placeId: 1058,
        name: "유치환의 우체통",
        category: "관광지",
        imageUrl: null,
        summary:
          "초량 이바구길에 위치한 전망 공간이다. 부산항과 원도심 야경을 감상할 수 있으며, 1년 뒤 도착하는 느린 우체통 콘텐츠를 체험할 수 있다. 화요일부터 토요일까지는 10:00부터 19:00까지, 일요일은 09:00부터 18:00까지 운영되며, 월요일은 휴무이다.",
        latitude: 35.1195,
        longitude: 129.0379,
        likeCount: 0,
        tags: ["문화공간", "시티뷰", "야경", "전망", "체험"],
      },
    ],
    page: 0,
    size: 10,
    totalElements: 668,
    totalPages: 67,
    first: true,
    last: false,
  },
  error: null,
};

const placeDetail = {
  statusCode: 200,
  timestamp: "2026-03-18T06:51:01.242Z",
  path: "/api/place/1",
  message: "장소 상세 조회가 완료되었습니다.",
  data: {
    placeId: 1,
    cityId: 1,
    cityName: "부산",
    name: "광안리 해변",
    category: "관광지",
    address: "부산 수영구 광안동",
    roadAddress: "부산 수영구 광안해변로 219",
    latitude: 35.1532,
    longitude: 129.1186,
    phone: "051-000-0000",
    description: "광안대교 야경을 감상할 수 있는 부산 대표 야경 명소입니다.",
    imageUrl: "https://img.hankyung.com/photo/201810/AA.18104378.1.jpg",
    openingTime: "00:00",
    closingTime: "24:00",
    likeCount: 100,
    reviewCount: 128,
    tags: ["야경", "해안", "포토존"],
  },
  error: null,
};
