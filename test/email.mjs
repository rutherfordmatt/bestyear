/*
  The /send email template must never render anything the visitor typed as
  markup. This feeds it a hostile payload and checks the output.

  Run with: npm test
*/
import { sanitizeAnswers } from "../server/sanitize.js";
import { visionEmail } from "../server/email.js";

const hostile = {
  yearEnding: { word: "<img src=x onerror=alert(1)>" },
  step1: {
    wins: [{ text: "Had the conversation", enabler: "Prepared properly" }],
    challenges: [{ text: "Project ran late", lesson: "I say yes too quickly" }],
    wheel: { career: 7, health: 3, relationships: 99, money: null, growth: "4", fun: 2 },
    energy: { gave: ["Long walks"], drained: ["Back-to-back calls"] },
  },
  step2: {
    values: [
      { slug: "integrity", name: "Integrity", alignment: 4 },
      { slug: "family", name: "</td></tr><script>bad()</script>", alignment: 1 },
    ],
    compromise: "Worked most weekends",
  },
  step3: {
    lessons: ["Protect my mornings", "", "Ask for help"],
    lettingGo: [{ text: "Phone in bed", bucket: "habit", releasedAt: "2026-01-01" },
                { text: "The committee", bucket: "commitment", releasedAt: null }],
    closingLine: "I learned to ask for help, eventually.",
  },
  step4: {
    headline: "Left the job that was draining me \"&\" found my weekends",
    detail: "I sleep properly.",
    word: "Steady",
    themes: [{ id: "t1", text: "Protect my energy" }, { id: "t2", text: "Build something of my own" }],
  },
  step5: {
    goals: [
      { id: "g1", themeId: "t1", done: "Ten paying customers", valueSlug: "integrity",
        why: "I want to make something mine", date: "2027-06-30", habit: "Two hours每Saturday",
        firstStep: "Talk to three people" },
      { id: "g2", themeId: "t2", done: "Sleep 7 hours", valueSlug: "family", why: "", date: "", habit: "Bed by 11", firstStep: "" },
    ],
    priorityGoalId: "g2",
  },
  step6: {
    ifThen: { g1: { if: "...work runs late,", then: "...do an hour on Sunday" },
              g2: { if: "I'm wired", then: "read instead of scroll" } },
    corner: { who: ["coach", "friend", "hacker"], ask: "Ask Sam to check in monthly" },
  },
  step7: {
    noteToFutureSelf: "Go gently, and keep going.",
    livesAt: "On the fridge",
    checkIns: ["2027-01-03", "not-a-date", "2027-04-03"],
  },
};

const clean = sanitizeAnswers(hostile);
console.log("wheel:", JSON.stringify(clean.wheel));
console.log("corner.who (hacker dropped):", JSON.stringify(clean.corner.who));
console.log("checkIns (bad date dropped):", JSON.stringify(clean.checkIns));
console.log("goal order (priority first):", clean.goals.map(g => `${g.priority ? "*" : " "}${g.done}`));
console.log("goal1 theme/value resolved:", clean.goals.find(g=>g.done.startsWith("Ten"))?.theme, "|", clean.goals.find(g=>g.done.startsWith("Ten"))?.value);

const mail = visionEmail(clean, { bookingUrl: "https://example.com/book", siteUrl: "https://yearwellbuilt.com" });
console.log("\nsubject:", mail.subject);
console.log("html bytes:", mail.html.length);
console.log("no raw <script> in html:", !/<script/i.test(mail.html));
console.log("no onerror= in html:", !/onerror=/i.test(mail.html));
console.log("hostile value escaped:", mail.html.includes("&lt;/td&gt;&lt;/tr&gt;&lt;script&gt;"));
console.log("quote escaped in headline:", mail.html.includes("&quot;&amp;&quot;"));
console.log("\n--- text version ---");
console.log(mail.text.split("\n").slice(0, 28).join("\n"));

// Precise check: the only tags in the html must be ones our template wrote.
const TEMPLATE_TAGS = new Set(["!doctype html","html","head","body","div","table","tr","td","p","a","h1","em","blockquote","ol","ul","li","span","br","strong"]);
const tags = [...mail.html.matchAll(/<\/?([a-z!][a-z0-9!\s]*)/gi)]
  .map((m) => m[1].trim().toLowerCase().split(/\s/)[0]);
const unexpected = [...new Set(tags)].filter((t) => !TEMPLATE_TAGS.has(t) && t !== "!doctype");
console.log("\nunexpected tags in html:", unexpected.length ? unexpected : "none");
console.log("raw <img injected:", /<img/i.test(mail.html));
console.log("injected text present but inert:", mail.html.includes("&lt;img src=x onerror=alert(1)&gt;"));

const failed = unexpected.length || /<img/i.test(mail.html)
  || !mail.html.includes("&lt;img src=x onerror=alert(1)&gt;");
console.log(failed ? "\nEMAIL ESCAPING FAILED" : "\nAll email escaping checks passed.");
process.exit(failed ? 1 : 0);
