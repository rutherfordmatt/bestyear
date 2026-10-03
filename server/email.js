/*
  The vision document email, rendered SERVER-SIDE from sanitised answers.

  The browser never sends HTML. Every value below goes through esc(), and the
  only markup is the table scaffolding in this file. Styling is inline because
  email clients strip <style>.

  Visual language matches the site and the Values Finder report email.
  No year is hard-coded: dates come from the visitor's own answers.
*/

import { LIFE_AREA_KEYS } from "./sanitize.js";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const INK = "#1A1A1A";
const MUTED = "#686460";
const LINE = "#E2DEDA";
const TEAL = "#3A6B6B";
const PALE = "#E6EFEF";

const AREA_NAMES = {
  career: "Career", health: "Health", relationships: "Relationships",
  money: "Money", growth: "Growth", fun: "Fun",
};

const CORNER_NAMES = {
  partner: "A partner", friend: "A friend", colleague: "A colleague or mentor",
  coach: "A coach", group: "A group or community", alone: "Just me for now",
};

const BUCKET_NAMES = { habit: "Habits", commitment: "Commitments", should: "Shoulds" };

const label = (t) =>
  `<div style="font:500 11px ${SANS};letter-spacing:2px;text-transform:uppercase;color:${TEAL};margin-bottom:8px">${esc(t)}</div>`;

const section = (title, inner) =>
  inner
    ? `<tr><td style="padding:26px 40px 0;border-top:1px solid ${LINE}">${label(title)}${inner}</td></tr>`
    : "";

const para = (t, extra = "") =>
  `<p style="font:15px/1.7 ${SANS};color:${INK};margin:0 ${extra}">${esc(t)}</p>`;

function formatDate(iso, opts) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso || "");
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-IE", opts);
}

