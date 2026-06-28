import { http, HttpResponse } from "msw";
import { mockDelay } from "./mockDelay";

const likedReviewIds = new Set([1, 7]);

export const reviewHandlers = [
  // --------------------------- 장소별 리뷰 목록 조회 ---------------------------
  http.get("*/api/review/place/:placeId", async ({ params }) => {
    await mockDelay();

    return HttpResponse.json({
      ...placeReview,
      path: `/api/review/place/${params.placeId}`,
    });
  }),

  // --------------------------- 리뷰 좋아요 추가 ---------------------------
  http.post("*/api/review/:reviewId/like", async ({ params, request }) => {
    await mockDelay();

    const reviewId = Number(params.reviewId);
    const path = `/api/review/${params.reviewId}/like`;
    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");
    const responseBase = {
      timestamp: "2026-06-09T04:31:48.778463400Z",
      path,
      data: null,
    };

    if (!isValidAccessToken) {
      return HttpResponse.json(
        {
          ...responseBase,
          statusCode: 401,
          message: "로그인이 필요합니다.",
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    if (reviewId === 500) {
      return HttpResponse.json(
        {
          ...responseBase,
          statusCode: 500,
          message: "서버 내부 오류가 발생했습니다.",
          error: "INTERNAL_SERVER_ERROR",
        },
        { status: 500 },
      );
    }

    if (likedReviewIds.has(reviewId)) {
      return HttpResponse.json(
        {
          ...responseBase,
          statusCode: 409,
          message: "이미 좋아요 처리된 리뷰입니다.",
          error: "REVIEW_LIKE_ALREADY_EXISTS",
        },
        { status: 409 },
      );
    }

    likedReviewIds.add(reviewId);

    return HttpResponse.json({
      ...responseBase,
      statusCode: 200,
      message: "리뷰 좋아요가 추가되었습니다.",
      data: {
        reviewId,
      },
      error: null,
    });
  }),

  // --------------------------- 리뷰 좋아요 취소 ---------------------------
  http.delete("*/api/review/:reviewId/like", async ({ params, request }) => {
    await mockDelay();

    const reviewId = Number(params.reviewId);
    const path = `/api/review/${params.reviewId}/like`;
    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");
    const responseBase = {
      timestamp: "2026-06-09T04:31:48.778463400Z",
      path,
      data: null,
    };

    if (!isValidAccessToken) {
      return HttpResponse.json(
        {
          ...responseBase,
          statusCode: 401,
          message: "로그인이 필요합니다.",
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    if (!likedReviewIds.has(reviewId)) {
      return HttpResponse.json(
        {
          ...responseBase,
          statusCode: 409,
          message: "이미 좋아요가 취소된 리뷰입니다.",
          error: "REVIEW_LIKE_NOT_FOUND",
        },
        { status: 409 },
      );
    }

    likedReviewIds.delete(reviewId);

    return HttpResponse.json({
      ...responseBase,
      statusCode: 200,
      message: "리뷰 좋아요가 취소되었습니다.",
      data: {
        reviewId,
      },
      error: null,
    });
  }),

  // --------------------------- 리뷰 작성 ---------------------------
  http.post("*/api/review/:placeId", async ({ params, request }) => {
    await mockDelay();

    const placeId = Number(params.placeId);
    const path = `/api/review/${params.placeId}`;
    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");
    const body = await request.json();

    if (!isValidAccessToken) {
      return HttpResponse.json(
        {
          statusCode: 401,
          timestamp: "2026-03-18T06:51:01.242Z",
          path,
          message: "로그인이 필요합니다.",
          data: null,
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    if (!Number.isInteger(placeId) || placeId <= 0 || !body.visitDate || !body.content) {
      return HttpResponse.json(
        {
          statusCode: 400,
          timestamp: "2026-03-18T06:51:01.242Z",
          path,
          message: "리뷰 작성 값이 올바르지 않습니다.",
          data: null,
          error: "INVALID_REVIEW_REQUEST",
        },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      statusCode: 201,
      timestamp: "2026-03-18T06:51:01.242Z",
      path,
      message: "리뷰 작성이 완료되었습니다.",
      data: null,
      error: null,
    });
  }),

  // --------------------------- Cloudinary 리뷰 이미지 업로드 mock ---------------------------
  http.post("https://api.cloudinary.com/v1_1/:cloudName/image/upload", async ({ request }) => {
    await mockDelay();

    const formData = await request.formData();
    const version = 1781772848;
    const filename =
      formData.get("file") && typeof formData.get("file") !== "string"
        ? formData.get("file").name.replace(/\.[^.]+$/, "")
        : "review";
    const publicId = `nighttrip/reviews/${filename || "review"}`;

    return HttpResponse.json({
      asset_id: "mock_review_asset_id",
      public_id: publicId,
      version,
      version_id: "mock_review_version_id",
      signature: "mock_review_signature",
      width: 800,
      height: 600,
      format: "jpg",
      resource_type: "image",
      created_at: "2026-06-18T08:54:08Z",
      bytes: 123456,
      type: "upload",
      url: `http://res.cloudinary.com/dkdk1tl3f/image/upload/v${version}/${publicId}.jpg`,
      secure_url: `https://res.cloudinary.com/dkdk1tl3f/image/upload/v${version}/${publicId}.jpg`,
      original_filename: filename,
    });
  }),

  // --------------------------- 리뷰 수정 ---------------------------
  http.patch("*/api/review/:reviewId", async ({ params, request }) => {
    await mockDelay();

    const reviewId = Number(params.reviewId);
    const path = `/api/review/${params.reviewId}`;
    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");
    const body = await request.json();

    if (!isValidAccessToken) {
      return HttpResponse.json(
        {
          statusCode: 401,
          timestamp: "2026-03-18T06:51:01.242Z",
          path,
          message: "로그인이 필요합니다.",
          data: null,
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    if (!Number.isInteger(reviewId) || reviewId <= 0 || !body.content) {
      return HttpResponse.json(
        {
          statusCode: 400,
          timestamp: "2026-03-18T06:51:01.242Z",
          path,
          message: "리뷰 수정 값이 올바르지 않습니다.",
          data: null,
          error: "INVALID_REVIEW_REQUEST",
        },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-03-18T06:51:01.242Z",
      path,
      message: "리뷰 수정이 완료되었습니다.",
      data: null,
      error: null,
    });
  }),

  // --------------------------- 리뷰 삭제 ---------------------------
  http.delete("*/api/review/:reviewId", async ({ params, request }) => {
    await mockDelay();

    const reviewId = Number(params.reviewId);
    const path = `/api/review/${params.reviewId}`;
    const authorization = request.headers.get("Authorization");
    const isValidAccessToken = /^Bearer mock-access-token(?:-\d+)?$/.test(authorization ?? "");

    if (!isValidAccessToken) {
      return HttpResponse.json(
        {
          statusCode: 401,
          timestamp: "2026-03-18T06:51:01.242Z",
          path,
          message: "로그인이 필요합니다.",
          data: null,
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return HttpResponse.json(
        {
          statusCode: 400,
          timestamp: "2026-03-18T06:51:01.242Z",
          path,
          message: "리뷰 ID가 올바르지 않습니다.",
          data: null,
          error: "INVALID_REVIEW_ID",
        },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-03-18T06:51:01.242Z",
      path,
      message: "리뷰 삭제가 완료되었습니다.",
      data: null,
      error: null,
    });
  }),

  // --------------------------- 전체 리뷰 목록 조회 ---------------------------
  http.get("*/api/review", async () => {
    await mockDelay();

    return HttpResponse.json(reviews);
  }),
];

const placeReview = {
  statusCode: 200,
  timestamp: "2026-06-09T04:31:48.778463400Z",
  path: "/api/review/place/1",
  message: "장소별 리뷰 목록 조회가 완료되었습니다.",
  data: {
    content: [
      {
        reviewId: 3,
        userId: 1,
        nickname: "테스트유저2",
        content: "테스트 리뷰 3",
        likeCount: 0,
        likedByMe: false,
        createdAt: "2026-06-09T13:31:34",
        imageUrls: ["testurl1", "testurl2"],
      },
      {
        reviewId: 2,
        userId: 2,
        nickname: "테스트유저2",
        content: "테스트 리뷰 2",
        likeCount: 0,
        likedByMe: false,
        createdAt: "2026-06-09T13:29:04",
        imageUrls: ["testurl1", "testurl2"],
      },
      {
        reviewId: 1,
        userId: 1,
        nickname: "테스트유저2",
        content: "리뷰 수정 테스트입니다.",
        likeCount: 1,
        likedByMe: true,
        createdAt: "2026-06-08T15:46:50",
        imageUrls: ["testurl1", "testurl2", "testurl3"],
      },
    ],
    page: 0,
    size: 10,
    totalElements: 3,
    totalPages: 1,
    first: true,
    last: true,
  },
  error: null,
};

const reviews = {
  statusCode: 200,
  timestamp: "2026-06-09T05:10:16.212387800Z",
  path: "/api/review",
  message: "전체 리뷰 목록 조회가 완료되었습니다.",
  data: {
    content: [
      {
        reviewId: 7,
        userId: 1,
        placeName: "종포해양공원",
        nickname: "테스트유저2",
        content: "테스트 리뷰입니다5",
        likeCount: 1,
        likedByMe: true,
        createdAt: "2026-06-09T14:09:20",
        imageUrls: [
          "https://mblogthumb-phinf.pstatic.net/MjAyNDA1MDdfMjAy/MDAxNzE1MDkzMDE5ODQ2.PUdveEYZeFafl2gtQwChykzzp3iuhTTi-K0zS-LMfYAg.HjiN0w-JXUiQDqQIy2h-3ccUPaDCmj4_KATv-PiNmfQg.JPEG/SE-ea8fd829-e315-4999-8c24-932bd1348514.jpg?type=w800",
          "https://www.kbreaknews.com/imgdata/hjbreaknews_com/202410/2024102820001966.jpg",
        ],
      },
      {
        reviewId: 6,
        userId: 2,
        placeName: "낭만 포차 거리",
        nickname: "테스트유저2",
        content: "테스트 리뷰입니다5",
        likeCount: 0,
        likedByMe: false,
        createdAt: "2026-06-09T14:09:17",
        imageUrls: [
          "https://blog.kakaocdn.net/dna/EGTwW/btsogZyjSVI/AAAAAAAAAAAAAAAAAAAAAN5GnjEICXbDd5j41A65Nb7qHdYxlG2MgHK4M9GNYVoD/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1782831599&allow_ip=&allow_referer=&signature=e1uiJuX74OBlxYAUNozI1AZh4NI%3D",
          "https://img.hankyung.com/photo/202403/01.36277398.1.png",
        ],
      },
      {
        reviewId: 5,
        userId: 1,
        placeName: "부산 광안리",
        nickname: "테스트유저5",
        content: "테스트 리뷰입니다555555",
        likeCount: 0,
        likedByMe: false,
        createdAt: "2026-06-09T14:09:17",
        imageUrls: [],
      },
    ],
    page: 0,
    size: 10,
    totalElements: 6,
    totalPages: 1,
    first: true,
    last: true,
  },
  error: null,
};
