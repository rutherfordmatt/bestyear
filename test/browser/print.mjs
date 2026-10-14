import { connect } from "./cdp.mjs";
import { FULL_PLAN } from "./fixture-plan.mjs";
import { writeFileSync } from "node:fs";

const c = await connect();
await c.viewport(1280, 1200);
await c.seed(FULL_PLAN);
await c.goto("http://localhost:4321/step/7", 1600);

const pdf = await c.send("Page.printToPDF", {
  printBackground: true, preferCSSPageSize: true,
});
const buf = Buffer.from(pdf.result.data, "base64");
writeFileSync("preview/plan.pdf", buf);
const pages = (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
/*
  The plan is meant to be pinned up, so one sheet is the requirement, not a
  preference. A full plan — three goals, six values, every section filled —
  has to fit.
*/
/*
  One page is necessary but nowhere near sufficient: the deck is a carousel,
  and for a while the document printed on exactly one page that was two
  thirds empty, because the card viewport clipped it and the page count
  never noticed. So check the geometry under print media too — nothing
  between the document and the page may clip it or move it sideways.
*/
await c.send("Emulation.setEmulatedMedia", { media: "print" });
const geometry = JSON.parse(await c.evaluate(`JSON.stringify((() => {
  const doc = document.querySelector(".vision-doc");
  if (!doc) return { ok: false, why: "the document is not on the page" };
  const clipped = [];
  for (let el = doc.parentElement; el && el !== document.body; el = el.parentElement) {
    const cs = getComputedStyle(el);
    // An identity matrix is fine; being moved is not.
    const m = cs.transform.match(/matrix\(([^)]+)\)/);
    const shifted = m ? m[1].split(",").slice(4).some((n) => Math.abs(parseFloat(n)) > 0.5) : false;
    if (shifted) clipped.push(el.className + " is moved by a transform (" + cs.transform + ")");
    if (cs.overflow !== "visible" && el.clientHeight && el.clientHeight < el.scrollHeight - 1) {
      clipped.push(el.className + " clips it (" + el.clientHeight + " < " + el.scrollHeight + ")");
    }
  }
  const last = document.querySelector(".vd-footer") || doc.lastElementChild;
  return {
    ok: clipped.length === 0 && last.getBoundingClientRect().height > 0,
    clipped,
    sections: document.querySelectorAll(".vision-doc .vd-section").length,
  };
})())`));
await c.send("Emulation.setEmulatedMedia", { media: "" });

console.log("=== PRINT ===");
console.log(`  ${pages === 1 ? "ok  " : "FAIL"} a full plan prints on one page (got ${pages}), ${(buf.length / 1024).toFixed(0)}kB`);
console.log(`  ${geometry.ok ? "ok  " : "FAIL"} nothing clips or shifts the document on paper (${geometry.sections} sections)${geometry.clipped?.length ? " — " + geometry.clipped.join("; ") : ""}`);
console.log("  → preview/plan.pdf");
process.exitCode = pages === 1 && geometry.ok ? 0 : 1;
c.close();
