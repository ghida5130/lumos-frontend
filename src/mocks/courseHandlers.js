// src/mocks/handlers.js
import { http, HttpResponse } from "msw";
import { mockDelay } from "./mockDelay";

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

const isValidAccessToken = (request) => {
  const authorization = request.headers.get("Authorization");
  return /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");
};

const getUnauthorizedResponse = (path) => ({
  statusCode: 401,
  timestamp: "2026-03-18T06:51:01.242Z",
  path,
  message: "인증이 필요합니다.",
  data: null,
  error: "UNAUTHORIZED",
});

const getInvalidRequestBodyResponse = (path) => ({
  statusCode: 400,
  timestamp: "2026-06-13T09:51:16.474402300Z",
  path,
  message: "요청 형식이 올바르지 않습니다.",
  data: null,
  error: "INVALID_REQUEST_BODY",
});

export const courseHandlers = [
  // --------------------------- 코스 저장 ---------------------------
  http.post("*/api/course", async ({ request }) => {
    const path = "/api/course";
    const isStringArray = (value) =>
      Array.isArray(value) && value.every((item) => typeof item === "string");
    const isPlace = (place) =>
      isObject(place) &&
      isNumber(place.order) &&
      isNumber(place.placeId) &&
      typeof place.name === "string" &&
      typeof place.category === "string" &&
      isNumber(place.latitude) &&
      isNumber(place.longitude) &&
      isNumber(place.score) &&
      isNumber(place.tagScore) &&
      isNumber(place.distanceScore) &&
      isStringArray(place.tags);
    const isCourse = (course) =>
      isObject(course) &&
      isNumber(course.rank) &&
      isNumber(course.totalScore) &&
      isNumber(course.totalDistanceKm) &&
      isNumber(course.estimatedMoveMinutes) &&
      Array.isArray(course.places) &&
      course.places.every(isPlace);
    const isCourseRequestBody = (body) =>
      isObject(body) &&
      typeof body.city === "string" &&
      typeof body.date === "string" &&
      Array.isArray(body.courses) &&
      body.courses.every(isCourse);

    await mockDelay();

    if (!isValidAccessToken(request)) {
      return HttpResponse.json(getUnauthorizedResponse(path), { status: 401 });
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(getInvalidRequestBodyResponse(path), { status: 400 });
    }

    if (!isCourseRequestBody(body)) {
      return HttpResponse.json(getInvalidRequestBodyResponse(path), { status: 400 });
    }

    return HttpResponse.json(
      {
        statusCode: 201,
        timestamp: "2026-06-13T09:51:16.474402300Z",
        path,
        message: "코스가 저장되었습니다.",
        data: {
          courseIds: [1],
        },
        error: null,
      },
      { status: 201 },
    );
  }),

  // --------------------------- 코스 추천 ---------------------------
  http.post("*/api/course/recommend", async ({ request }) => {
    const path = "/api/course/recommend";
    const isCourseRecommendRequestBody = (body) =>
      isObject(body) &&
      typeof body.city === "string" &&
      typeof body.date === "string" &&
      typeof body.content === "string";

    await mockDelay();

    if (!isValidAccessToken(request)) {
      return HttpResponse.json(getUnauthorizedResponse(path), { status: 401 });
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(getInvalidRequestBodyResponse(path), { status: 400 });
    }

    if (!isCourseRecommendRequestBody(body)) {
      return HttpResponse.json(getInvalidRequestBodyResponse(path), { status: 400 });
    }

    const recommendations = [
      {
        rank: 1,
        totalScore: 72.39,
        totalDistanceKm: 7.13,
        estimatedMoveMinutes: 13,
        places: [
          {
            order: 1,
            placeId: 23,
            name: "하멜등대",
            category: "관광지",
            latitude: 34.7367675,
            longitude: 127.7484077,
            score: 70,
            tagScore: 70,
            distanceScore: 0,
            tags: ["산책", "야경", "해안"],
          },
          {
            order: 2,
            placeId: 1,
            name: "낭만 포차 거리",
            category: "술집",
            latitude: 34.7365374,
            longitude: 127.7494945,
            score: 56.1,
            tagScore: 37.5,
            distanceScore: 99.49,
            tags: ["술집"],
          },
          {
            order: 3,
            placeId: 120,
            name: "HS관광호텔",
            category: "숙소",
            latitude: 34.7431959,
            longitude: 127.7500268,
            score: 77.89,
            tagScore: 70,
            distanceScore: 96.29,
            tags: ["오션뷰", "호텔"],
          },
        ],
      },
      {
        rank: 2,
        totalScore: 72.08,
        totalDistanceKm: 7.2,
        estimatedMoveMinutes: 14,
        places: [
          {
            order: 1,
            placeId: 25,
            name: "거북선대교",
            category: "관광지",
            latitude: 34.7371171,
            longitude: 127.7477345,
            score: 70,
            tagScore: 70,
            distanceScore: 0,
            tags: ["산책", "야경", "해안"],
          },
          {
            order: 2,
            placeId: 1,
            name: "낭만 포차 거리",
            category: "술집",
            latitude: 34.7365374,
            longitude: 127.7494945,
            score: 55.99,
            tagScore: 37.5,
            distanceScore: 99.13,
            tags: ["술집"],
          },
          {
            order: 3,
            placeId: 120,
            name: "HS관광호텔",
            category: "숙소",
            latitude: 34.7431959,
            longitude: 127.7500268,
            score: 77.89,
            tagScore: 70,
            distanceScore: 96.29,
            tags: ["오션뷰", "호텔"],
          },
        ],
      },
      {
        rank: 3,
        totalScore: 71.97,
        totalDistanceKm: 6.72,
        estimatedMoveMinutes: 14,
        places: [
          {
            order: 1,
            placeId: 49,
            name: "여수구항 해양공원",
            category: "관광지",
            latitude: 34.7383177,
            longitude: 127.7449417,
            score: 70,
            tagScore: 70,
            distanceScore: 0,
            tags: ["산책", "야경", "해안"],
          },
          {
            order: 2,
            placeId: 1,
            name: "낭만 포차 거리",
            category: "술집",
            latitude: 34.7365374,
            longitude: 127.7494945,
            score: 55.56,
            tagScore: 37.5,
            distanceScore: 97.7,
            tags: ["술집"],
          },
          {
            order: 3,
            placeId: 120,
            name: "HS관광호텔",
            category: "숙소",
            latitude: 34.7431959,
            longitude: 127.7500268,
            score: 77.89,
            tagScore: 70,
            distanceScore: 96.29,
            tags: ["오션뷰", "호텔"],
          },
        ],
      },
    ];

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-06-13T08:57:42.270258100Z",
      path,
      message: "코스 추천이 완료되었습니다",
      data: {
        city: body.city,
        date: body.date,
        recommendations,
      },
      error: null,
    });
  }),

  // --------------------------- 코스 수정 ---------------------------
  http.patch("*/api/course/:courseId", async ({ params, request }) => {
    const isNullableString = (value) => value === null || typeof value === "string";
    const isCourseUpdatePlace = (place) =>
      isObject(place) &&
      isNumber(place.placeId) &&
      isNumber(place.sequence) &&
      isNumber(place.travelMinutesFromPrevious);
    const isCourseUpdateRequestBody = (body) =>
      isObject(body) &&
      isNumber(body.cityId) &&
      typeof body.title === "string" &&
      typeof body.description === "string" &&
      typeof body.theme === "string" &&
      isNullableString(body.startTime) &&
      isNullableString(body.endTime) &&
      isNumber(body.totalDurationMinutes) &&
      isNumber(body.totalTravelMinutes) &&
      typeof body.transport === "string" &&
      Array.isArray(body.places) &&
      body.places.every(isCourseUpdatePlace);

    await mockDelay();

    const courseId = Number(params.courseId);
    const path = `/api/course/${params.courseId}`;

    if (!isValidAccessToken(request)) {
      return HttpResponse.json(getUnauthorizedResponse(path), { status: 401 });
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(getInvalidRequestBodyResponse(path), { status: 400 });
    }

    if (!Number.isInteger(courseId) || courseId <= 0 || !isCourseUpdateRequestBody(body)) {
      return HttpResponse.json(getInvalidRequestBodyResponse(path), { status: 400 });
    }

    const placeDetailsById = {
      1: {
        placeName: "낭만 포차 거리",
        latitude: 34.7365374,
        longitude: 127.7494945,
      },
      49: {
        placeName: "여수구항 해양공원",
        latitude: 34.7383177,
        longitude: 127.7449417,
      },
      120: {
        placeName: "HS관광호텔",
        latitude: 34.7431959,
        longitude: 127.7500268,
      },
    };

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-06-16T01:36:22.541383Z",
      path,
      message: "코스가 수정되었습니다.",
      data: {
        courseId,
        cityId: body.cityId,
        cityName: "여수",
        userId: 2,
        title: body.title,
        description: body.description,
        theme: body.theme,
        startTime: body.startTime,
        endTime: body.endTime,
        totalDurationMinutes: body.totalDurationMinutes,
        totalTravelMinutes: body.totalTravelMinutes,
        transport: body.transport,
        createdAt: "2026-06-13T18:51:16",
        updatedAt: "2026-06-13T18:51:16",
        deletedAt: null,
        places: body.places.map((place, index) => {
          const placeDetail = placeDetailsById[place.placeId] ?? {
            placeName: "",
            latitude: null,
            longitude: null,
          };

          return {
            coursePlaceId: index + 4,
            courseId,
            placeId: place.placeId,
            sequence: place.sequence,
            travelMinutesFromPrevious: place.travelMinutesFromPrevious,
            createdAt: "2026-06-16T10:36:22",
            updatedAt: "2026-06-16T10:36:22",
            ...placeDetail,
          };
        }),
      },
      error: null,
    });
  }),
];
