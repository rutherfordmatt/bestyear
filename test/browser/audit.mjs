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
    // Only ever the card on screen: every other card is in the DOM too, and
    // measuring those compares a scene card against a moment card.
    card:     q(".deck-card:not([inert]) .deck-card-inner", ["padding"]),
    eyebrow:  q(".deck-card:not([inert]) .label", TYPE),
    title:    q(".deck-card:not([inert]) .scene-title", TYPE),
    lede:     q(".deck-card:not([inert]) .lede", TYPE),
    cardRef:  q(".deck-card:not([inert]) .card-ref", TYPE),
    nav:      q(".deck-nav", []),
    h1:       q("h1", TYPE),   // non-deck pages: landing, close, privacy
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

/*
  Moment cards are never the card a page opens on, so the pass above can't
  see them. Walk to the first one on each page and measure its field: these
  are the cards that carry the exercise's biggest questions, and one of them
  rendering as a boxed input while another rendered as a quiet underline is
  exactly the kind of drift this file exists to catch.
*/
const MOMENT = {};
for (const p of JOURNEY) {
  await c.goto(BASE + p);
  const found = await c.evaluate(`(() => {
    const cards = [...document.querySelectorAll(".deck-card")];
    const i = cards.findIndex((el) => el.querySelector(".is-moment"));
    if (i < 0) return false;
    document.querySelectorAll(".deck-dot")[i]?.click();
    return true;
  })()`);
  if (!found) continue;
  await new Promise((r) => setTimeout(r, 700));
  const probe = JSON.parse(await c.evaluate(`JSON.stringify((() => {
    const el = document.querySelector(".deck-card:not([inert]) .moment-input");
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName, width: Math.round(r.width),
      fontFamily: cs.fontFamily, fontSize: cs.fontSize, textAlign: cs.textAlign,
      padding: cs.padding, borderWidth: cs.borderWidth, borderRadius: cs.borderRadius,
      backgroundColor: cs.backgroundColor, resize: cs.resize,
    };
  })())`));
  if (probe) MOMENT[p] = probe;
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
compare("card frame", JOURNEY, "card", ["left", "top", "width", "padding"]);
compare("eyebrow", JOURNEY, "eyebrow", [...GEO, ...TYPE]);
compare("scene title", JOURNEY, "title", [...GEO, "fontSize", "fontWeight", "fontFamily"]);
compare("lede", JOURNEY, "lede", [...GEO, ...TYPE]);
compare("card reference", JOURNEY, "cardRef", ["top", ...TYPE]);
compare("deck nav", JOURNEY, "nav", ["left", "width"]);

console.log("\n=== MOMENT CARDS, the field ===");
Object.assign(data, Object.fromEntries(Object.entries(MOMENT).map(([p, v]) => [p, { ...data[p], moment: v }])));
compare("moment field", Object.keys(MOMENT), "moment", [
  "width", "fontFamily", "fontSize", "textAlign", "padding",
  "borderWidth", "borderRadius", "backgroundColor", "resize",
]);
for (const [p, v] of Object.entries(MOMENT)) console.log(`         ${p.padEnd(9)} ${v.tag}`);

console.log("\n=== ALL PAGES, left edge of content ===");
for (const p of [...JOURNEY, ...OTHER]) {
  const d = data[p];
  const wm = d.wordmark?.left, h1 = d.title?.left ?? d.h1?.left;
  const flag = wm != null && h1 != null && wm !== h1 ? `  <-- content ${h1 - wm}px off the header` : "";
  console.log(`  ${p.padEnd(10)} header ${String(wm).padStart(5)}   content ${String(h1).padStart(5)}${flag}`);
}