/** Build the email. `answers` must already have been through sanitizeAnswers(). */
export function visionEmail(answers, { bookingUrl, siteUrl }) {
  const a = answers;
  const site = String(siteUrl || "https://yearwellbuilt.com");
  const host = site.replace(/^https?:\/\//, "").replace(/\/$/, "");

  /* --- Hero --- */
  const hero = `
    <tr><td style="padding:40px 40px 24px">
      ${label("Your year, on one page")}
      ${a.headline
        ? `<h1 style="font:400 34px/1.15 ${SERIF};color:${INK};margin:0 0 14px">${esc(a.headline)}</h1>`
        : ""}
      ${a.word
        ? `<p style="font:15px/1.7 ${SANS};color:${MUTED};margin:0">My word for the year: <em style="font:italic 22px ${SERIF};color:${TEAL}">${esc(a.word)}</em></p>`
        : ""}
    </td></tr>`;

  /* --- The year behind --- */
  const behind = [
    a.yearEndingWord
      ? `<p style="font:15px/1.7 ${SANS};color:${MUTED};margin:0 0 8px">A year of <em style="font:italic 19px ${SERIF};color:${INK}">${esc(a.yearEndingWord)}</em></p>`
      : "",
    a.closingLine
      ? `<blockquote style="margin:0;border-left:2px solid ${TEAL};padding-left:16px;font:italic 18px/1.5 ${SERIF};color:${INK}">${esc(a.closingLine)}</blockquote>`
      : "",
  ].join("");

  /* --- Life wheel, as a table (SVG is unreliable in email) --- */
  const rated = LIFE_AREA_KEYS
    .map((k) => ({ key: k, name: AREA_NAMES[k], score: a.wheel?.[k] }))
    .filter((r) => typeof r.score === "number");

  const wheel = rated.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rated
        .map((r) => {
          const pct = Math.round((r.score / 10) * 100);
          return `<tr>
            <td style="font:15px/1.7 ${SANS};color:${INK};padding:4px 12px 4px 0;width:120px">${esc(r.name)}</td>
            <td style="padding:4px 0">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="background:${TEAL};height:8px;width:${pct}%;font-size:0;line-height:0">&nbsp;</td>
                <td style="background:${LINE};height:8px;font-size:0;line-height:0">&nbsp;</td>
              </tr></table>
            </td>
            <td style="font:500 13px ${SANS};color:${TEAL};padding:4px 0 4px 12px;width:28px;text-align:right">${r.score}</td>
          </tr>`;
        })
        .join("")}</table>`
    : "";

  /* --- Values --- */
  const values = a.values.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${a.values
        .map(
          (v) => `<tr>
            <td style="font:500 16px ${SANS};color:${INK};padding:5px 0">${esc(v.name)}</td>
            <td style="font:13px ${SANS};color:${v.alignment !== null && v.alignment <= 2 ? "#9A5B2E" : MUTED};padding:5px 0;text-align:right">${
              v.alignment === null ? "" : `lived it ${v.alignment}/5`
            }</td>
          </tr>`
        )
        .join("")}</table>`
    : "";

  /* --- Lessons --- */
  const lessons = a.lessons.length
    ? `<ol style="margin:0;padding-left:20px;font:15px/1.8 ${SANS};color:${INK}">${a.lessons
        .map((l) => `<li>${esc(l)}</li>`)
        .join("")}</ol>`
    : "";

  /* --- Leaving behind --- */
  const buckets = ["habit", "commitment", "should"]
    .map((b) => {
      const items = a.lettingGo.filter((l) => l.bucket === b);
      if (!items.length) return "";
      return `<p style="margin:0 0 8px">
        <span style="font:500 11px ${SANS};letter-spacing:1.5px;text-transform:uppercase;color:${MUTED}">${esc(BUCKET_NAMES[b])}</span><br>
        <span style="font:15px/1.6 ${SANS};color:${MUTED};text-decoration:line-through">${esc(items.map((i) => i.text).join(" · "))}</span>
      </p>`;
    })
    .join("");

  /* --- Themes --- */
  const themes = a.themes.length
    ? `<p style="font:16px/1.8 ${SANS};color:${INK};margin:0">${a.themes
        .map((t) => `<span style="display:inline-block;border:1px solid ${TEAL};color:${TEAL};padding:4px 12px;margin:0 6px 6px 0;font-size:14px">${esc(t)}</span>`)
        .join("")}</p>`
    : "";

  /* --- Goals --- */
  const goals = a.goals.length
    ? a.goals
        .map((g) => {
          const meta = [g.theme, g.value, g.date ? `by ${formatDate(g.date, { day: "numeric", month: "long" })}` : ""]
            .filter(Boolean)
            .map(esc)
            .join(" &middot; ");
          const line = (name, value) =>
            value
              ? `<p style="font:14px/1.6 ${SANS};color:${INK};margin:6px 0 0"><span style="font:500 11px ${SANS};letter-spacing:1.5px;text-transform:uppercase;color:${MUTED}">${name}</span><br>${esc(value)}</p>`
              : "";
          const ifThen = g.ifThen.if || g.ifThen.then
            ? `<p style="font:14px/1.6 ${SANS};color:${MUTED};margin:8px 0 0">If ${esc(stripLead(g.ifThen.if))}, then I will ${esc(stripLead(g.ifThen.then))}</p>`
            : "";
          return `<div style="padding:16px 0;border-bottom:1px solid ${LINE}${g.priority ? `;border-left:2px solid ${TEAL};padding-left:16px` : ""}">
            <p style="font:500 17px/1.4 ${SANS};color:${INK};margin:0">${g.priority ? `<span style="color:${TEAL}">&#9733;</span> ` : ""}${esc(g.done)}</p>
            ${meta ? `<p style="font:12px ${SANS};color:${MUTED};margin:6px 0 0">${meta}</p>` : ""}
            ${g.why ? `<p style="font:italic 14px/1.6 ${SANS};color:${MUTED};margin:6px 0 0">${esc(g.why)}</p>` : ""}
            ${line("Habit", g.habit)}
            ${line("First step", g.firstStep)}
            ${ifThen}
          </div>`;
        })
        .join("")
    : "";

  /* --- Corner --- */
  const cornerWho = a.corner.who.map((k) => CORNER_NAMES[k]).filter(Boolean);
  const corner = cornerWho.length || a.corner.ask
    ? `${cornerWho.length ? `<p style="font:500 15px/1.7 ${SANS};color:${INK};margin:0">${esc(cornerWho.join(" · "))}</p>` : ""}
       ${a.corner.ask ? `<p style="font:15px/1.7 ${SANS};color:${MUTED};margin:6px 0 0">${esc(a.corner.ask)}</p>` : ""}`
    : "";

  /* --- Note and check-ins --- */
  const note = a.noteToFutureSelf
    ? `<blockquote style="margin:0;border-left:2px solid ${TEAL};padding-left:16px;font:italic 18px/1.5 ${SERIF};color:${INK}">${esc(a.noteToFutureSelf)}</blockquote>`
    : "";

  const checkIns = a.checkIns.length || a.livesAt
    ? `${a.livesAt ? `<p style="font:15px/1.7 ${SANS};color:${MUTED};margin:0 0 8px">This page lives: ${esc(a.livesAt)}</p>` : ""}
       ${a.checkIns.length
          ? `<p style="font:15px/1.8 ${SANS};color:${INK};margin:0">${a.checkIns
              .map((d) => esc(formatDate(d, { weekday: "long", day: "numeric", month: "long" })))
              .join("<br>")}</p>`
          : ""}`
    : "";

  const preheader = a.headline || "Your one-page plan for the year ahead.";

  const html = `<!doctype html><html lang="en-IE"><body style="margin:0;background:#FAFAF8">
<div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:1px solid ${LINE}">
  ${hero}
  ${section("The year behind", behind)}
  ${section("Your life wheel", wheel)}
  ${section("What matters", values)}
  ${section("Lessons I'm carrying forward", lessons)}
  ${section("Leaving behind", buckets)}
  ${section("My three themes", themes)}
  ${section("My goals", goals)}
  ${section("In my corner", corner)}
  ${section("A note to myself", note)}
  ${section("Keeping it alive", checkIns)}
  <tr><td style="padding:32px 40px 40px;border-top:1px solid ${LINE}">
    <div style="background:${PALE};padding:22px 24px;margin-bottom:24px">
      <div style="font:500 20px ${SERIF};color:${INK};margin-bottom:6px">Want to talk it through?</div>
      <p style="font:14px/1.6 ${SANS};color:${INK};margin:0 0 16px">A Clarity Session is one focused hour to pressure-test your plan and make sure your first steps are the right ones.</p>
      <a href="${esc(bookingUrl)}" style="display:inline-block;background:${TEAL};color:#FFFFFF;text-decoration:none;font:500 12px ${SANS};letter-spacing:2px;text-transform:uppercase;padding:14px 24px;border-radius:2px">Book a Clarity Session</a>
    </div>
    ${para("Print it, pin it up, and come back to it when the year gets noisy.")}
    <p style="font:italic 20px ${SERIF};color:${INK};margin:24px 0 0">Matt</p>
    <p style="font:13px/1.6 ${SANS};color:${MUTED};margin:20px 0 0">P.S. We don't keep a copy of this. If you lose the email, it's gone, so save it somewhere safe.</p>
  </td></tr>
</table>
<p style="font:12px/1.6 ${SANS};color:${MUTED};max-width:600px;margin:18px auto 0">You're receiving this because you asked for your plan at <a href="${esc(site)}" style="color:${TEAL}">${esc(host)}</a>. This is a one-off email and we keep no copy of your answers.</p>
</td></tr></table></body></html>`;

  /* --- Plain text alternative --- */
  const t = [];
  t.push("YOUR YEAR, ON ONE PAGE", "");
  if (a.headline) t.push(a.headline, "");
  if (a.word) t.push(`My word for the year: ${a.word}`, "");
  if (a.yearEndingWord) t.push(`The year behind: a year of ${a.yearEndingWord}`);
  if (a.closingLine) t.push(`"${a.closingLine}"`, "");
  if (rated.length) {
    t.push("LIFE WHEEL");
    rated.forEach((r) => t.push(`  ${r.name}: ${r.score}/10`));
    t.push("");
  }
  if (a.values.length) {
    t.push("WHAT MATTERS");
    a.values.forEach((v) => t.push(`  ${v.name}${v.alignment === null ? "" : ` (lived it ${v.alignment}/5)`}`));
    t.push("");
  }
  if (a.lessons.length) {
    t.push("LESSONS I'M CARRYING FORWARD");
    a.lessons.forEach((l, i) => t.push(`  ${i + 1}. ${l}`));
    t.push("");
  }
  if (a.lettingGo.length) {
    t.push("LEAVING BEHIND");
    a.lettingGo.forEach((l) => t.push(`  ${BUCKET_NAMES[l.bucket]}: ${l.text}`));
    t.push("");
  }
  if (a.themes.length) t.push("MY THREE THEMES", ...a.themes.map((x) => `  ${x}`), "");
  if (a.goals.length) {
    t.push("MY GOALS");
    a.goals.forEach((g) => {
      t.push(`  ${g.priority ? "* " : ""}${g.done}`);
      const meta = [g.theme, g.value, g.date ? `by ${formatDate(g.date, { day: "numeric", month: "long" })}` : ""].filter(Boolean);
      if (meta.length) t.push(`      ${meta.join(" | ")}`);
      if (g.why) t.push(`      Why: ${g.why}`);
      if (g.habit) t.push(`      Habit: ${g.habit}`);
      if (g.firstStep) t.push(`      First step: ${g.firstStep}`);
      if (g.ifThen.if || g.ifThen.then) {
        t.push(`      If ${stripLead(g.ifThen.if)}, then I will ${stripLead(g.ifThen.then)}`);
      }
      t.push("");
    });
  }
  if (cornerWho.length) t.push("IN MY CORNER", `  ${cornerWho.join(", ")}`);
  if (a.corner.ask) t.push(`  ${a.corner.ask}`);
  if (cornerWho.length || a.corner.ask) t.push("");
  if (a.noteToFutureSelf) t.push("A NOTE TO MYSELF", `  "${a.noteToFutureSelf}"`, "");
  if (a.livesAt) t.push(`This page lives: ${a.livesAt}`);
  if (a.checkIns.length) {
    t.push("CHECK-INS");
    a.checkIns.forEach((d) => t.push(`  ${formatDate(d, { weekday: "long", day: "numeric", month: "long" })}`));
    t.push("");
  }
  t.push(
    "Want to talk it through? A Clarity Session is one focused hour to",
    "pressure-test your plan and make sure your first steps are the right ones.",
    bookingUrl,
    "",
    "Matt",
    "",
    "P.S. We don't keep a copy of this. If you lose the email, it's gone,",
    "so save it somewhere safe."
  );

  return {
    subject: "Your year, on one page",
    html,
    text: t.join("\n"),
  };
}

/** "...work runs late" -> "work runs late". */
function stripLead(value = "") {
  return String(value).replace(/^\s*\.{3}\s*/, "").replace(/^(if|then i will)\s+/i, "").trim();
}
