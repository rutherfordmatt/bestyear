# Year Well Built — working notes

**yearwellbuilt.com** · tagline "Build your best year". A privacy-first, interactive
7-step review-and-plan experience. A free lead magnet for Matt Rutherford's coaching
practice. Primary goal: Clarity Session bookings. Newsletter sign-ups are a bonus.

`docs/plan.md` is the source of truth for scope, steps and decisions.
`docs/original-course.md` is the old email course, reference only.
Copy lives in `content/*.md` and is parsed at build time — **edit the markdown, not
the markup.** Where copy is missing, render a visibly marked placeholder.

## Non-negotiables

### Privacy
- Answers are stored **only** in the visitor's browser (localStorage), versioned
  schema, autosave on input.
- **No accounts, no database, no cookies, no third-party scripts other than Umami.**
  Fonts are self-hosted via `@fontsource` for this reason — never add a Google Fonts
  link back in.
- "Clear all my answers" and "Download / import my answers" (JSON) available throughout.
- The only server code is **one endpoint, `/send`**. It receives an email address, the
  answers as **JSON** (never client-rendered HTML), and optional opt-ins. It validates
  and length-caps every field, renders the email server-side from our own template with
  all text escaped, sends via Resend from yearwellbuilt.com, optionally creates a Ghost
  member with the label `ywb` (only if the newsletter box was ticked), then discards
  everything. Honeypot field, rate limited **per IP and per recipient address**. No captcha.
- URL fragments (`#values=…`) must never reach the server or analytics. Read them,
  save to localStorage, then strip the fragment from the address bar.

### Evergreen
- **Never hard-code a year** anywhere in copy, UI or emails. Dates are derived from
  "today" at runtime.

### Quality
- Mobile first, WCAG AA, keyboard accessible, fast (target Lighthouse 95+).
- Light theme only for MVP. Tokens are **dark-ready** — every colour is a role token
  on `:root`. Do not add a dark palette, a toggle or a `prefers-color-scheme` switch
  until the palette is signed off. The vision document and print stylesheet are
  **always light**.

## Stack

- **Astro**, static output. Small Preact islands only where interactivity needs them.
- **Hono** for `/send`, same repo (`server/`), serves the built site too — one container.
- Deployed to **Coolify** on Hetzner via Docker, GitHub auto-deploy. SSL via
  Coolify/Let's Encrypt, DNS on Namecheap.
- **Umami** at analytics.stff.me. One custom event per step reached, plus document
  emailed and booking clicked. Read the site ID from `PUBLIC_UMAMI_SITE_ID`; the script
  and **all** event calls are silent no-ops when it's unset.
- Charts are **hand-rolled SVG**. No chart libraries.
- Secrets (Resend, Ghost) come from environment variables. See `.env.example`.
  **Never commit real keys.**

## Design

Visual language is shared with two sibling sites so the three feel like one family:
- thevaluesfinder.com — `/Users/mattrutherford/Dev/Values`
- mattrutherfordcoaching.com — `/Users/mattrutherford/Dev/MattRutherfordCoaching`

Tokens live in `src/styles/tokens.css`. **No raw hex anywhere else.** Key traits:
Cormorant Garamond display + Inter body, teal `#3A6B6B`, warm off-white `#FAFAF8`,
**2px radius everywhere** (both sibling sites are square), uppercase letterspaced
buttons and eyebrow labels, long soft shadows.

## Values Finder integration (two-way)

- `src/lib/values.js` is **generated** — run `npm run values` to rebuild it from the
  Values Finder's own list. Never hand-edit it.
- Slug rule, verified against all 155 values: `name.toLowerCase()` with spaces replaced
  by hyphens. Both sites must stay identical.
- Step 2 offers "Find your values first", linking out with a return URL.
- Values come back by **URL fragment only**: `yearwellbuilt.com/#values=integrity,family`.
- The matching Values Finder change is written up in `docs/values-finder-changes.md`.
  **Do not touch that repo** without asking.

## Config that must stay in one place

- `PUBLIC_BOOKING_URL` — the Clarity Session CTA. Online booking isn't live yet, so it
  points at `https://mattrutherfordcoaching.com/?source=ywb`. Swapping in the real link
  must not mean touching copy.
- `PUBLIC_UMAMI_SITE_ID` — unset until deploy.
- Contact address: `matt@mattrutherford.co.uk`.

## Deferred to v1.1 (flagged off in `src/lib/config.js`)

Daily nudge emails (the setup email field stays hidden), quarterly check-in emails,
server-generated PDF, dark theme.

## How to work

- Commit after each working milestone, clear messages, push to `main`.
- Flag anything in `docs/plan.md` that looks wrong or unbuildable rather than quietly
  working around it.
