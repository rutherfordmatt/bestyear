/*
  A whole journey, start to finish, checking every place one step's answers
  feed another — the thing most likely to break quietly.

  Run with: npm test
*/
const R = new URL("../src/lib/", import.meta.url).href;
const { emptyState, repair, emptyGoal, emptyLettingGo } = await import(`${R}schema.js`);
const cf = await import(`${R}carry-forward.js`);
const { sanitizeAnswers } = await import(new URL("../server/sanitize.js", import.meta.url).href);

let fails = 0;
const ok = (label, cond, detail = "") => {
  if (!cond) fails += 1;
  console.log(`${cond ? "  ok  " : "FAIL  "}${label}${detail ? ` — ${detail}` : ""}`);
};

const s = emptyState();

// --- Setup + Step 1 ---
s.pace = "sitting";
s.yearEnding.word = "Rebuilding";
s.step1.wins[0].text = "Had the conversation about my role";
s.step1.wins[0].enabler = "Prepared properly";
s.step1.challenges[0].text = "Project ran six months late";
s.step1.challenges[0].lesson = "I say yes too quickly";
s.step1.wheel.career = 7;
s.step1.wheel.health = 3;
s.step1.wheel.fun = 2;
s.step1.energy.gave = ["Long walks with no phone"];
s.step1.energy.drained = ["Back-to-back video calls", "Saying yes to everything"];

ok("radar plots only rated areas", cf.ratedAreas(s).length === 3);
ok("wheel reported incomplete", cf.wheelComplete(s) === false);
ok("the wheel has eight areas", Object.keys(s.step1.wheel).length === 8);
ok("purpose is one of them", "purpose" in s.step1.wheel);
ok("lowest areas ordered", cf.lowestAreas(s, 2).map((a) => a.key).join(",") === "fun,health",
  cf.lowestAreas(s, 2).map((a) => `${a.key}:${a.score}`).join(" "));

// --- Step 2 ---
s.step2.values = [
  { slug: "integrity", name: "Integrity", source: "finder", alignment: 4 },
  { slug: "family", name: "Family", source: "finder", alignment: 1 },
  { slug: "creativity", name: "Creativity", source: "list", alignment: 2 },
];
ok("value gaps are the 1s and 2s",
  cf.valueGaps(s).map((v) => v.slug).join(",") === "family,creativity");
ok("chosen values get meanings from the shared list",
  cf.chosenValues(s)[0].meaning.length > 0, cf.chosenValues(s)[0].meaning);

// --- Step 3: drainers and gaps should be suggested ---
const sugg = cf.suggestedLettingGo(s);
ok("drainers suggested for letting go",
  sugg.some((x) => x.text === "Back-to-back video calls"));
ok("low-rated values suggested for letting go",
  sugg.filter((x) => x.from.includes("values you rated low")).length === 2);

const lg = emptyLettingGo("habit");
lg.text = "Back-to-back video calls";
s.step2.lettingGo.push(lg);
ok("an added item stops being suggested",
  !cf.suggestedLettingGo(s).some((x) => x.text === "Back-to-back video calls"));

s.step2.closingLine = "I learned to ask for help, eventually.";
// Lessons are no longer their own prompt: they ride on the challenges.
s.step1.challenges[0].lesson = "I do my best work when I protect my mornings";
ok("a lesson comes from its challenge", cf.lessons(s).length === 1);
ok("the lesson remembers what produced it",
  cf.lessonsWithSource(s)[0].from === "Project ran six months late");

// --- Step 4 ---
s.step3.headline = "Left the job that was draining me, and found my weekends again.";
s.step4.word = "Steady";
s.step4.themes[0].text = "Protect my energy";
s.step4.themes[1].text = "Build something of my own";
ok("only filled themes count", cf.themes(s).length === 2);

// --- Step 5: a goal card per theme ---
const pairs = cf.goalsByTheme(s);
ok("one goal slot per theme", pairs.length === 2);
ok("slots start empty", pairs.every((p) => p.goal === null));

