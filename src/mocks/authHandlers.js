// src/mocks/handlers.js
import { http, HttpResponse } from "msw";
import { mockDelay } from "./mockDelay";

// 인증번호 요청, 비밀번호 재설정 요청 미구현
export const authHandlers = [
  // 회원가입 ----------------------------------------------------------------------------------------------------
  http.post("*/api/auth/signup", async ({ request }) => {
    await mockDelay();

    const responseBase = {
      timestamp: "2026-03-18T06:51:01.242Z",
      path: "/api/auth/signup",
      data: null,
    };

    // json 요청이 아닐경우 400응답
    if (!request.headers.get("Content-Type")?.includes("application/json")) {
      return HttpResponse.json(
        {
          ...responseBase,
          statusCode: 400,
          message: "유효하지 않은 요청입니다.",
          error: "INVALID_REQUEST",
        },
        { status: 400 },
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(
        {
          ...responseBase,
          statusCode: 400,
          message: "유효하지 않은 요청입니다.",
          error: "INVALID_REQUEST",
        },
        { status: 400 },
      );
    }

    // 이메일, 비밀번호, 닉네임 유효성 체크
    const { email, password, nickname } = body ?? {};
    const isValidRequest =
      typeof email === "string" &&
      email.includes("@") &&
      typeof password === "string" &&
      password.length > 0 &&
      typeof nickname === "string" &&
      nickname.length > 0;

    // 유효성 체크 결과에 따른 응답
    if (!isValidRequest) {
      return HttpResponse.json(
        {
          ...responseBase,
          statusCode: 400,
          message: "유효하지 않은 요청입니다.",
          error: "INVALID_REQUEST",
        },
        { status: 400 },
      );
    }

    // 중복 이메일 응답
    if (email === "duplicate@example.com") {
      return HttpResponse.json(
        {
          ...responseBase,
          statusCode: 409,
          message: "이미 가입된 이메일입니다.",
          error: "EMAIL_ALREADY_EXISTS",
        },
        { status: 409 },
      );
    }

    // 서버 에러 응답
    if (email === "server-error@example.com") {
      return HttpResponse.json(
        {
          ...responseBase,
          statusCode: 500,
          message: "회원가입 중 오류가 발생했습니다.",
          error: "INTERNAL_SERVER_ERROR",
        },
        { status: 500 },
      );
    }

    // 정상 가입 응답
    return HttpResponse.json(
      {
        ...responseBase,
        statusCode: 201,
        message: "회원가입이 완료되었습니다.",
        data: {
          userId: "eb50a73f-785f-49ce-887b-5f0bba67a1e3",
          email,
          nickname,
        },
        error: null,
      },
      { status: 201 },
    );
  }),

  // 닉네임 중복 확인 ----------------------------------------------------------------------------------------------------
  http.get("*/api/auth/check-nickname", async ({ request }) => {
    await mockDelay();

    const email = new URL(request.url).searchParams.get("nickname")?.trim().toLowerCase();
    const registeredEmails = new Set(["nickname", "duplicate"]);

    // nickname이 제대로 입력되었고 기존 닉네임중 없을때 true
    const available = Boolean(email) && !registeredEmails.has(email);

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-03-18T06:51:01.242Z",
      path: "/api/auth/check-nickname",
      message: available ? "사용 가능한 닉네임입니다." : "이미 사용 중인 닉네임입니다.",
      data: {
        available,
      },
      error: null,
    });
  }),

  // 이메일 중복 확인 ----------------------------------------------------------------------------------------------------
  http.get("*/api/auth/check-email", async ({ request }) => {
    await mockDelay();

    const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase();
    const registeredEmails = new Set([
      "user@example.com",
      "example@example.com",
      "duplicate@example.com",
    ]);
    // email이 제대로 입력되었고 기존 이메일중 없을때 true
    const available = Boolean(email) && !registeredEmails.has(email);

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-03-18T06:51:01.242Z",
      path: "/api/auth/check-email",
      message: available ? "사용 가능한 이메일입니다." : "이미 사용 중인 이메일입니다.",
      data: {
        available,
      },
      error: null,
    });
  }),

  // 로그인 ----------------------------------------------------------------------------------------------------
  http.post("*/api/auth/login", async ({ request }) => {
    await mockDelay();

    const body = await request.json();
    const isValidLogin = body.email === "example@example.com" && body.password === "password";
    const responseBase = {
      timestamp: new Date().toISOString(),
      path: "/api/auth/login",
    };

    if (!isValidLogin) {
      return HttpResponse.json(
        {
          ...responseBase,
          statusCode: 401,
          message: "이메일 또는 비밀번호가 올바르지 않습니다.",
          data: null,
          error: "AUTH_006",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json(
      {
        ...responseBase,
        statusCode: 200,
        message: "로그인에 성공했습니다.",
        data: {
          accessToken: "mock-access-token",
          tokenType: "Bearer",
          expiresIn: 3600,
          user: {
            userId: 1,
            email: "user-pinia@example.com",
            nickname: "test-pinia",
            role: "USER",
            profileImageUrl:
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnSA1zygA3rubv-VK0DrVcQ02Po79kJhXo_A&s",
          },
        },
        error: null,
      },
      {
        status: 200,
        headers: {
          "Set-Cookie":
            "refreshToken=mock-refresh-token; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=1209600",
        },
      },
    );
  }),

  // 로그아웃 ----------------------------------------------------------------------------------------------------
  http.post("*/api/auth/logout", async () => {
    await mockDelay();

    return HttpResponse.json(
      {
        statusCode: 200,
        timestamp: new Date().toISOString(),
        path: "/api/auth/logout",
        message: "로그아웃에 성공했습니다.",
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

  // 토큰 재발급 ----------------------------------------------------------------------------------------------------
  http.post("*/api/auth/refresh", async ({ cookies }) => {
    await mockDelay();

    if (!cookies.refreshToken) {
      return HttpResponse.json(
        {
          statusCode: 401,
          timestamp: new Date().toISOString(),
          path: "/api/auth/refresh",
          message: "Refresh Token이 존재하지 않습니다.",
          data: null,
          error: "AUTH_008",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: "/api/auth/refresh",
      message: "Access Token을 재발급했습니다.",
      data: {
        accessToken: `mock-access-token-${Date.now()}`,
        tokenType: "Bearer",
        expiresIn: 3600,
        user: {
          userId: 1,
          email: "user@example.com",
          nickname: "test",
          role: "USER",
          profileImageUrl: "https://example.com/profile/default.png",
        },
      },
      error: null,
    });
  }),
];
