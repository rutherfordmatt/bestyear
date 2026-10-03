// The shape of everything a visitor writes. This object never leaves the
// browser except when they explicitly ask for it (email, or JSON download).

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = "ywb:v1";
export const EXPORT_MARKER = "yearwellbuilt";

export const LIFE_AREA_KEYS = ["career", "health", "relationships", "money", "growth", "fun"];

/** Short, stable ids for repeatable items. Carry-forward matches on these,
 *  never on text, so editing an answer can't orphan what depends on it. */
export function newId(prefix = "i") {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${rand}`;
}

export const emptyWin = () => ({ id: newId("win"), text: "", enabler: "" });
export const emptyChallenge = () => ({ id: newId("ch"), text: "", lesson: "" });
export const emptyTheme = () => ({ id: newId("th"), text: "" });
export const emptyLettingGo = (bucket = "habit") => ({
  id: newId("lg"), text: "", bucket, releasedAt: null,
});
export const emptyGoal = (themeId = null) => ({
  id: newId("goal"), themeId,
  done: "", valueSlug: null, why: "", date: "", habit: "", firstStep: "",
});

export function emptyState() {
  return {
    schema: SCHEMA_VERSION,
    updatedAt: null,
    pace: null,
    progress: { furthestStep: 0, completed: [] },
    yearEnding: { word: "" },
    step1: {
      wins: [emptyWin(), emptyWin(), emptyWin()],
      challenges: [emptyChallenge(), emptyChallenge(), emptyChallenge()],
      // null means "not answered yet". The radar plots only answered areas.
      wheel: Object.fromEntries(LIFE_AREA_KEYS.map((k) => [k, null])),
      energy: { gave: [], drained: [] },
    },
    step2: { values: [], compromise: "" },
    step3: { lessons: ["", "", ""], lettingGo: [], closingLine: "" },
    step4: { headline: "", detail: "", word: "", themes: [emptyTheme(), emptyTheme(), emptyTheme()] },
    step5: { goals: [], priorityGoalId: null },
    step6: { ifThen: {}, corner: { who: [], ask: "" } },
    step7: { overrides: {}, noteToFutureSelf: "", livesAt: "", checkIns: [] },
  };
}

/* ---------- Validation and repair ----------
   Anything loaded from localStorage or an imported file is untrusted: it may
   be hand-edited, from an older build, or simply corrupt. Repair to a valid
   shape rather than throwing, so a visitor never loses everything to one bad
   field. */

const str = (v, max = 2000) => (typeof v === "string" ? v.slice(0, max) : "");
const bounded = (v, lo, hi) => {
  // null/undefined/"" mean "not answered". Number() turns them into 0, which
  // would clamp to lo and invent an answer the visitor never gave.
  if (v === null || v === undefined || v === "" || typeof v === "boolean") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : null;
};
const arr = (v, max = 50) => (Array.isArray(v) ? v.slice(0, max) : []);

function repairList(list, repairItem, { min = 0, max = 20, factory } = {}) {
  const out = arr(list, max).map(repairItem).filter(Boolean);
  while (out.length < min && factory) out.push(factory());
  return out;
}

export function repair(input) {
  const base = emptyState();
  if (!input || typeof input !== "object") return base;

  const s = { ...base };
  s.updatedAt = typeof input.updatedAt === "string" ? input.updatedAt : null;
  s.pace = ["sitting", "daily"].includes(input.pace) ? input.pace : null;

  const prog = input.progress || {};
  s.progress = {
    furthestStep: bounded(prog.furthestStep, 0, 7) ?? 0,
    completed: [...new Set(arr(prog.completed, 7).map((n) => bounded(n, 1, 7)).filter(Boolean))].sort(),
  };

  s.yearEnding = { word: str(input.yearEnding?.word, 120) };

  const i1 = input.step1 || {};
  s.step1 = {
    wins: repairList(i1.wins, (w) => w && typeof w === "object"
      ? { id: str(w.id, 40) || newId("win"), text: str(w.text, 500), enabler: str(w.enabler, 500) }
      : null, { min: 3, max: 10, factory: emptyWin }),
    challenges: repairList(i1.challenges, (c) => c && typeof c === "object"
      ? { id: str(c.id, 40) || newId("ch"), text: str(c.text, 500), lesson: str(c.lesson, 500) }
      : null, { min: 3, max: 10, factory: emptyChallenge }),
    wheel: Object.fromEntries(
      LIFE_AREA_KEYS.map((k) => [k, bounded(i1.wheel?.[k], 1, 10)])
    ),
    energy: {
      gave: repairList(i1.energy?.gave, (t) => str(t, 300) || null, { max: 20 }),
      drained: repairList(i1.energy?.drained, (t) => str(t, 300) || null, { max: 20 }),
    },
  };

  const i2 = input.step2 || {};
  s.step2 = {
    values: repairList(i2.values, (v) => {
      if (!v || typeof v !== "object" || !v.slug) return null;
      return {
        slug: str(v.slug, 60),
        name: str(v.name, 60) || str(v.slug, 60),
        source: ["finder", "list", "custom"].includes(v.source) ? v.source : "list",
        alignment: bounded(v.alignment, 1, 5),
      };
    }, { max: 8 }),
    compromise: str(i2.compromise, 1500),
  };

  const i3 = input.step3 || {};
  s.step3 = {
    lessons: [0, 1, 2].map((i) => str(arr(i3.lessons, 3)[i], 500)),
    lettingGo: repairList(i3.lettingGo, (l) => l && typeof l === "object"
      ? {
          id: str(l.id, 40) || newId("lg"),
          text: str(l.text, 300),
          bucket: ["habit", "commitment", "should"].includes(l.bucket) ? l.bucket : "habit",
          releasedAt: typeof l.releasedAt === "string" ? l.releasedAt : null,
        }
      : null, { max: 30 }),
    closingLine: str(i3.closingLine, 400),
  };

  const i4 = input.step4 || {};
  s.step4 = {
    headline: str(i4.headline, 300),
    detail: str(i4.detail, 2000),
    word: str(i4.word, 60),
    themes: repairList(i4.themes, (t) => t && typeof t === "object"
      ? { id: str(t.id, 40) || newId("th"), text: str(t.text, 200) }
      : null, { min: 3, max: 3, factory: emptyTheme }),
  };

  const themeIds = new Set(s.step4.themes.map((t) => t.id));
  const i5 = input.step5 || {};
  s.step5 = {
    goals: repairList(i5.goals, (g) => g && typeof g === "object"
      ? {
          id: str(g.id, 40) || newId("goal"),
          themeId: themeIds.has(g.themeId) ? g.themeId : null,
          done: str(g.done, 500),
          valueSlug: g.valueSlug ? str(g.valueSlug, 60) : null,
          why: str(g.why, 500),
          date: str(g.date, 40),
          habit: str(g.habit, 400),
          firstStep: str(g.firstStep, 400),
        }
      : null, { max: 3 }),
    priorityGoalId: null,
  };
  const goalIds = new Set(s.step5.goals.map((g) => g.id));
  if (goalIds.has(i5.priorityGoalId)) s.step5.priorityGoalId = i5.priorityGoalId;

  const i6 = input.step6 || {};
  const ifThen = {};
  for (const [goalId, pair] of Object.entries(i6.ifThen || {})) {
    if (!goalIds.has(goalId) || !pair || typeof pair !== "object") continue;
    ifThen[goalId] = { if: str(pair.if, 500), then: str(pair.then, 500) };
  }
  s.step6 = {
    ifThen,
    corner: {
      who: arr(i6.corner?.who, 6).map((w) => str(w, 40)).filter(Boolean),
      ask: str(i6.corner?.ask, 800),
    },
  };

  const i7 = input.step7 || {};
  const overrides = {};
  for (const [k, v] of Object.entries(i7.overrides || {})) {
    if (typeof v === "string") overrides[str(k, 80)] = v.slice(0, 2000);
  }
  s.step7 = {
    overrides,
    noteToFutureSelf: str(i7.noteToFutureSelf, 500),
    livesAt: str(i7.livesAt, 120),
    checkIns: repairList(i7.checkIns, (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null), { max: 8 }),
  };

  return s;
}

/** Migrate older saves forward. Each step is one version hop. */
export function migrate(input) {
  if (!input || typeof input !== "object") return { state: emptyState(), migrated: false };
  const version = Number(input.schema) || 0;

  if (version > SCHEMA_VERSION) {
    // A save from a newer build. Repair what we understand rather than wipe it.
    return { state: repair(input), migrated: false, fromFuture: true };
  }

  let data = input;
  // No migrations yet — version 1 is the first public schema.
  // Future hops go here:  if (version < 2) { data = v1ToV2(data); }

  return { state: repair(data), migrated: version !== SCHEMA_VERSION };
}
