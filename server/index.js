/*
  The only server code in this project.

  It does two things:
  1. Serves the static Astro build in dist/.
  2. Accepts POST /send — an email address, the answers as JSON, and optional
     opt-ins. It validates everything, renders the email from our own template,
     sends it via Resend, optionally creates a Ghost member labelled `ywb`,
     then discards the lot. Nothing is written to disk or to a database.

  Honeypot plus rate limiting per IP and per recipient. No captcha.
*/

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFile } from "node:fs/promises";

import { sanitizeAnswers, isEmail } from "./sanitize.js";
import { visionEmail } from "./email.js";
import { subscribeToGhost } from "./ghost.js";
import { limited, atLimit, record, clientIp } from "./rate-limit.js";

const env = process.env;
const PORT = Number(env.PORT) || 3000;
const DIST = "./dist";

const RESEND_API_KEY = env.RESEND_API_KEY || "";
const MAIL_FROM = env.MAIL_FROM || "Matt at Year Well Built <hello@yearwellbuilt.com>";
const MAIL_REPLY_TO = env.MAIL_REPLY_TO || "";
const GHOST_URL = env.GHOST_ADMIN_API_URL || "";
const GHOST_KEY = env.GHOST_ADMIN_API_KEY || "";
const GHOST_LABEL = env.GHOST_MEMBER_LABEL || "ywb";
const BOOKING_URL = env.PUBLIC_BOOKING_URL || "https://mattrutherfordcoaching.com/?source=ywb";
const SITE_URL = env.PUBLIC_SITE_URL || "https://yearwellbuilt.com";

const MAX_BODY = 128_000; // the answers are text; anything larger is not ours

// Two layers. The abuse guard counts EVERY request from an IP, so a bot can't
// hammer the endpoint for free. The send allowances are only spent on a send
// that actually went out, so someone whose email fails can retry.
const ABUSE_MAX = 30, ABUSE_WINDOW = 3_600_000;
const IP_MAX = 5, IP_WINDOW = 3_600_000;
const TO_MAX = 3, TO_WINDOW = 86_400_000;

const app = new Hono();

/* ---------- POST /send ---------- */

app.post("/send", async (c) => {
  const ip = clientIp(c.req.raw.headers);

  if (limited(ip, "send-abuse", ABUSE_MAX, ABUSE_WINDOW)) {
    return c.json({ error: "That's a few too many. Try again later." }, 429);
  }

  // Reject oversized bodies before parsing.
  const declared = Number(c.req.header("content-length") || 0);
  if (declared > MAX_BODY) {
    return c.json({ error: "That's too large to send." }, 413);
  }

  let body;
  try {
    const raw = await c.req.text();
    if (raw.length > MAX_BODY) return c.json({ error: "That's too large to send." }, 413);
    body = JSON.parse(raw);
  } catch {
    return c.json({ error: "Couldn't read that request." }, 400);
  }

  // Honeypot. Real people never fill this in.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    // Look like a success so bots don't learn anything.
    return c.json({ ok: true });
  }

  const email = String(body.email || "").trim().toLowerCase();
  if (!isEmail(email)) {
    return c.json({ error: "That doesn't look like an email address." }, 400);
  }

  // Allowances per IP and, independently, per recipient address. Checked
  // here, spent further down only if something actually went out.
  if (atLimit(ip, "send-ip", IP_MAX, IP_WINDOW) || atLimit(email, "send-to", TO_MAX, TO_WINDOW)) {
    return c.json({ error: "That's a few too many. Try again later." }, 429);
  }

  const wantsNewsletter = body.newsletter === true;
  const subscribeOnly = body.subscribeOnly === true;

  let sent = false;
  if (!subscribeOnly) {
    const answers = sanitizeAnswers(body.answers);
    if (!answers) {
      return c.json({ error: "There's nothing in your plan to send yet." }, 400);
    }

    if (!RESEND_API_KEY) {
      console.error("[send] RESEND_API_KEY is not set");
      return c.json({ error: "Email isn't configured yet. Try Save as PDF instead." }, 503);
    }

    const message = visionEmail(answers, { bookingUrl: BOOKING_URL, siteUrl: SITE_URL });

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: MAIL_FROM,
          to: [email],
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(MAIL_REPLY_TO ? { reply_to: MAIL_REPLY_TO } : {}),
        }),
      });
      if (!res.ok) {
        // Never log the body: it contains the visitor's plan.
        console.error(`[send] Resend ${res.status}`);
        return c.json({ error: "The email didn't go through. Try again in a moment." }, 502);
      }
      sent = true;
    } catch (err) {
      console.error("[send] Resend request failed:", err.message);
      return c.json({ error: "The email didn't go through. Try again in a moment." }, 502);
    }
  }

  // Newsletter is a separate, opt-in action. Only a ticked box gets here.
  let subscribed = false;
  if (wantsNewsletter && GHOST_URL) {
    try {
      await subscribeToGhost({
        ghostUrl: GHOST_URL,
        adminKey: GHOST_KEY,
        label: GHOST_LABEL,
        email,
      });
      subscribed = true;
    } catch (err) {
      // A failed sign-up must not fail the send — the plan matters more.
      console.error("[send] Ghost:", err.message);
    }
  }

  if (subscribeOnly && !subscribed) {
    return c.json({ error: "Couldn't sign you up just now. Try again in a moment." }, 502);
  }

  // Spend the allowance only now that something has actually gone out.
  if (sent || subscribed) {
    record(ip, "send-ip", IP_WINDOW);
    record(email, "send-to", TO_WINDOW);
  }

  // Everything is discarded here: nothing written, nothing cached.
  return c.json({ ok: true, sent, subscribed });
});

/* ---------- Health ---------- */

app.get("/healthz", (c) => c.text("ok"));

/* ---------- Static site ---------- */

app.use("/*", serveStatic({ root: DIST }));

// Astro's static build writes directory-style pages; fall back to the 404 page.
app.notFound(async (c) => {
  try {
    const html = await readFile(`${DIST}/404.html`, "utf8");
    return c.html(html, 404);
  } catch {
    return c.text("Not found", 404);
  }
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Year Well Built listening on :${info.port}`);
  if (!RESEND_API_KEY) console.warn("  RESEND_API_KEY not set — /send will refuse to email.");
  if (!GHOST_URL) console.warn("  GHOST_ADMIN_API_URL not set — newsletter opt-ins are ignored.");
});
