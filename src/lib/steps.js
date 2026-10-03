// The journey: four phases, seven steps, plus setup and close.
// Minutes are rough and only used for "about N min left" on the progress rail.

export const PHASES = [
  { id: "lookback", name: "Look back", steps: [1, 2, 3] },
  { id: "turn", name: "Turn", steps: [4] },
  { id: "plan", name: "Plan", steps: [5, 6] },
  { id: "commit", name: "Commit", steps: [7] },
];

export const STEPS = [
  { n: 1, slug: "the-year-you-had", title: "The year you had", short: "The year you had", phase: "lookback", minutes: 12 },
  { n: 2, slug: "what-matters", title: "What matters", short: "What matters", phase: "lookback", minutes: 10 },
  { n: 3, slug: "lessons-and-letting-go", title: "Lessons and letting go", short: "Lessons", phase: "lookback", minutes: 8 },
  { n: 4, slug: "imagine-the-year-ahead", title: "Imagine the year ahead", short: "Imagine", phase: "turn", minutes: 10 },
  { n: 5, slug: "goals", title: "Goals", short: "Goals", phase: "plan", minutes: 12 },
  { n: 6, slug: "obstacles-and-support", title: "Obstacles and support", short: "Obstacles", phase: "plan", minutes: 8 },
  { n: 7, slug: "your-year-on-one-page", title: "Your year, on one page", short: "One page", phase: "commit", minutes: 8 },
];

export const TOTAL_STEPS = STEPS.length;
export const SETUP_MINUTES = 2;

export const stepByNumber = (n) => STEPS.find((s) => s.n === Number(n)) || null;
export const phaseOf = (n) => PHASES.find((p) => p.steps.includes(Number(n))) || null;

export const pathForStep = (n) => `/step/${n}`;

/** Rough minutes remaining from the start of step n (inclusive). */
export function minutesFrom(n) {
  return STEPS.filter((s) => s.n >= Number(n)).reduce((t, s) => t + s.minutes, 0);
}

/** Minutes left given the set of completed steps. */
export function minutesLeft(completed = []) {
  const done = new Set(completed.map(Number));
  return STEPS.filter((s) => !done.has(s.n)).reduce((t, s) => t + s.minutes, 0);
}

/** "about 25 min left", or null once there's nothing meaningful left. */
export function timeLeftLabel(completed = []) {
  const mins = minutesLeft(completed);
  if (mins <= 0) return null;
  const rounded = mins >= 20 ? Math.round(mins / 5) * 5 : mins;
  return `about ${rounded} min left`;
}

export const LIFE_AREAS = [
  { key: "career", name: "Career", blurb: "Your work, your progress, and whether it still fits" },
  { key: "health", name: "Health", blurb: "Sleep, movement, food and how your body feels" },
  { key: "relationships", name: "Relationships", blurb: "Partner, family, friends and the people you lean on" },
  { key: "money", name: "Money", blurb: "How secure and in control you feel, not how much you have" },
  { key: "growth", name: "Growth", blurb: "Learning, curiosity and becoming more of who you want to be" },
  { key: "fun", name: "Fun", blurb: "Play, rest, adventure and things done purely for joy" },
];

export const LETTING_GO_BUCKETS = [
  { key: "habit", name: "Habits", label: "Habits I'm stopping" },
  { key: "commitment", name: "Commitments", label: "Commitments I'm stepping back from" },
  { key: "should", name: '"Shoulds"', label: `"Shoulds" I'm done carrying` },
];

export const CORNER_OPTIONS = [
  { key: "partner", name: "A partner" },
  { key: "friend", name: "A friend" },
  { key: "colleague", name: "A colleague or mentor" },
  { key: "coach", name: "A coach" },
  { key: "group", name: "A group or community" },
  { key: "alone", name: "Just me for now" },
];
