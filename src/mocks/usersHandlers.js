// src/mocks/handlers.js
import { http, HttpResponse } from "msw";
import { mockDelay } from "./mockDelay";

export const usersHandlers = [
  // --------------------------- 비밀번호 변경 ---------------------------
  http.patch("*/api/users/me/password", async ({ request }) => {
    await mockDelay();

    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");

    const matchPassword = "12345678";
    const body = await request.json();
    const currentPassword = body.currentPassword;

    const isMatchedPassword = matchPassword == currentPassword;

    if (!isValidAccessToken) {
      return HttpResponse.json(
        {
          statusCode: 401,
          timestamp: "2026-03-18T06:51:01.242Z",
          path: "/api/users/me/password",
          message: "인증이 필요합니다.",
          data: null,
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }
    if (!isMatchedPassword) {
      return HttpResponse.json(
        {
          statusCode: 400,
          timestamp: "2026-03-18T06:51:01.242Z",
          path: "/api/users/me/password",
          message: "현재 비밀번호가 일치하지 않습니다.",
          data: null,
          error: "INVALID_CURRENT_PASSWORD",
        },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-03-18T06:51:01.242Z",
      path: "/api/users/me/password",
      message: "비밀번호가 변경되었습니다.",
      data: null,
      error: null,
    });
  }),

  // --------------------------- 회원 탈퇴 ---------------------------
  http.delete("*/api/users/me", async ({ request }) => {
    await mockDelay();

    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");

    const matchPassword = "12345678";
    const body = await request.json();
    const password = body.password;

    const isMatchedPassword = matchPassword == password;

    if (!isValidAccessToken) {
      return HttpResponse.json(
        {
          statusCode: 401,
          timestamp: "2026-03-18T06:51:01.242Z",
          path: "/api/users/me",
          message: "인증이 필요합니다.",
          data: null,
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }
    if (!isMatchedPassword) {
      return HttpResponse.json(
        {
          statusCode: 400,
          timestamp: "2026-03-18T06:51:01.242Z",
          path: "/api/users/me",
          message: "비밀번호가 일치하지 않습니다.",
          data: null,
          error: "INVALID_PASSWORD",
        },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      {
        statusCode: 200,
        timestamp: "2026-03-18T06:51:01.242Z",
        path: "/api/users/me",
        message: "회원 탈퇴가 완료되었습니다.",
        data: null,
        error: null,
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": "refreshToken=; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=0",
        },
      },
    );
  }),

  // --------------------------- 내 정보 수정 ---------------------------
  http.patch("*/api/users/me", async ({ request }) => {
    await mockDelay();

    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");

    if (!isValidAccessToken) {
      return HttpResponse.json(
        {
          statusCode: 401,
          timestamp: "2026-03-18T06:51:01.242Z",
          path: "/api/users/me",
          message: "Access Token이 만료되었습니다.",
          data: null,
          error: "TOKEN_EXPIRED",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const nickname = body.nickname;

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-03-18T06:51:01.242Z",
      path: "/api/users/me",
      message: "내 정보가 수정되었습니다.",
      data: {
        userId: 1,
        email: "user@example.com",
        nickname: typeof nickname === "string" && nickname ? nickname : "로리",
        role: "USER",
        profileImageUrl: "https://example.com/profile/default.png",
        updatedAt: "2026-03-18T06:51:01",
      },
      error: null,
    });
  }),

  // --------------------------- 프로필 이미지 업로드 서명 발급 ---------------------------
  http.post("*/api/users/me/profileImage/signature", async ({ request }) => {
    await mockDelay();

    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");

    if (!isValidAccessToken) {
      return HttpResponse.json(
        {
          statusCode: 401,
          timestamp: "2026-03-18T06:51:01.242Z",
          path: "/api/users/me/profileImage/signature",
          message: "인증이 필요합니다.",
          data: null,
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-06-18T09:19:12.560700800Z",
      path: "/api/users/me/profileImage/signature",
      message: "프로필 이미지 업로드 서명 발급이 완료되었습니다.",
      data: {
        cloudName: "dkdk1tl3f",
        apiKey: "276789936493414",
        timestamp: 1781774352,
        signature: "8c407915a9274dbffb652143996d1cb3ac429385",
        folder: "nighttrip/profiles/user_1",
        publicId: "profile_mock",
        uploadUrl: "https://api.cloudinary.com/v1_1/dkdk1tl3f/image/upload",
      },
      error: null,
    });
  }),

  // --------------------------- Cloudinary 이미지 업로드 mock ---------------------------
  http.post("https://api.cloudinary.com/v1_1/:cloudName/image/upload", async ({ request }) => {
    await mockDelay();

    const formData = await request.formData();
    const folder = formData.get("folder") || "nighttrip/profiles/user_1";
    const publicId = formData.get("public_id") || "profile_mock";
    const fullPublicId = `${folder}/${publicId}`;
    const version = 1781772848;

    return HttpResponse.json({
      asset_id: "mock_asset_id",
      public_id: fullPublicId,
      version,
      version_id: "mock_version_id",
      signature: "mock_cloudinary_signature",
      width: 512,
      height: 512,
      format: "jpg",
      resource_type: "image",
      created_at: "2026-06-18T08:54:08Z",
      tags: [],
      bytes: 123456,
      type: "upload",
      etag: "mock_etag",
      placeholder: false,
      url: `http://res.cloudinary.com/dkdk1tl3f/image/upload/v${version}/${fullPublicId}.jpg`,
      secure_url: `https://res.cloudinary.com/dkdk1tl3f/image/upload/v${version}/${fullPublicId}.jpg`,
      asset_folder: folder,
      display_name: publicId,
      original_filename: "profile",
      api_key: formData.get("api_key"),
    });
  }),

  // --------------------------- 프로필 이미지 수정 ---------------------------
  http.patch("*/api/users/me/profileImage", async ({ request }) => {
    await mockDelay();

    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");

    if (!isValidAccessToken) {
      return HttpResponse.json(
        {
          statusCode: 401,
          timestamp: "2026-03-18T06:51:01.242Z",
          path: "/api/users/me/profileImage",
          message: "인증이 필요합니다.",
          data: null,
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-06-18T09:19:12.560700800Z",
      path: "/api/users/me/profileImage",
      message: "프로필 이미지가 변경되었습니다.",
      data: {
        userId: 1,
        email: "user@example.com",
        nickname: "닉네임",
        role: "USER",
        profileImageUrl: body.imageUrl,
        updatedAt: "2026-06-18T09:19:12",
      },
      error: null,
    });
  }),

  // --------------------------- 내 정보 조회 ---------------------------
  http.get("*/api/users/me", async ({ request }) => {
    await mockDelay();

    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");

    if (!isValidAccessToken) {
      return HttpResponse.json(
        {
          statusCode: 401,
          timestamp: "2026-03-18T06:51:01.242Z",
          path: "/api/users/me",
          message: "Access Token이 만료되었습니다.",
          data: null,
          error: "TOKEN_EXPIRED",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-03-18T06:51:01.242Z",
      path: "/api/users/me",
      message: "내 정보 조회에 성공했습니다.",
      data: {
        userId: 1,
        email: "user@example.com",
        nickname: "닉네임",
        role: "USER",
        profileImageUrl: "https://example.com/profile/default.png",
        createdAt: "2026-03-18T06:51:01",
      },
      error: null,
    });
  }),

  // --------------------------- 내 장소 즐겨찾기 목록 조회 ---------------------------
  http.get("*/api/users/me/favorite", async ({ request }) => {
    await mockDelay();

    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");

    const page = new URL(request.url).searchParams.get("page");
    const size = new URL(request.url).searchParams.get("size");

    if (!isValidAccessToken) {
      return HttpResponse.json(
        {
          statusCode: 401,
          timestamp: "2026-03-18T06:51:01.242Z",
          path: "/api/users/me/favorite",
          message: "인증이 필요합니다.",
          data: null,
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-03-18T06:51:01.242Z",
      path: "/api/users/me/favorite",
      message: "내 장소 즐겨찾기 목록 조회가 완료되었습니다.",
      data: {
        content: [
          {
            placeId: 1,
            name: "Gwangalli Beach",
            category: "관광지",
            imageUrl: "https://example.com/images/gwangalli.jpg",
            summary: "광안대교 야경을 감상할 수 있는 부산 대표 야경 명소입니다.",
            latitude: 123.123,
            longitude: 34.221,
            likeCount: 35,
            tags: ["야경", "한식"],
          },
          {
            placeId: 1,
            name: "Gwangalli Beach",
            category: "관광지",
            imageUrl: "https://example.com/images/gwangalli.jpg",
            summary: "광안대교 야경을 감상할 수 있는 부산 대표 야경 명소입니다.",
            latitude: 123.123,
            longitude: 34.221,
            likeCount: 35,
            tags: ["야경", "한식"],
          },
        ],
        page: page ? page : 0,
        size: size ? size : 10,
        totalElements: 2,
        totalPages: 1,
        first: true,
        last: true,
      },
      error: null,
    });
  }),

  // --------------------------- 내 코스 목록 조회 ---------------------------
  http.get("*/api/users/me/course", async ({ request }) => {
    await mockDelay();

    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");

    const page = new URL(request.url).searchParams.get("page");
    const size = new URL(request.url).searchParams.get("size");

    if (!isValidAccessToken) {
      return HttpResponse.json(
        {
          statusCode: 401,
          timestamp: "2026-03-18T06:51:01.242Z",
          path: "/api/users/me/review",
          message: "인증이 필요합니다.",
          data: null,
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-06-16T01:10:56.145185700Z",
      path: "/api/users/me/course",
      message: "내 코스 목록 조회가 완료되었습니다.",
      data: {
        content: [
          {
            courseId: 1,
            cityId: 2,
            cityName: "여수(cityName)",
            title: "여수 추천 코스 1(title)",
            description:
              "2026-06-12 여수 AI 추천 코스입니다. 총 3개의 장소로 구성되어 있습니다.(description)",
            theme: "AI_RECOMMEND(theme)",
            totalDurationMinutes: 13,
            totalTravelMinutes: 13,
            transport: "CAR",
            placeCount: 3,
            createdAt: "2026-06-13T18:51:16",
            updatedAt: "2026-06-13T18:51:16",
          },
          {
            courseId: 2,
            cityId: 1,
            cityName: "부산",
            title: "부산 추천 코스 1",
            description: "2026-06-12 부산 AI 추천 코스입니다. 총 2개의 장소로 구성되어 있습니다.",
            theme: "AI_RECOMMEND",
            totalDurationMinutes: 13,
            totalTravelMinutes: 13,
            transport: "CAR",
            placeCount: 3,
            createdAt: "2026-06-13T18:51:16",
            updatedAt: "2026-06-13T18:51:16",
          },
        ],
        page: page ? Number(page) : 0,
        size: size ? Number(size) : 10,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      },
      error: null,
    });
  }),

  // --------------------------- 내 리뷰 목록 조회 ---------------------------
  http.get("*/api/users/me/review", async ({ request }) => {
    await mockDelay();

    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");

    const page = new URL(request.url).searchParams.get("page");
    const size = new URL(request.url).searchParams.get("size");

    if (!isValidAccessToken) {
      return HttpResponse.json(
        {
          statusCode: 401,
          timestamp: "2026-03-18T06:51:01.242Z",
          path: "/api/users/me/review",
          message: "인증이 필요합니다.",
          data: null,
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-03-18T06:51:01.242Z",
      path: "/api/users/me/review",
      message: "내 리뷰 목록 조회가 완료되었습니다.",
      data: {
        content: [
          {
            reviewId: 1,
            placeId: 1,
            placeName: "광안리 해변",
            placeImageUrl: "https://example.com/images/gwangalli.jpg",
            content: "광안대교 야경이 정말 예뻤고 산책하기 좋았습니다.",
            visitDate: "2026-03-17",
            likeCount: 12,
            createdAt: "2026-03-18T06:51:01.242Z",
          },
          {
            reviewId: 2,
            placeId: 2,
            placeName: "더베이 101",
            placeImageUrl: "https://example.com/images/thebay_101.jpg",
            content: "야경이 멋지고 근처에 식당도 많아서 좋았습니다.",
            visitDate: "2026-03-16",
            likeCount: 8,
            createdAt: "2026-03-18T07:10:20.123Z",
          },
        ],
        page: page ? Number(page) : 0,
        size: size ? Number(size) : 10,
        totalElements: 2,
        totalPages: 1,
        first: true,
        last: true,
      },
      error: null,
    });
  }),

  // --------------------------- 내 코스 상세 조회 ---------------------------
  http.get("*/api/users/me/course/:courseId", async ({ request }) => {
    await mockDelay();

    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");

    if (!isValidAccessToken) {
      return HttpResponse.json(
        {
          statusCode: 401,
          timestamp: "2026-03-18T06:51:01.242Z",
          path: "/api/users/me/course/1",
          message: "인증이 필요합니다.",
          data: null,
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-06-16T01:12:03.681986400Z",
      path: "/api/users/me/course/1",
      message: "내 코스 상세 조회가 완료되었습니다.",
      data: {
        courseId: 1,
        cityId: 2,
        cityName: "여수",
        userId: 2,
        title: "여수 추천 코스 1",
        description: "2026-06-12 여수 AI 추천 코스입니다. 총 3개의 장소로 구성되어 있습니다.",
        theme: "AI_RECOMMEND",
        startTime: null,
        endTime: null,
        totalDurationMinutes: 13,
        totalTravelMinutes: 13,
        transport: "CAR",
        createdAt: "2026-06-13T18:51:16",
        updatedAt: "2026-06-13T18:51:16",
        deletedAt: null,
        places: [
          {
            coursePlaceId: 1,
            courseId: 1,
            placeId: 23,
            sequence: 1,
            travelMinutesFromPrevious: 0,
            createdAt: "2026-06-13T18:51:16",
            updatedAt: "2026-06-13T18:51:16",
            placeName: "하멜등대",
            latitude: 34.7367675,
            longitude: 127.7484077,
          },
          {
            coursePlaceId: 2,
            courseId: 1,
            placeId: 1,
            sequence: 2,
            travelMinutesFromPrevious: 0,
            createdAt: "2026-06-13T18:51:16",
            updatedAt: "2026-06-13T18:51:16",
            placeName: "낭만 포차 거리",
            latitude: 34.7365374,
            longitude: 127.7494945,
          },
          {
            coursePlaceId: 3,
            courseId: 1,
            placeId: 120,
            sequence: 3,
            travelMinutesFromPrevious: 0,
            createdAt: "2026-06-13T18:51:16",
            updatedAt: "2026-06-13T18:51:16",
            placeName: "HS관광호텔",
            latitude: 34.7431959,
            longitude: 127.7500268,
          },
        ],
      },
      error: null,
    });
  }),
];
