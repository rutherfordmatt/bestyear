/* Compare equivalent elements across every page and flag anything that differs. */
import { connect } from "./cdp.mjs";

const BASE = "http://localhost:4321";
const JOURNEY = ["/setup", "/step/1", "/step/2", "/step/3", "/step/4", "/step/5", "/step/6", "/step/7"];
const OTHER = ["/", "/close", "/privacy"];

const PROBE = `JSON.stringify((() => {
  const pick = (el, props) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const out = { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width) };
    for (const p of props) out[p] = cs[p];
    return out;
  };
  const q = (s, props) => pick(document.querySelector(s), props);
  const TYPE = ["fontSize", "fontWeight", "fontFamily", "color", "lineHeight"];
  return {
    wordmark: q(".wordmark", []),
    rail:     q(".phase-rail", []),
    label:    q(".intro .label", TYPE),
    h1:       q(".intro h1", TYPE),
    lede:     q(".intro .lede", TYPE),
    prompt1:  q(".prompt", ["paddingTop", "borderTopWidth"]),
    question: q(".prompt-question", TYPE),
    barIn:    q(".bar .in", []),
    storage:  q(".storage-controls", []),
  };
})())`;

const c = await connect();
await c.viewport(1280);

const data = {};
for (const p of [...JOURNEY, ...OTHER]) {
  await c.goto(BASE + p);
  data[p] = JSON.parse(await c.evaluate(PROBE));
}
c.close();

const shorten = (v) => String(v).replace(/"?Cormorant Garamond"?, Georgia.*/, "serif").replace(/Inter, system-ui.*/, "sans").replace("rgb(", "").replace(")", "");

function compare(label, pages, key, props) {
  const rows = pages.map((p) => [p, data[p][key]]).filter(([, v]) => v);
  if (!rows.length) return;
  const diffs = [];
  for (const prop of props) {
    const vals = new Map();
    for (const [p, v] of rows) {
      const val = shorten(v[prop]);
      if (!vals.has(val)) vals.set(val, []);
      vals.get(val).push(p);
    }
    if (vals.size > 1) diffs.push([prop, vals]);
  }
  if (!diffs.length) { console.log(`  ok   ${label}`); return; }
  console.log(`  DIFF ${label}`);
  for (const [prop, vals] of diffs) {
    for (const [val, ps] of vals) console.log(`         ${prop}: ${val}  <- ${ps.join(", ")}`);
  }
}

console.log("=== JOURNEY PAGES (setup + steps 1-7), at 1280px ===");
const GEO = ["left", "top"];
const TYPE = ["fontSize", "fontWeight", "fontFamily", "color"];
compare("wordmark position", JOURNEY, "wordmark", GEO);
compare("rail position", JOURNEY, "rail", GEO);
compare("eyebrow", JOURNEY, "label", [...GEO, ...TYPE]);
compare("h1", JOURNEY, "h1", [...GEO, "fontSize", "fontWeight", "fontFamily"]);
compare("lede", JOURNEY, "lede", [...GEO, ...TYPE]);
compare("first prompt", JOURNEY, "prompt1", ["left", "paddingTop", "borderTopWidth"]);
compare("question type", JOURNEY, "question", TYPE);
compare("bar inner", JOURNEY, "barIn", ["left", "width"]);

console.log("\n=== ALL PAGES, left edge of content ===");
for (const p of [...JOURNEY, ...OTHER]) {
  const d = data[p];
  const wm = d.wordmark?.left, h1 = d.h1?.left;
  const flag = wm != null && h1 != null && wm !== h1 ? `  <-- content ${h1 - wm}px off the header` : "";
  console.log(`  ${p.padEnd(10)} header ${String(wm).padStart(5)}   content ${String(h1).padStart(5)}${flag}`);
}
