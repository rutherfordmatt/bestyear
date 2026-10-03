/*
  Answers carry forward without retyping. Every "From Step N" card and every
  pre-filled card on a later step is derived here, from ids rather than text,
  so editing an earlier answer updates what depends on it instead of orphaning it.
*/

import { LIFE_AREAS } from "./steps.js";
import { BY_SLUG } from "./values.js";

const filled = (s) => Boolean(s && String(s).trim());

/* ---------- Step 1 ---------- */

export function wins(s) {
  return s.step1.wins.filter((w) => filled(w.text));
}

export function challenges(s) {
  return s.step1.challenges.filter((c) => filled(c.text));
}

export function energyDrainers(s) {
  return s.step1.energy.drained.filter(filled);
}

export function energyGivers(s) {
  return s.step1.energy.gave.filter(filled);
}

/** Only areas the visitor actually rated. The radar plots these alone. */
export function ratedAreas(s) {
  return LIFE_AREAS
    .map((a) => ({ ...a, score: s.step1.wheel[a.key] }))
    .filter((a) => typeof a.score === "number");
}

export function wheelComplete(s) {
  return ratedAreas(s).length === LIFE_AREAS.length;
}

/** The weakest rated areas, for Step 4's "what would a 7 or 8 look like?". */
export function lowestAreas(s, count = 2) {
  return [...ratedAreas(s)].sort((a, b) => a.score - b.score).slice(0, count);
}

/* ---------- Step 2 ---------- */

export function chosenValues(s) {
  return s.step2.values.map((v) => ({
    ...v,
    meaning: v.meaning || BY_SLUG[v.slug]?.meaning || "",
    family: v.family || BY_SLUG[v.slug]?.family || "Your own",
  }));
}

/**
 * A "gap" is a value that matters but barely showed up: alignment of 1 or 2
 * out of 5. These are highlighted in Step 2 and carried into Step 4's themes.
 */
export const GAP_THRESHOLD = 2;

export function valueGaps(s) {
  return chosenValues(s).filter(
    (v) => typeof v.alignment === "number" && v.alignment <= GAP_THRESHOLD
  );
}

/* ---------- Step 3 ---------- */

export function lessons(s) {
  return s.step3.lessons.filter(filled);
}

export function lettingGo(s) {
  return s.step3.lettingGo.filter((l) => filled(l.text));
}

/** Drainers the visitor hasn't already added to their letting-go list. */
export function suggestedLettingGo(s) {
  const already = new Set(lettingGo(s).map((l) => l.text.trim().toLowerCase()));
  return [
    ...energyDrainers(s).map((text) => ({ text, from: "Step 1 · energy drainers" })),
    ...valueGaps(s).map((v) => ({
      text: `Whatever pulled me away from ${v.name.toLowerCase()}`,
      from: "Step 2 · value gaps",
    })),
  ].filter((item) => !already.has(item.text.trim().toLowerCase()));
}

/* ---------- Step 4 ---------- */

export function themes(s) {
  return s.step4.themes.filter((t) => filled(t.text));
}

/* ---------- Step 5 ---------- */

/**
 * One goal card per theme, created on demand. Themes with no goal yet get a
 * blank card so Step 5 is never an empty page.
 */
export function goalsByTheme(s) {
  const byTheme = new Map(s.step5.goals.map((g) => [g.themeId, g]));
  return themes(s).map((theme) => ({ theme, goal: byTheme.get(theme.id) || null }));
}

export function goals(s) {
  const order = new Map(themes(s).map((t, i) => [t.id, i]));
  return [...s.step5.goals]
    .filter((g) => filled(g.done) || filled(g.habit) || filled(g.firstStep))
    .sort((a, b) => (order.get(a.themeId) ?? 99) - (order.get(b.themeId) ?? 99));
}

export function priorityGoal(s) {
  return s.step5.goals.find((g) => g.id === s.step5.priorityGoalId) || null;
}

