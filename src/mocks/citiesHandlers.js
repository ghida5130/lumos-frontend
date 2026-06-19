// src/mocks/handlers.js
import { http, HttpResponse } from "msw";
import { mockDelay } from "./mockDelay";

export const citiesHandlers = [
  // --------------------------- 도시 전체 목록 조회 ---------------------------
  http.get("*/api/cities", async () => {
    await mockDelay();

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-03-18T06:51:01.242Z",
      path: "/api/cities",
      message: "비밀번호가 재설정되었습니다.",
      data: [
        {
          cityId: 1,
          name: "부산",
          region: "부산광역시",
          description: "해운대, 광안리 등 야간 관광 명소가 많은 도시",
          imageUrl: "https://example.com/busan.jpg",
        },
        {
          cityId: 2,
          name: "인천",
          region: "인천광역시",
          description: "송도, 월미도 등 야간 관광지가 있는 도시",
          imageUrl: "https://example.com/incheon.jpg",
        },
      ],
      error: null,
    });
  }),

  // --------------------------- 도시 상세 정보 조회 ---------------------------
  http.get("*/api/cities/1", async () => {
    await mockDelay();

    return HttpResponse.json({
      statusCode: 200,
      timestamp: "2026-03-18T06:51:01.242Z",
      path: "/api/cities/1",
      message: "도시 상세 정보 조회가 완료되었습니다.",
      data: {
        cityId: 1,
        name: "부산",
        region: "부산광역시",
        description: "부산은 해운대, 광안리, 송도 등 다양한 야간 관광 명소를 가진 도시입니다.",
        imageUrl: "https://example.com/images/busan.jpg",
      },
      error: null,
    });
  }),
];
