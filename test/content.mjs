/*
  Checks on the copy that the browser can't make for itself.

  The landing page's example plan was keyed by step number, so renumbering the
  journey silently paired "putting down the committee" with "Picture it". It is
  keyed by slug now, and this fails loudly if a step has no sample.

  Run with: npm test
*/
import { readFileSync } from "node:fs";
import { STEPS } from "../src/lib/steps.js";

let fails = 0;
const ok = (label, cond, detail = "") => {
  if (!cond) fails += 1;
  console.log(`${cond ? "  ok  " : "FAIL  "}${label}${detail ? ` — ${detail}` : ""}`);
};

const read = (name) => readFileSync(new URL(`../content/${name}.md`, import.meta.url), "utf8");

/* ---------- The landing page's example plan ---------- */
const landing = read("landing");
const exampleBlock = landing.slice(landing.indexOf("## Example plan"));
const keys = [...exampleBlock.matchAll(/^- \*\*([a-z-]+):\*\*/gm)].map((m) => m[1]);

for (const step of STEPS) {
  ok(`example plan has a line for "${step.slug}"`, keys.includes(step.slug));
}
const strays = keys.filter((k) => !STEPS.some((s) => s.slug === k));
ok("no example lines for steps that no longer exist", strays.length === 0, strays.join(", "));

/* ---------- Intros stay short ---------- */
const MAX_WORDS = 50;
for (const step of STEPS) {
  const md = read(`step-${step.n}`);
  const intro = md.slice(md.indexOf("## Intro") + 8).split("\n## ")[0];
  const words = intro.trim().split(/\s+/).length;
  ok(`step ${step.n} intro is under ${MAX_WORDS} words`, words <= MAX_WORDS, `${words} words`);
}

/* ---------- Every step file exists and is marked live ---------- */
for (const step of STEPS) {
  const md = read(`step-${step.n}`);
  ok(`step ${step.n} content is marked LIVE`, md.includes("Status: LIVE"));
}

console.log(fails ? `\n${fails} FAILED` : "\nAll content checks passed.");
process.exit(fails ? 1 : 0);
