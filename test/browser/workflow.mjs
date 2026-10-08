/* Drive the whole journey in a real browser and check it behaves. */
import { connect } from "./cdp.mjs";

const BASE = "http://localhost:4321";
const c = await connect();
await c.viewport(1280, 1000);

let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ok   ${label}`); }
  else { fail++; console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`); }
};

// Helpers injected into the page.
const HELPERS = `
  window.__t = {
    text: () => document.body.textContent,
    has: (s) => document.body.textContent.includes(s),
    count: (sel) => document.querySelectorAll(sel).length,
    type: (sel, value, i = 0) => {
      const el = document.querySelectorAll(sel)[i];
      if (!el) return "no element: " + sel;
      el.focus();
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.blur();
      return "ok";
    },
    click: (sel, i = 0) => {
      const el = document.querySelectorAll(sel)[i];
      if (!el) return "no element: " + sel;
      el.click();
      return "ok";
    },
    clickText: (sel, text) => {
      const el = [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().includes(text));
      if (!el) return "no element with text: " + text;
      el.click();
      return "ok";
    },
    typeLabel: (label, value) => {
      const el = [...document.querySelectorAll("input, textarea")].find((e) => e.getAttribute("aria-label") === label);
      if (!el) return "no field labelled: " + label;
      el.focus(); el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.blur();
      return "ok";
    },
    range: (sel, value, i = 0) => {
      const el = document.querySelectorAll(sel)[i];
      if (!el) return "no element";
      el.value = String(value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return "ok";
    },
    store: () => JSON.parse(localStorage.getItem("ywb:v1") || "null"),
  };
`;
const go = async (path, settle = 800) => { await c.goto(BASE + path, settle); await c.evaluate(HELPERS); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

console.log("=== SETUP ===");
await go("/setup");
await c.evaluate(`localStorage.clear()`);
await go("/setup");
ok("word question hidden before a pace is chosen", !(await c.evaluate(`__t.has("Sum up the year")`)));
await c.evaluate(`__t.clickText(".pace-option", "In one sitting")`);
await wait(500);
ok("word question appears after choosing a pace", await c.evaluate(`__t.has("Sum up the year")`));
await c.evaluate(`__t.type("#year-word", "Rebuilding")`);
await wait(600);
ok("transition appears once a word is written", await c.evaluate(`__t.has("That's the title of the chapter")`));
ok("pace saved", (await c.evaluate(`__t.store()`))?.pace === "sitting");

console.log("\n=== STEP 1 ===");
await go("/step/1");
ok("the life wheel comes first", await c.evaluate(`__t.has("How satisfied are you")`));
ok("the wheel has eight sliders", (await c.evaluate(`__t.count('input[type="range"]')`)) === 8);
ok("nothing else is shown yet", !(await c.evaluate(`__t.has("What went well")`)));
await c.evaluate(`__t.range('input[type="range"]', 7, 0)`);
await c.evaluate(`__t.range('input[type="range"]', 3, 2)`);
await wait(500);
ok("radar plots only rated areas", (await c.evaluate(`__t.count(".wheel-point")`)) === 2);
ok("wins appear after rating an area", await c.evaluate(`__t.has("What went well")`));
await c.evaluate(`__t.typeLabel("Win 1", "Had the conversation about my role")`);
await wait(500);
ok("challenges appear after a win", await c.evaluate(`__t.has("What was hardest")`));
ok("only one win field to start", (await c.evaluate(`__t.count(".pair")`)) === 2);
await c.evaluate(`__t.clickText("button", "Add another win")`);
await wait(400);
ok("a second win can be added", (await c.evaluate(`__t.count(".pair")`)) === 3);
await c.evaluate(`__t.typeLabel("Challenge 1", "A project that ran late")`);
await c.evaluate(`__t.typeLabel("What challenge 1 taught you", "I say yes too quickly")`);
await wait(500);
ok("energy audit appears after a challenge", await c.evaluate(`__t.has("What gave you energy")`));
await c.evaluate(`__t.typeLabel("Things that drained your energy, item 1", "Back-to-back video calls")`);
await wait(600);
const s1 = await c.evaluate(`__t.store()`);
ok("schema is version 2", s1.schema === 2);
ok("wheel stores nulls for unrated areas", s1.step1.wheel.career === 7 && s1.step1.wheel.family === null);
ok("purpose is on the wheel", "purpose" in s1.step1.wheel);
ok("the lesson is stored on its challenge", s1.step1.challenges[0].lesson === "I say yes too quickly");
ok("drainer saved", s1.step1.energy.drained.includes("Back-to-back video calls"));
ok("'Added to your plan' summary shows", await c.evaluate(`__t.has("Added to your plan")`));

console.log("\n=== STEP 2 ===");
await go("/step/2");
ok("gap question hidden before values are rated", !(await c.evaluate(`__t.has("Where did you compromise")`)));
await c.evaluate(`__t.clickText("button", "Pick from the list")`);
await wait(2000);
ok("picker loads all 155 values", (await c.evaluate(`__t.count(".chips .chip")`)) >= 155);
for (let i = 0; i < 6; i++) await c.evaluate(`__t.click(".chips .chip", ${i})`);
await wait(500);
ok("six values chosen", (await c.evaluate(`__t.store()`)).step2.values.length === 6);
await c.evaluate(`__t.click(".dial-btn", 0)`);   // first value, rating 1
await wait(600);
ok("gap question appears once a value is rated", await c.evaluate(`__t.has("Where did you compromise")`));
ok("low rating flagged as a gap", await c.evaluate(`__t.has("A gap worth watching")`));
await c.evaluate(`__t.type("textarea", "Worked most weekends", 0)`);
await wait(600);
ok("letting go appears after the gap", await c.evaluate(`__t.has("What are you leaving behind")`));
ok("step 1 drainer offered as a head start", await c.evaluate(`__t.has("Back-to-back video calls")`));
await c.evaluate(`__t.clickText(".from-step-pick", "Back-to-back video calls")`);
await wait(600);
ok("the suggestion lands in the list", (await c.evaluate(`__t.store()`)).step2.lettingGo.length === 1);
ok("closing line appears after letting go", await c.evaluate(`__t.has("last line")`));

console.log("\n=== STEP 3: PICTURE IT ===");
await go("/step/3");
ok("only the headline is asked for first", !(await c.evaluate(`__t.has("What's different about your life")`)));
await c.evaluate(`__t.type(".headline-input", "Left the job that was draining me")`);
await wait(600);
ok("detail appears after the headline", await c.evaluate(`__t.has("What's different about your life")`));
ok("lowest wheel areas offered alongside", await c.evaluate(`__t.has("From Step 1")`));
await c.evaluate(`__t.typeLabel("What's different about your life?", "I sleep properly.")`);
await wait(600);
const s3 = await c.evaluate(`__t.store()`);
ok("headline saved to step 3", s3.step3.headline.includes("Left the job"));
ok("detail saved alongside it", s3.step3.detail.includes("I sleep properly"));

console.log("\n=== STEP 4: YOUR COMPASS ===");
await go("/step/4");
ok("the headline is recalled from step 3", await c.evaluate(`__t.has("Left the job that was draining me")`));
ok("themes are not shown yet", !(await c.evaluate(`__t.has("three themes will get you")`)));
await c.evaluate(`__t.type(".word-input", "Steady")`);
await wait(600);
ok("themes appear after the word", await c.evaluate(`__t.has("three themes will get you")`));
ok("value gaps carried into the themes question", await c.evaluate(`__t.has("From Step 2")`));
await c.evaluate(`__t.typeLabel("Theme 1", "Protect my energy")`);
await c.evaluate(`__t.typeLabel("Theme 2", "Build something of my own")`);
await wait(700);

console.log("\n=== STEP 5 ===");
await go("/step/5");
const cards = await c.evaluate(`__t.count(".goal-card")`);
ok("one goal card shown, not all of them", cards === 1, `saw ${cards}`);
ok("card is titled with the theme", await c.evaluate(`__t.has("Protect my energy")`));
await c.evaluate(`__t.type('.goal-fields input[type="text"]', "Sleep seven hours a night", 0)`);
await wait(600);
ok("second goal card arrives", (await c.evaluate(`__t.count(".goal-card")`)) === 2);
ok("priority question appears", await c.evaluate(`__t.has("could only achieve one")`));
await c.evaluate(`__t.click(".star-btn", 0)`);
await wait(500);
ok("priority saved", Boolean((await c.evaluate(`__t.store()`)).step5.priorityGoalId));

console.log("\n=== STEP 6 ===");
await go("/step/6");
ok("an if-then card per goal", (await c.evaluate(`__t.count(".ifthen-card")`)) >= 1);
ok("the goal's text is on its card", await c.evaluate(`__t.has("Sleep seven hours a night")`));

console.log("\n=== STEP 7 ===");
await go("/step/7");
ok("headline on the document", await c.evaluate(`__t.has("Left the job that was draining me")`));
ok("word on the document", await c.evaluate(`__t.has("Steady")`));
ok("values on the document", await c.evaluate(`__t.has("WHAT MATTERS") || __t.has("What matters")`));
ok("goal on the document", await c.evaluate(`__t.has("Sleep seven hours a night")`));
ok("check-in dates suggested", (await c.evaluate(`__t.count('.checkin-list input[type="date"]')`)) === 4);
ok("email form present", await c.evaluate(`__t.has("Send my plan")`));

console.log("\n=== RESUME AND CLEAR ===");
await go("/step/3");
ok("answers survive navigation", await c.evaluate(`document.querySelector(".headline-input").value.includes("Left the job")`));
await go("/");
ok("landing offers to continue", await c.evaluate(`__t.has("Continue where you left off")`));
await c.evaluate(`localStorage.clear()`);
await go("/step/3");
ok("cleared answers really are gone", (await c.evaluate(`document.querySelector(".headline-input").value`)) === "");

console.log(`\n${pass} passed, ${fail} failed`);
c.close();
process.exit(fail ? 1 : 0);
