/*
  Umami analytics — silent no-op until PUBLIC_UMAMI_SITE_ID is set.

  Never pass anything a visitor wrote. Event names are a fixed list, and the
  URL fragment (which can carry values from the Values Finder) is never read
  or forwarded here.
*/

import { UMAMI_SITE_ID } from "./config.js";

export const ENABLED = Boolean(UMAMI_SITE_ID);

export const EVENTS = {
  stepReached: (n) => `step-${n}-reached`,
  setupStarted: "setup-started",
  valuesImported: "values-imported",
  documentEmailed: "document-emailed",
  bookingClicked: "booking-clicked",
  icsDownloaded: "ics-downloaded",
  answersExported: "answers-exported",
  answersCleared: "answers-cleared",
  printed: "document-printed",
};

/** Fire an event. Does nothing at all when the site ID is unset. */
export function track(event, data) {
  if (!ENABLED || typeof window === "undefined") return;
  try {
    window.umami?.track?.(event, data);
  } catch {
    // Analytics must never break the journey.
  }
}

export function trackStep(n) {
  track(EVENTS.stepReached(n));
}
