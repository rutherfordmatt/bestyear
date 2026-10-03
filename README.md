# Year Well Built

[yearwellbuilt.com](https://yearwellbuilt.com) — "Build your best year."

A privacy-first, interactive review-and-plan experience in seven steps. Free, and
the primary call to action is a Clarity Session booking.

Answers are stored **only in the visitor's browser**. The one piece of server code
is `POST /send`, which emails a plan and then forgets it.

## Running it

```bash
npm install
npm run dev          # Astro dev server, http://localhost:4321
npm run build        # static build into dist/
npm start            # Hono: serves dist/ and /send on :3000
npm run serve        # build, then start
npm test             # journey and email-escaping tests
npm run values       # regenerate src/lib/values.js from the Values Finder
```

Copy `.env.example` to `.env` for local work. Everything has a safe default
except the secrets, and the site runs fine without them — `/send` just refuses
to email and says so.

## How it's put together

```
content/*.md        the copy — the single source of truth, parsed at build time
docs/plan.md        scope, steps and decisions
src/lib/            storage, schema, carry-forward, dates, ics, analytics
src/islands/        Preact, only where something has to be interactive
src/components/     Astro, static
src/styles/         tokens.css first; nothing else uses a raw hex
server/             Hono: the static site plus POST /send
test/               a full journey, and the email escaping
```

**Copy** is parsed from `content/*.md` by `src/lib/content.js`, so editing the
markdown changes the site. Anything missing renders as a visible
`[PLACEHOLDER: …]` rather than disappearing.

**Storage** is one versioned localStorage key (`ywb:v1`). Everything loaded is
run through `repair()`, so a corrupt or older save degrades instead of wiping.
Autosave is debounced; subscribers are notified immediately, which is what lets
the plan panel track typing.

**Carry-forward** (`src/lib/carry-forward.js`) is the spine: energy drainers
suggest letting-go items, value gaps feed the themes, themes become goal cards,
goals get if-then plans. It all matches on stable ids, never on text, so editing
an earlier answer updates what depends on it instead of orphaning it.

**The vision document** has one renderer, used compact in the plan panel and full
on Step 7, so the preview can never disagree with what prints or gets emailed.

## Deploying to Coolify

1. **New resource → Docker Compose / Dockerfile**, pointed at
   `https://github.com/rutherfordmatt/bestyear.git`, branch `main`.
2. **Port:** 3000. The healthcheck is `GET /healthz`.
3. **Build arguments** — these are baked into the static build, so they must be
   set as *build* args, not just runtime env:
   - `PUBLIC_SITE_URL` — e.g. `https://staging.yearwellbuilt.com`
   - `PUBLIC_BOOKING_URL` — `https://mattrutherfordcoaching.com/?source=ywb`
   - `PUBLIC_VALUES_FINDER_URL` — `https://thevaluesfinder.com`
   - `PUBLIC_UMAMI_SITE_ID` — leave blank until the site exists in Umami
   - `PUBLIC_UMAMI_SCRIPT_URL` — `https://analytics.stff.me/script.js`
4. **Runtime environment variables** (secrets — never in the repo):
   - `RESEND_API_KEY`
   - `MAIL_FROM` — `Matt at Year Well Built <hello@yearwellbuilt.com>`
   - `MAIL_REPLY_TO` — `matt@mattrutherford.co.uk`
   - `GHOST_ADMIN_API_URL` — **the non-redirecting admin domain.** A redirect
     strips the Authorization header and Ghost answers 403.
   - `GHOST_ADMIN_API_KEY`, `GHOST_MEMBER_LABEL=ywb`
5. **DNS** on Namecheap → the Hetzner box; Coolify issues the Let's Encrypt cert.
6. Auto-deploy on push to `main`.

### Still to do before launch

- [ ] Resend account, verify `yearwellbuilt.com`, create the API key
- [ ] Ghost custom integration (Admin API key) and a `ywb` label
- [ ] Add yearwellbuilt.com in Umami, set `PUBLIC_UMAMI_SITE_ID`, redeploy
- [ ] Apply the Values Finder changes in `docs/values-finder-changes.md`
- [ ] Swap `PUBLIC_BOOKING_URL` to the real booking link when it's live

## Analytics

Umami only, and only when `PUBLIC_UMAMI_SITE_ID` is set. With it unset the script
tag isn't rendered and every `track()` call is a no-op, so there is no
third-party request at all.

Events: `step-1-reached` … `step-7-reached`, `setup-started`, `values-imported`,
`document-emailed`, `booking-clicked`, `ics-downloaded`, `answers-exported`,
`answers-cleared`, `document-printed`.

URL fragments are never read into analytics — that's where values from the
Values Finder arrive.

## The rules that aren't negotiable

See `CLAUDE.md`. The short version: answers never leave the device unless asked
for; `/send` accepts JSON and renders the email itself; no third-party scripts
but Umami; and no year is ever hard-coded.
