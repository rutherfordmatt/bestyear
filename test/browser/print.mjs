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
console.log("=== PRINT ===");
console.log(`  ${pages === 1 ? "ok  " : "FAIL"} a full plan prints on one page (got ${pages}), ${(buf.length / 1024).toFixed(0)}kB`);
console.log("  → preview/plan.pdf");
process.exitCode = pages === 1 ? 0 : 1;
c.close();
