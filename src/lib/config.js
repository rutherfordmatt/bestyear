// Public configuration. Everything here is safe in the browser.
// Read at build time from PUBLIC_* environment variables.

const env = import.meta.env ?? {};

export const BOOKING_URL =
  env.PUBLIC_BOOKING_URL || "https://mattrutherfordcoaching.com/?source=ywb";

/*
  The header's "Coaching" link is deliberately separate from BOOKING_URL.
  BOOKING_URL becomes a Cal.com booking page once that is live; the header
  link should still point at the coaching site itself.
*/
export const COACHING_URL =
  env.PUBLIC_COACHING_URL || "https://mattrutherfordcoaching.com/?source=ywb";

// The header's "Newsletter" link is hidden when this is unset, as on
// thevaluesfinder.com.
export const NEWSLETTER_URL = env.PUBLIC_NEWSLETTER_URL || "";

export const VALUES_FINDER_URL =
  env.PUBLIC_VALUES_FINDER_URL || "https://thevaluesfinder.com";

export const SITE_URL = env.PUBLIC_SITE_URL || "https://yearwellbuilt.com";

export const UMAMI_SITE_ID = env.PUBLIC_UMAMI_SITE_ID || "";
export const UMAMI_SCRIPT_URL =
  env.PUBLIC_UMAMI_SCRIPT_URL || "https://analytics.stff.me/script.js";

export const CONTACT_EMAIL = "matt@mattrutherford.co.uk";

export const SITE_NAME = "Year Well Built";
export const TAGLINE = "Build your best year";

// Feature flags for things the plan defers to v1.1.
export const FEATURES = {
  dailyNudges: false,      // no endpoint yet — the email field stays hidden
  quarterlyEmails: false,
  generatedPdf: false,     // MVP uses the print stylesheet
  darkTheme: false,        // tokens are dark-ready; palette not signed off
};
