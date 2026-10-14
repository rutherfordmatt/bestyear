import { connect } from "./cdp.mjs";
import { writeFileSync } from "node:fs";
const [, , path, out, seedJson] = process.argv;
const c = await connect();
await c.viewport(1280, 1400);
if (seedJson) {
  const { FULL_PLAN } = await import("./fixture-plan.mjs");
  await c.seed(seedJson === "full" ? FULL_PLAN : JSON.parse(seedJson));
}
await c.goto("http://localhost:4321" + path, 1600);
const shot = await c.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
writeFileSync(out, Buffer.from(shot.result.data, "base64"));
console.log("→", out);
c.close();
