/*
  The storage layer. Everything a visitor writes lives here and nowhere else.

  Rules this file enforces:
  - localStorage only. No cookies, no network, no server copy.
  - Versioned and repaired on load, so a bad or old save never wipes the lot.
  - Autosave on input, debounced.
  - Export and import as JSON, so moving device doesn't mean retyping.
*/

import {
  STORAGE_KEY, SCHEMA_VERSION, EXPORT_MARKER,
  emptyState, repair, migrate,
} from "./schema.js";

const SAVE_DELAY = 400;
const isBrowser = typeof window !== "undefined" && typeof localStorage !== "undefined";

let state = null;
let saveTimer = null;
const listeners = new Set();

/** localStorage throws in private mode and when the quota is full. */
function safeRead() {
  if (!isBrowser) return null;
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function safeWrite(value) {
  if (!isBrowser) return false;
  try { localStorage.setItem(STORAGE_KEY, value); return true; }
  catch { return false; }
}

export function load() {
  if (state) return state;
  const raw = safeRead();
  if (!raw) { state = emptyState(); return state; }
  try {
    const { state: migrated } = migrate(JSON.parse(raw));
    state = migrated;
  } catch {
    // Corrupt JSON. Keep a copy under a side key rather than destroying it
    // outright, so the visitor can still export it if they ask.
    try { localStorage.setItem(`${STORAGE_KEY}:corrupt`, raw); } catch { /* full */ }
    state = emptyState();
  }
  return state;
}

export function get() { return state || load(); }

/** True once the visitor has actually written something worth resuming. */
export function hasProgress() {
  const s = get();
  return Boolean(s.updatedAt) && (s.progress.furthestStep > 0 || Boolean(s.pace));
}

function flush() {
  if (!state) return;
  state.updatedAt = new Date().toISOString();
  state.schema = SCHEMA_VERSION;
  safeWrite(JSON.stringify(state));
  for (const fn of listeners) fn(state);
}

/**
 * Apply a change and autosave. `mutator` receives the live state object.
 * Pass { immediate: true } for things that must not be lost to a fast
 * navigation, such as completing a step.
 */
export function update(mutator, { immediate = false } = {}) {
  const s = get();
  mutator(s);
  if (saveTimer) clearTimeout(saveTimer);
  if (immediate) { flush(); return s; }
  saveTimer = setTimeout(flush, SAVE_DELAY);
  return s;
}

/** Subscribe to saves. Returns an unsubscribe function. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Write any pending change right now (used on pagehide). */
export function flushNow() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; flush(); }
}

if (isBrowser) {
  window.addEventListener("pagehide", flushNow);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushNow();
  });
}

/* ---------- Progress ---------- */

export function markStepComplete(n) {
  return update((s) => {
    const step = Number(n);
    if (!s.progress.completed.includes(step)) {
      s.progress.completed = [...s.progress.completed, step].sort((a, b) => a - b);
    }
    s.progress.furthestStep = Math.max(s.progress.furthestStep, step);
  }, { immediate: true });
}

export function markStepReached(n) {
  return update((s) => {
    s.progress.furthestStep = Math.max(s.progress.furthestStep, Number(n) - 1);
  });
}

/* ---------- Clear, export, import ---------- */

export function clearAll() {
  if (isBrowser) {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${STORAGE_KEY}:corrupt`);
    } catch { /* nothing more we can do */ }
  }
  state = emptyState();
  for (const fn of listeners) fn(state);
  return state;
}

export function exportData() {
  const s = get();
  return { _app: EXPORT_MARKER, _schema: SCHEMA_VERSION, _exportedAt: new Date().toISOString(), data: s };
}

export function downloadJson() {
  if (!isBrowser) return;
  const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `year-well-built-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Import a previously exported file. Returns { ok, error }. */
export function importData(parsed) {
  if (!parsed || typeof parsed !== "object") return { ok: false, error: "That file isn't readable." };
  const payload = parsed._app === EXPORT_MARKER ? parsed.data : parsed;
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "That doesn't look like a Year Well Built file." };
  }
  const { state: next } = migrate(payload);
  state = next;
  flush();
  return { ok: true };
}

export async function importFromFile(file) {
  try {
    const text = await file.text();
    return importData(JSON.parse(text));
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
}
