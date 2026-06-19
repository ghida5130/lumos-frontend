// src/mocks/browser.ts
import { setupWorker } from "msw/browser";
import { citiesHandlers } from "./citiesHandlers";
import { authHandlers } from "./authHandlers";
import { usersHandlers } from "./usersHandlers";
import { placeHandlers } from "./placeHandlers";
import { reviewHandlers } from "./reviewHandlers";
import { courseHandlers } from "./courseHandlers";

export const worker = setupWorker(
  ...authHandlers,
  ...citiesHandlers,
  ...usersHandlers,
  ...placeHandlers,
  ...reviewHandlers,
  ...courseHandlers,
);
