/*
  Server-side validation of the answers posted to /send.

  The browser posts the answers as JSON. We never trust it: every field is
  type-checked, length-capped and control characters stripped. Anything we
  don't recognise is dropped. What comes out of here is the ONLY thing the
  email template is allowed to render.

  Patterned on the Values Finder's server/sanitize.js.
*/

// Strip control characters, keeping tab and newline out of single-line fields.
const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F]/g;

const text = (v, max) => String(v ?? "").replace(CONTROL, "").trim().slice(0, max);

const int = (v, lo, hi) => {
  if (v === null || v === undefined || v === "" || typeof v === "boolean") return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null;
};

const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);

const isoDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : null);

export const LIFE_AREA_KEYS = ["career", "money", "health", "fun", "family", "friends", "growth", "purpose"];
const BUCKETS = ["habit", "commitment", "should"];
const CORNER_KEYS = ["partner", "friend", "colleague", "coach", "group", "alone"];

/**
 * Validate a posted answers object.
 * Returns a clean object, or null when there's nothing worth emailing.
 */
export function sanitizeAnswers(input) {
  if (!input || typeof input !== "object") return null;

  const step1 = input.step1 || {};
  const step2 = input.step2 || {};
  const step3 = input.step3 || {};
  const step4 = input.step4 || {};
  const step5 = input.step5 || {};
  const step6 = input.step6 || {};
  const step7 = input.step7 || {};

  const out = {
    yearEndingWord: text(input.yearEnding?.word, 120),

    wins: list(step1.wins, 10)
      .map((w) => ({ text: text(w?.text, 500), enabler: text(w?.enabler, 500) }))
      .filter((w) => w.text),
    challenges: list(step1.challenges, 10)
      .map((c) => ({ text: text(c?.text, 500), lesson: text(c?.lesson, 500) }))
      .filter((c) => c.text),
    wheel: Object.fromEntries(
      LIFE_AREA_KEYS.map((k) => [k, int(step1.wheel?.[k], 1, 10)])
    ),
    energy: {
      gave: list(step1.energy?.gave, 20).map((t) => text(t, 300)).filter(Boolean),
      drained: list(step1.energy?.drained, 20).map((t) => text(t, 300)).filter(Boolean),
    },

    values: list(step2.values, 8)
      .map((v) => ({ name: text(v?.name, 60), alignment: int(v?.alignment, 1, 5) }))
      .filter((v) => v.name),
    compromise: text(step2.compromise, 1500),

    // A lesson is what a challenge taught you, captured on the challenge.
    lessons: list(step1.challenges, 3).map((c) => text(c?.lesson, 500)).filter(Boolean),
    lettingGo: list(step2.lettingGo, 30)
      .map((l) => ({
        text: text(l?.text, 300),
        bucket: BUCKETS.includes(l?.bucket) ? l.bucket : "habit",
        released: Boolean(l?.releasedAt),
      }))
      .filter((l) => l.text),
    closingLine: text(step2.closingLine, 400),

    headline: text(step3.headline, 300),
    detail: text(step3.detail, 2000),
    word: text(step4.word, 60),
    themes: list(step4.themes, 3).map((t) => text(t?.text, 200)).filter(Boolean),

    goals: [],
    corner: {
      who: list(step6.corner?.who, 6).filter((k) => CORNER_KEYS.includes(k)),
      ask: text(step6.corner?.ask, 800),
    },

    noteToFutureSelf: text(step7.noteToFutureSelf, 500),
    livesAt: text(step7.livesAt, 120),
    checkIns: list(step7.checkIns, 8).map(isoDate).filter(Boolean),
  };

  // Goals, with their theme, value and if-then plan resolved server-side.
  const themeText = new Map(
    list(step4.themes, 3).map((t) => [text(t?.id, 40), text(t?.text, 200)])
  );
  const valueName = new Map(
    list(step2.values, 8).map((v) => [text(v?.slug, 60), text(v?.name, 60)])
  );
  const priorityId = text(step5.priorityGoalId, 40);

  out.goals = list(step5.goals, 3)
    .map((g) => {
      const id = text(g?.id, 40);
      const pair = (step6.ifThen || {})[id] || {};
      return {
        done: text(g?.done, 500),
        theme: themeText.get(text(g?.themeId, 40)) || "",
        value: valueName.get(text(g?.valueSlug, 60)) || text(g?.valueSlug, 60),
        why: text(g?.why, 500),
        date: text(g?.date, 40),
        habit: text(g?.habit, 400),
        firstStep: text(g?.firstStep, 400),
        priority: Boolean(id) && id === priorityId,
        ifThen: { if: text(pair.if, 500), then: text(pair.then, 500) },
      };
    })
    .filter((g) => g.done || g.habit || g.firstStep);

  // Priority goal leads the document.
  out.goals.sort((a, b) => Number(b.priority) - Number(a.priority));

  const hasSomething =
    out.headline || out.word || out.goals.length || out.values.length ||
    out.themes.length || out.lessons.length || out.wins.length;

  return hasSomething ? out : null;
}

export const isEmail = (s) =>
  typeof s === "string" && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