const g1 = emptyGoal(s.step4.themes[0].id);
Object.assign(g1, { done: "Ten paying customers", valueSlug: "creativity",
  why: "I want to make something that's mine", date: "2027-06-30",
  habit: "Two hours every Saturday", firstStep: "Talk to three people" });
const g2 = emptyGoal(s.step4.themes[1].id);
Object.assign(g2, { done: "Sleep seven hours a night", valueSlug: "family", habit: "Bed by eleven" });
s.step5.goals.push(g1, g2);
s.step5.priorityGoalId = g2.id;

ok("goals follow theme order", cf.goals(s).map((g) => g.done)[0] === "Ten paying customers");
ok("priority goal leads the document",
  cf.goalsForDocument(s)[0].done === "Sleep seven hours a night");
ok("goal resolves its theme", cf.themeOf(s, g1).text === "Protect my energy");
ok("goal resolves its value", cf.valueOf(g1).name === "Creativity");

// --- Step 6 ---
s.step6.ifThen[g1.id] = { if: "...work runs late on a Friday,", then: "...do one hour on Sunday" };
s.step6.corner.who = ["coach", "friend"];
s.step6.corner.ask = "Ask Sam to check in monthly";
ok("if-then pairs attach to goals", cf.ifThenPairs(s).length === 1);
ok("coach touchpoint triggers", cf.wantsCoach(s) === true);

// --- Step 7 ---
s.step7.noteToFutureSelf = "Go gently, and keep going.";
s.step7.checkIns = ["2027-01-03", "2027-04-03"];

// --- Completeness drives the plan panel ---
const filled = [1, 2, 3, 4, 5, 6, 7].filter((n) => cf.stepHasContent(s, n));
ok("plan panel sees all seven steps filled", filled.length === 7, `got ${filled.join(",")}`);

// --- "Added to your plan" ---
ok("step 3 summary names the headline",
  cf.addedInStep(s, 3).some((x) => x.label === "Your headline"));
ok("step 4 summary names the word",
  cf.addedInStep(s, 4).some((x) => x.label === "Your word"));
ok("step 2 summary lists the gaps",
  cf.addedInStep(s, 2).find((x) => x.label === "Gaps to watch")?.detail === "Family, Creativity");

// --- Editing an earlier answer must not orphan what depends on it ---
s.step4.themes[0].text = "Protect my energy, properly";
ok("renaming a theme keeps its goal attached",
  cf.themeOf(s, g1).text === "Protect my energy, properly");

// --- Deleting a theme should orphan its goal cleanly, not crash ---
const before = JSON.parse(JSON.stringify(s));
before.step4.themes[0].text = "";
const repaired = repair(before);
ok("repair survives a cleared theme", repaired.step5.goals.length === 2);
ok("repair keeps the priority goal", repaired.step5.priorityGoalId === g2.id);

// --- Round trip through the server validator ---
const clean = sanitizeAnswers(s);
ok("server accepts a full plan", clean !== null);
ok("server resolves theme names", clean.goals.some((g) => g.theme === "Protect my energy, properly"));
ok("server resolves value names", clean.goals.some((g) => g.value === "Creativity"));
ok("server puts the priority goal first", clean.goals[0].priority === true);
ok("server carries the if-then onto its goal",
  clean.goals.find((g) => g.done === "Ten paying customers").ifThen.then.includes("Sunday"));
ok("server drops unrated wheel areas", clean.wheel.money === null && clean.wheel.career === 7);

// --- Resume: a round trip through JSON must change nothing ---
const roundTripped = repair(JSON.parse(JSON.stringify(s)));
ok("round trip preserves the headline", roundTripped.step3.headline === s.step3.headline);
ok("round trip preserves goal ids", roundTripped.step5.goals[0].id === g1.id);
ok("round trip preserves if-then keys",
  Object.keys(roundTripped.step6.ifThen)[0] === g1.id);

console.log(fails ? `\n${fails} FAILED` : "\nAll journey checks passed.");
process.exit(fails ? 1 : 0);
