import { delay } from "msw";

const DEFAULT_DELAY = 300;

function getDelayMs() {
  const delayValue = import.meta.env.VITE_MSW_DELAY;
  const delayMs = Number.parseInt(delayValue, 10);

  return Number.isFinite(delayMs) && delayMs >= 0 ? delayMs : DEFAULT_DELAY;
}

export function mockDelay() {
  return delay(getDelayMs());
}
