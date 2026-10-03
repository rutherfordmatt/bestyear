/*
  Two-way hand-off with thevaluesfinder.com.

  Values arrive by URL fragment only: yearwellbuilt.com/#values=integrity,family
  Fragments are never sent to a server and never reach analytics. We read the
  fragment, save it, then strip it from the address bar so it isn't shared or
  left in history.
*/

import { VALUES_FINDER_URL, SITE_URL } from "./config.js";

/*
  The Values Finder works in 5 to 8. This exercise guides toward six to eight,
  but accepts five so a hand-off from there is never blocked at the door.
  When the Values Finder's own minimum moves to six (see
  docs/values-finder-changes.md), MIN_VALUES can follow.
*/
export const MIN_VALUES = 5;
export const IDEAL_MIN_VALUES = 6;
export const MAX_VALUES = 8;

/** Build the outbound link: "Find your values first", with a return URL. */
export function finderLink(returnPath = "/step/2") {
  const url = new URL(VALUES_FINDER_URL);
  const origin = typeof window !== "undefined" ? window.location.origin : SITE_URL;
  url.searchParams.set("return", new URL(returnPath, origin).toString());
  url.searchParams.set("source", "ywb");
  return url.toString();
}

/**
 * Parse "#values=a,b,c" into a list of slugs. Deliberately free of any import
 * of the 155-value list, so the landing page doesn't ship it for a fragment
 * that is usually absent.
 */
export function parseSlugs(hash = "") {
  const raw = String(hash).replace(/^#/, "");
  if (!raw) return [];
  const list = new URLSearchParams(raw).get("values");
  if (!list) return [];
  const seen = new Set();
  const out = [];
  for (const piece of list.split(",")) {
    const slug = piece.trim().toLowerCase();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
    if (out.length >= MAX_VALUES) break;
  }
  return out;
}

/** Resolve slugs to full values. Loads the value list on demand. */
export async function resolveValues(slugs) {
  if (!slugs.length) return [];
  const { resolveSlug } = await import("./values.js");
  return slugs.map(resolveSlug).filter(Boolean);
}

/** Remove the fragment from the address bar without adding a history entry. */
export function clearFragment() {
  if (typeof window === "undefined" || !window.location.hash) return;
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}`);
}

/**
 * Read any incoming values, hand them back, and clear the fragment.
 * Call once on load, on the landing page and on step 2.
 */
export async function consumeIncomingValues() {
  if (typeof window === "undefined") return [];
  const slugs = parseSlugs(window.location.hash);
  if (!slugs.length) return [];
  clearFragment();
  return resolveValues(slugs);
}
