/*
  Render the vision document email to a file so it can be eyeballed in a
  browser without sending anything. Uses the same template /send uses.

  Run: npm run preview:email   then open preview/email.html
*/
import { writeFileSync, mkdirSync } from "node:fs";
import { sanitizeAnswers } from "../server/sanitize.js";
import { visionEmail } from "../server/email.js";

const sample = {
  yearEnding: { word: "Rebuilding" },
  step1: {
    wins: [{ text: "Finally had the conversation about my role", enabler: "I prepared properly and didn't wait for the perfect moment" }],
    challenges: [
      { text: "A project that ran six months late", lesson: "I do my best work when I protect my mornings" },
      { text: "Leaving it too long before asking for help", lesson: "Asking for help early saves months" },
    ],
    wheel: { career: 7, money: 6, health: 3, fun: 2, family: 8, friends: 5, growth: 6, purpose: 4 },
    energy: { gave: ["Long walks with no phone"], drained: ["Back-to-back video calls"] },
  },
  step2: {
    values: [
      { slug: "integrity", name: "Integrity", alignment: 4 },
      { slug: "family", name: "Family", alignment: 2 },
      { slug: "creativity", name: "Creativity", alignment: 1 },
    ],
    compromise: "I say family comes first, then worked most weekends in the spring.",
    lettingGo: [
      { text: "Checking my phone in bed", bucket: "habit", releasedAt: "2026-01-01" },
      { text: "Chairing the committee", bucket: "commitment", releasedAt: null },
      { text: "I should be further along by now", bucket: "should", releasedAt: "2026-01-01" },
    ],
    closingLine: "I learned to ask for help, eventually.",
  },
  step3: {
    headline: "Left the job that was draining me, and found my weekends again.",
    detail: "I sleep properly. I see my friends every week. Work feels like mine again.",
  },
  step4: {
    word: "Steady",
    themes: [
      { id: "t1", text: "Protect my energy" },
      { id: "t2", text: "Build something of my own" },
      { id: "t3", text: "Show up for my people" },
    ],
  },
  step5: {
    goals: [
      { id: "g1", themeId: "t2", done: "Ten paying customers for my side project", valueSlug: "creativity",
        why: "I want to make something that's mine", date: "2027-06-30",
        habit: "Two hours every Saturday morning, before anything else",
        firstStep: "Talk to three people who might buy it" },
      { id: "g2", themeId: "t1", done: "Sleep seven hours a night, most nights", valueSlug: "family",
        why: "Everything else gets harder when I'm tired", date: "2027-03-31",
        habit: "Phone out of the bedroom, lights out by eleven",
        firstStep: "Buy an alarm clock so the phone has no excuse" },
    ],
    priorityGoalId: "g2",
  },
  step6: {
    ifThen: {
      g1: { if: "...work runs late on a Friday and I'm too tired on Saturday,", then: "...do one hour on Sunday instead, no matter what" },
      g2: { if: "...I'm still wired at eleven,", then: "...read a paper book instead of reaching for my phone" },
    },
    corner: { who: ["friend", "coach"], ask: "Ask Alex to check in on my Saturday mornings once a month." },
  },
  step7: {
    noteToFutureSelf: "Go gently, and keep going.",
    livesAt: "On the fridge",
    checkIns: ["2027-01-05", "2027-04-05", "2027-07-05", "2027-10-05"],
  },
};

const clean = sanitizeAnswers(sample);
const mail = visionEmail(clean, {
  bookingUrl: process.env.PUBLIC_BOOKING_URL || "https://mattrutherfordcoaching.com/?source=ywb",
  siteUrl: process.env.PUBLIC_SITE_URL || "https://yearwellbuilt.com",
});

mkdirSync("preview", { recursive: true });
writeFileSync("preview/email.html", mail.html);
writeFileSync("preview/email.txt", `Subject: ${mail.subject}\n\n${mail.text}`);
console.log("Wrote preview/email.html and preview/email.txt");
console.log(`Subject: ${mail.subject}`);
