/*
  Walk the whole journey as a visitor: every step is a deck of cards, so this
  moves through them the way a person does — Next, Next, Next — and checks
  what was typed survives, carries forward, and reaches the document.
*/
import { connect } from "./cdp.mjs";

const BASE = "http://localhost:4321";
const c = await connect();
await c.viewport(1280, 1100);

let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ok   ${label}`); }
  else { fail++; console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`); }
};

/* Poll for rendered elements instead of sleeping a guessed number of
   milliseconds: the scored rows arrive a render after the chips are
   clicked, and a fixed wait made the step-2 scoring flaky. */
const waitFor = async (sel, count = 1, ms = 4000) => {
  const until = Date.now() + ms;
  for (;;) {
    const n = await c.evaluate(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
    if (n >= count) return n;
    if (Date.now() > until) throw new Error(`timed out waiting for ${count}× ${sel} (saw ${n})`);
    await new Promise((r) => setTimeout(r, 100));
  }
};

const HELPERS = `
  window.__t = {
    has: (s) => document.body.textContent.includes(s),
    count: (sel) => document.querySelectorAll(sel).length,
    cardRef: () => document.querySelector(".deck-card:not([inert]) .card-ref")?.textContent || "",
    cardTitle: () => document.querySelector(".deck-card:not([inert]) h2")?.textContent || "",
    cards: () => document.querySelectorAll(".deck-card").length,
    next: () => { const b = document.querySelector(".deck-nav .btn.primary"); if (b) b.click(); return !!b; },
    typeLabel: (label, value) => {
      const el = [...document.querySelectorAll(".deck-card:not([inert]) input, .deck-card:not([inert]) textarea")]
        .find((e) => e.getAttribute("aria-label") === label || e.labels?.[0]?.textContent.trim() === label);
      if (!el) return "no field: " + label;
      el.focus(); el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true })); el.blur();
      return "ok";
    },
    type: (sel, value, i = 0) => {
      const el = document.querySelectorAll(".deck-card:not([inert]) " + sel)[i];
      if (!el) return "no element: " + sel;
      el.focus(); el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true })); el.blur();
      return "ok";
    },
    click: (sel, i = 0) => {
      const el = document.querySelectorAll(".deck-card:not([inert]) " + sel)[i];
      if (el) { el.click(); return "ok"; } return "no element: " + sel;
    },
    range: (i, value) => {
      const el = document.querySelectorAll('.deck-card:not([inert]) input[type="range"]')[i];
      if (!el) return "no slider";
      el.value = String(value); el.dispatchEvent(new Event("input", { bubbles: true }));
      return "ok";
    },
    store: () => JSON.parse(localStorage.getItem("ywb:v1") || "null"),
  };
`;
const go = async (path, settle = 1100) => { await c.goto(BASE + path, settle); await c.evaluate(HELPERS); };
const next = async (ms = 650) => { await c.evaluate(`__t.next()`); await new Promise((r) => setTimeout(r, ms)); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/*
  A guard for the bug where one Next moved two cards: focusing the new card's
  heading scrolled the overflow:hidden viewport, so the transform moved one
  card and the scroll moved another.
*/
async function advancesExactlyOne(path, expected) {
  await go(path);
  const before = await c.evaluate(`__t.cardRef()`);
  await next(800);
  const after = await c.evaluate(`__t.cardRef()`);
  const aligned = await c.evaluate(`(() => {
    const vp = document.querySelector(".deck-viewport");
    const a = document.querySelector(".deck-card:not([inert])");
    return Math.round(a.getBoundingClientRect().left) === Math.round(vp.getBoundingClientRect().left)
      && vp.scrollLeft === 0;
  })()`);
  ok(`${path}: Next moves exactly one card (${before} → ${after})`, after === expected, `got ${after}`);
  ok(`${path}: the card on screen is the active one`, aligned);
}

console.log("=== ONE CLICK, ONE CARD ===");
for (const [path, expected] of [["/setup", "0.2"], ["/step/1", "1.2"], ["/step/7", "7.2"]]) {
  await c.goto(BASE + path, 900);
  await c.evaluate(`localStorage.clear()`);
  await advancesExactlyOne(path, expected);
}

console.log("\n=== SETUP ===");
await go("/setup");
await c.evaluate(`localStorage.clear()`);
await go("/setup");
ok("opens on 0.1, the pace", (await c.evaluate(`__t.cardRef()`)) === "0.1");
ok("0.1 carries the framing too", await c.evaluate(`__t.has("Before we start")`));
ok("the welcome is not a card of its own", (await c.evaluate(`__t.has("Two quick choices")`)) === false);
await c.evaluate(`__t.click(".pace-option", 0)`);
await wait(400);
await next();
ok("card 0.2 asks for the word", (await c.evaluate(`__t.cardRef()`)) === "0.2");
await c.evaluate(`__t.typeLabel("Sum up the year you've just had in a word or short phrase.", "Rebuilding")`);
await wait(700);
/* Typing the word appends the hand-over card. The deck must not move for
   that: when the slide distance was a fraction of the track's width, a card
   arriving mid-deck changed the fraction and the deck slid away and back
   while you typed. */
ok("the deck stays put when a card is added mid-typing", await c.evaluate(`(() => {
  const vp = document.querySelector(".deck-viewport").getBoundingClientRect();
  const a = document.querySelector(".deck-card:not([inert])").getBoundingClientRect();
  return Math.round(a.left - vp.left) === 0;
})()`));
ok("the hand-over card has appeared", (await c.evaluate(`document.querySelectorAll(".deck-dot").length`)) === 3);

const setupStore = await c.evaluate(`__t.store()`);
ok("pace saved", setupStore?.pace === "sitting");
ok("word saved", setupStore?.yearEnding?.word === "Rebuilding");

console.log("\n=== STEP 1 ===");
await go("/step/1");
ok("opens on 1.1, the scene", (await c.evaluate(`__t.cardRef()`)) === "1.1");
await next();
ok("1.2 is the wins question", await c.evaluate(`__t.has("What went well")`));
await c.evaluate(`__t.typeLabel("Win 1", "Had the conversation about my role")`);
await c.evaluate(`__t.typeLabel("What made win 1 possible?", "I prepared properly")`);
await wait(500);
await next();
ok("1.3 is the challenges question", await c.evaluate(`__t.has("What was hardest")`));
await c.evaluate(`__t.typeLabel("Challenge 1", "A project that ran late")`);
await c.evaluate(`__t.typeLabel("What challenge 1 taught you", "I say yes too quickly")`);
await wait(500);
await next();
ok("1.4 is the energy audit", await c.evaluate(`__t.has("What gave you energy")`));
await c.evaluate(`__t.typeLabel("Things that gave you energy, item 1", "Long walks")`);
await c.evaluate(`__t.typeLabel("Things that drained your energy, item 1", "Back-to-back video calls")`);
await wait(500);
await next();
ok("1.5 is the wheel, last", await c.evaluate(`__t.has("Where has all that left you")`));
ok("the wheel has eight sliders", (await c.evaluate(`__t.count('input[type="range"]')`)) === 8);
await c.evaluate(`__t.range(0, 7)`);
await c.evaluate(`__t.range(2, 3)`);
await wait(500);
ok("radar plots only rated areas", (await c.evaluate(`__t.count(".wheel-point")`)) === 2);
await next();
ok("the deck ends on the summary", await c.evaluate(`__t.has("Added to your plan")`));
const s1 = await c.evaluate(`__t.store()`);
ok("schema is version 2", s1.schema === 2);
ok("wheel keeps nulls for unrated areas", s1.step1.wheel.career === 7 && s1.step1.wheel.family === null);
ok("the lesson rides on its challenge", s1.step1.challenges[0].lesson === "I say yes too quickly");

console.log("\n=== STEP 2 ===");
await go("/step/2");
await next();
ok("2.2 is the values panel", await c.evaluate(`__t.has("Choose the six to eight values")`));
ok("picking and scoring are side by side",
  await c.evaluate(`!!document.querySelector(".values-pick") && !!document.querySelector(".values-chosen")`));
await wait(1200);
for (let i = 0; i < 6; i++) await c.evaluate(`__t.click(".chips .chip", ${i})`);
await wait(400);
ok("six values chosen", (await c.evaluate(`__t.store()`)).step2.values.length === 6);
// The same slider as the life wheel. First value scored 2, so it reads as a
// gap; the rest a 4.
await waitFor('.deck-card:not([inert]) .scored-value input[type="range"]', 6);
await c.evaluate(`__t.range(0, 2)`);
for (let i = 1; i < 6; i++) await c.evaluate(`__t.range(${i}, 4)`);
await wait(500);
await next();
ok("2.3 asks where you compromised", await c.evaluate(`__t.has("Where did you compromise")`));
await c.evaluate(`__t.type("textarea", "Worked most weekends")`);
await wait(400);
await next();
ok("2.4 is what you're leaving behind", await c.evaluate(`__t.has("leaving behind")`));
ok("the step 1 drainer is offered", await c.evaluate(`__t.has("Back-to-back video calls")`));
await next();
ok("2.5 is the closing line, a moment", await c.evaluate(`__t.has("last line be")`));
ok("moment cards get their own treatment",
  (await c.evaluate(`__t.count(".is-moment")`)) >= 1);
await c.evaluate(`__t.type(".moment-input", "I learned to ask for help, eventually.")`);
await wait(600);

console.log("\n=== STEPS 3 AND 4 ===");
await go("/step/3");
await next();
ok("3.2 is the headline, a moment", await c.evaluate(`__t.has("Write the headline")`));
await c.evaluate(`__t.type(".moment-input", "Left the job that was draining me")`);
await wait(600);
await next();
ok("3.3 is the detail, with the lowest areas alongside", await c.evaluate(`__t.has("From Step 1")`));
ok("headline saved", (await c.evaluate(`__t.store()`)).step3.headline.includes("Left the job"));

await go("/step/4");
ok("4.1 recalls the headline", await c.evaluate(`__t.has("Left the job that was draining me")`));
await next();
ok("4.2 is the word, a moment", await c.evaluate(`__t.has("one word for the year")`));
await c.evaluate(`__t.type(".moment-input", "Steady")`);
await wait(600);
await next();
ok("4.3 is the themes, with value gaps alongside", await c.evaluate(`__t.has("From Step 2")`));
await c.evaluate(`__t.typeLabel("Theme 1", "Protect my energy")`);
await wait(600);
await c.evaluate(`__t.click(".add-another")`);
await wait(400);
await c.evaluate(`__t.typeLabel("Theme 2", "Build something of my own")`);
await wait(700);

console.log("\n=== STEPS 5 AND 6 ===");
await go("/step/5");
await next();
ok("5.2 is the first theme's goal card", await c.evaluate(`__t.has("Protect my energy")`));
await c.evaluate(`__t.typeLabel("How will you know you've done it?", "Sleep seven hours a night")`);
await wait(600);
await next();
ok("5.3 is the second theme's goal card", await c.evaluate(`__t.has("Build something of my own")`));
await c.evaluate(`__t.typeLabel("How will you know you've done it?", "Ten paying customers")`);
await wait(700);
await go("/step/5");
const goalCards = await c.evaluate(`__t.cards()`);
ok("a card per theme, plus scene, priority and summary", goalCards >= 5, `saw ${goalCards}`);

await go("/step/6");
await next();
ok("6.2 is an if-then for the first goal", await c.evaluate(`__t.has("Sleep seven hours a night")`));

console.log("\n=== STEP 7 ===");
await go("/step/7");
await next();
ok("7.2 is the document", await c.evaluate(`__t.has("Left the job that was draining me")`));
ok("the word is on it", await c.evaluate(`__t.has("Steady")`));
ok("a goal is on it", await c.evaluate(`__t.has("Sleep seven hours a night")`));
await next();
ok("7.3 is the note to future self, a moment", await c.evaluate(`__t.has("three months")`));
await next();
ok("7.4 keeps it alive, with check-in dates", (await c.evaluate(`__t.count('input[type="date"]')`)) === 4);
await next();
ok("7.5 is the email form", await c.evaluate(`__t.has("Send my plan")`));
await next();
ok("7.6 is the Clarity Session, last", await c.evaluate(`__t.has("Clarity Session")`));

console.log("\n=== RESUME AND CLEAR ===");
await go("/step/3");
await next();
ok("answers survive navigation",
  await c.evaluate(`document.querySelector(".deck-card:not([inert]) .moment-input").value.includes("Left the job")`));
await go("/");
ok("the landing offers to continue", await c.evaluate(`__t.has("Continue where you left off")`));
await c.evaluate(`localStorage.clear()`);
await go("/step/3");
await next();
ok("cleared answers really are gone",
  (await c.evaluate(`document.querySelector(".deck-card:not([inert]) .moment-input").value`)) === "");

console.log(`\n${pass} passed, ${fail} failed`);
c.close();
process.exit(fail ? 1 : 0);
