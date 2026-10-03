# Year Well Built: Interactive Site Plan

Tagline: "Build your best year". Domain: yearwellbuilt.com.

Live version of this plan: https://claude.ai/code/artifact/2252bb03-9790-4f98-a3c1-1b8f7138fa65 (the online doc wins if the two ever disagree).

## Summary

Relaunch the Build Your Best Year email course as Year Well Built: a standalone, privacy-first, interactive site. MVP built in two days in the week of 5 October, public launch Monday 16 November. The primary goal is Clarity Session bookings; newsletter sign-ups are a bonus.

**Why it's worth doing**

- About 150 people completed the EmailOctopus course last year from a passive sidebar link alone.
- The season does the marketing: reflection and planning content peaks from mid-November to mid-January.
- One Clarity Session at €495 covers the effort.
- The interactive format fixes the email course's core weakness: people read the email, mean to do it later, and never write anything down. The site captures answers and hands back a finished vision document.

**Risks**

- **Timing.** The build overlaps the 1 November business start. MVP scope must stay small.
- **Distribution.** The bottleneck is visitors, not the build.
- **Scope creep.** Accounts, dashboards and AI features are not needed for v1.

## Product principles

Privacy first, then interactivity, then looks. When they conflict, privacy wins.

**Privacy**

- Answers live only in the visitor's browser. No accounts, no database of reflections, no server copy.
- The server only ever sees an email address, and only when someone asks for something to be sent.
- Emailed documents are generated, sent, then discarded.
- Cookieless analytics (Umami), so no consent banner.
- "Clear all my answers" button and a plain-English privacy note on the first screen: "Your answers stay on this device."

**Interactivity**

- Every step produces something visible: a chart, a board, a card. No step is just a text box.
- Answers autosave and carry forward (energy drainers into letting go, value gaps into themes, themes into goals, goals into obstacles).
- Progress is visible throughout; the vision document builds up piece by piece.

**Good looks**

- Visual language taken from thevaluesfinder.com and mattrutherfordcoaching.com, so the three sites feel like one family.
- Fonts, colours and spacing pulled from those sites' code into shared design tokens.
- The vision document is the hero: good enough to print and pin up.

**Evergreen**

- Year-neutral copy everywhere. No hard-coded years in copy, UI or emails. A light refresh each season.

## Experience outline

Seven steps in four phases: look back, turn, plan, commit. Closure comes before planning, the future is pictured before goals are set, and the journey ends with a rhythm for coming back to the plan.

| Phase | Step | What the visitor does | Interactive output |
| --- | --- | --- | --- |
| | Setup | Picks a pace (one sitting or one step a day), names the year ending in a word or phrase | Title card |
| Look back | 1. The year you had | Wins and challenges; rates six life areas; energy audit | Life-wheel radar chart, lists |
| Look back | 2. What matters | Imports values from thevaluesfinder.com or picks from the same list; rates alignment; names where they compromised | Values cards; big gaps highlighted and carried forward |
| Look back | 3. Lessons and letting go | Three lessons; habits, commitments and "shoulds" to leave behind; a closing line for the year | Lesson cards, "let go" list with a satisfying cross-out |
| Turn | 4. Imagine the year ahead | Future-self headline and detail; word for the year; three themes | Headline card, word card, theme cards |
| Plan | 5. Goals | Up to three goals (one per theme): what done looks like, why (value), date, supporting habit, first step; picks one priority | Goal cards, priority starred |
| Plan | 6. Obstacles and support | If-then plan per goal (including inner obstacles); who's in your corner and what to ask them | If-then cards, "my corner" card |
| Commit | 7. Your year, on one page | Reviews and edits the document; note to future self; where the page will live; check-in dates | One-pager, Save as PDF, email to self, .ics check-ins |
| | Close | Clarity Session CTA (bring your document); optional newsletter | Booking CTA, sign-up |
| | Later (v1.1) | Daily nudges (7-day pace) and quarterly check-in emails | Resend emails |

**Coaching touchpoints (natural, not pushy)**

- After Step 1: a soft note if the year was heavy.
- Step 2: big value gaps are highlighted.
- Step 6: "A coach" is one option in "who's in your corner", with a gentle follow-up if chosen.
- Close: the vision document is framed as pre-work for a Clarity Session.
- Quarterly check-in: "What's drifted?" is the highest-intent moment for coaching.

## Values Finder integration (two-way, MVP)