/** Priority goal first — the order the vision document uses. */
export function goalsForDocument(s) {
  const all = goals(s);
  const priority = all.find((g) => g.id === s.step5.priorityGoalId);
  if (!priority) return all;
  return [priority, ...all.filter((g) => g.id !== priority.id)];
}

export function themeOf(s, goal) {
  return themes(s).find((t) => t.id === goal?.themeId) || null;
}

export function valueOf(goal) {
  if (!goal?.valueSlug) return null;
  return BY_SLUG[goal.valueSlug] || { slug: goal.valueSlug, name: goal.valueSlug };
}

/* ---------- Step 6 ---------- */

export function ifThenFor(s, goalId) {
  return s.step6.ifThen[goalId] || { if: "", then: "" };
}

export function ifThenPairs(s) {
  return goals(s)
    .map((goal) => ({ goal, pair: ifThenFor(s, goal.id) }))
    .filter(({ pair }) => filled(pair.if) || filled(pair.then));
}

export function wantsCoach(s) {
  return s.step6.corner.who.includes("coach");
}

/* ---------- Completeness, for the plan panel ---------- */

/** Has this step got enough in it to count as done? */
export function stepHasContent(s, n) {
  switch (Number(n)) {
    case 1: return wins(s).length > 0 || challenges(s).length > 0 || ratedAreas(s).length > 0;
    case 2: return chosenValues(s).length > 0;
    case 3: return lessons(s).length > 0 || lettingGo(s).length > 0 || filled(s.step3.closingLine);
    case 4: return filled(s.step4.headline) || filled(s.step4.word) || themes(s).length > 0;
    case 5: return goals(s).length > 0;
    case 6: return ifThenPairs(s).length > 0 || s.step6.corner.who.length > 0;
    case 7: return filled(s.step7.noteToFutureSelf) || s.step7.checkIns.length > 0;
    default: return false;
  }
}

/** What landed on the document during this step — the "Added to your plan" moment. */
export function addedInStep(s, n) {
  const out = [];
  const add = (label, detail) => { if (detail) out.push({ label, detail }); };

  switch (Number(n)) {
    case 1:
      add("Your wins", wins(s).length ? `${wins(s).length} recorded` : "");
      add("Your challenges", challenges(s).length ? `${challenges(s).length} recorded` : "");
      add("Life wheel", ratedAreas(s).length ? `${ratedAreas(s).length} of ${LIFE_AREAS.length} areas rated` : "");
      add("Energy audit", energyGivers(s).length || energyDrainers(s).length
        ? `${energyGivers(s).length} giving, ${energyDrainers(s).length} draining` : "");
      break;
    case 2:
      add("Your values", chosenValues(s).length ? chosenValues(s).map((v) => v.name).join(", ") : "");
      add("Gaps to watch", valueGaps(s).length ? valueGaps(s).map((v) => v.name).join(", ") : "");
      break;
    case 3:
      add("Lessons", lessons(s).length ? `${lessons(s).length} carried forward` : "");
      add("Leaving behind", lettingGo(s).length ? `${lettingGo(s).length} named` : "");
      add("Closing line", s.step3.closingLine);
      break;
    case 4:
      add("Your headline", s.step4.headline);
      add("Your word", s.step4.word);
      add("Your themes", themes(s).length ? themes(s).map((t) => t.text).join(" · ") : "");
      break;
    case 5:
      add("Goals", goals(s).length ? `${goals(s).length} set` : "");
      add("Priority", priorityGoal(s)?.done || "");
      break;
    case 6:
      add("If-then plans", ifThenPairs(s).length ? `${ifThenPairs(s).length} ready` : "");
      add("In your corner", s.step6.corner.who.length ? `${s.step6.corner.who.length} chosen` : "");
      break;
    case 7:
      add("Note to future self", s.step7.noteToFutureSelf);
      add("Check-ins", s.step7.checkIns.length ? `${s.step7.checkIns.length} dates set` : "");
      break;
  }
  return out;
}