- **Year Well Built to Values Finder.** Step 2 offers "Find your values first", opening thevaluesfinder.com with a return link. Results come straight back into Step 2.
- **Values Finder to Year Well Built.** The Values Finder results page gets a CTA: "Put your values to work: build your year." Values arrive pre-filled.
- **Hand-off by URL fragment**, e.g. `yearwellbuilt.com/#values=integrity,family,growth`. Fragments never reach a server or analytics.
- Both sites must use identical value names and slugs.

## Email capture and conversion

No gate at the start. Ask for an email only when sending something genuinely helps.

1. "Email me my vision document" at Step 7 (main capture point).
2. "Send me a nudge each day" at setup, for the 7-day pace (v1.1). Address deleted after the last nudge.
3. "Remind me to check in on my plan", quarterly (v1.1).

- Newsletter opt-in is a separate, unticked box. Only ticked boxes create a Ghost member, labelled `ywb`.
- The close frames the Clarity Session around the document they've just made. The emailed document carries the same CTA.
- Booking links go to Cal.com with `?source=ywb`.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Astro, static output, small vanilla or Preact islands |
| Storage | localStorage, versioned JSON schema; download/import answers as JSON |
| Charts | Hand-rolled SVG |
| PDF | Print stylesheet and "Save as PDF" for MVP; generated PDF in v1.1 |
| Endpoint | Hono, one route `/send`, stores nothing |
| Email | Resend, sending from yearwellbuilt.com |
| Newsletter | Ghost Admin API, label `ywb`, only when ticked. Use the non-redirecting Ghost URL or the auth header is stripped (403) |
| Spam | Honeypot and rate limit on `/send` |
| Analytics | Umami at analytics.stff.me, one event per step |
| Hosting | Coolify on Hetzner, Let's Encrypt SSL, Namecheap DNS, GitHub auto-deploy |

## Two-day MVP build plan

**Before the build days**

- [x] Register yearwellbuilt.com on Namecheap
- [ ] Draft copy into the files in `content/`
- [x] Coaching site repo: /Users/mattrutherford/Dev/MattRutherfordCoaching
- [x] Values Finder repo: /Users/mattrutherford/Dev/Values
- [x] Project repo: /Users/mattrutherford/Dev/bestyear (docs/ and content/ are copied in from Documents/Claude/Yearwellbuilt at kickoff)
- [ ] Create a Resend account and verify yearwellbuilt.com (instructions during the build)
- [ ] Create a Ghost custom integration (Admin API key) and a `ywb` label
- [ ] Follow-up, not blocking: swap the Clarity Session CTA to the real booking link once it's live on the coaching site (points at mattrutherfordcoaching.com/?source=ywb until then)
- [ ] At deploy time: add yearwellbuilt.com as a site in Umami and set the site ID in Coolify

**Day 1: the journey**

- [ ] Scaffold Astro project, GitHub repo, Coolify app with auto-deploy to a staging subdomain
- [ ] Design tokens and components from the sibling sites, light and dark
- [ ] Storage layer: versioned schema, autosave, clear all, export and import
- [ ] Landing page and setup screen
- [ ] Step shell: progress, back and next, resume
- [ ] Steps 1 to 3: life wheel, Values Finder import and pick-list fallback, lessons and letting go

**Day 2: the output and going live**

- [ ] Steps 4 to 6: future headline, themes, goals with priority, if-then plans, my corner
- [ ] Step 7 vision document with print stylesheet, and .ics check-in download
- [ ] `/send` endpoint with Resend and optional Ghost opt-in
- [ ] Close screen
- [ ] Umami events; privacy page
- [ ] Mobile and accessibility pass, Lighthouse check
- [ ] Production domain, end-to-end test on phone and laptop

## Launch

1. To 4 October: content rewrite and pre-build checklist.
2. Week of 5 October: two build days, MVP on staging.
3. 12 to 30 October: five to ten testers; add nudges and quarterly reminders if time allows.
4. 2 to 13 November: production live, soft share, cancel EmailOctopus once Resend is proven, point the Ghost sidebar at the new site, check nothing links to buildyourbestyear.com (owned by an unrelated business).
5. Monday 16 November: launch via newsletter, LinkedIn, coaching Instagram and Threads, and a Ghost post.
6. Late November to December: weekly social posts.
7. Monday 4 January: second push.

| Metric (Nov to Jan) | Suggested target |
| --- | --- |
| Landing page visitors | 2,000 |
| Started setup | 600 |
| Reached Step 7 | 200 |
| Emailed their document | 120 |
| Newsletter opt-ins | 60 |
| Clarity Sessions booked | 3 |
