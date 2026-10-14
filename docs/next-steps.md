# What's left

As of 14 October 2026, end of the card-deck polish session. Scope and decisions live in `docs/plan.md`; this is the
working list of what remains.

The MVP journey is built and working end to end locally: landing, setup, steps
1–7, the vision document, the close screen, privacy, and the `/send` endpoint.
What's left is mostly things only Matt can do, plus a short polish list.

## 1. Blocked on Matt

Nothing below can be done from the code side. The first four block the staging
deploy, which blocks testing with real people.

- [ ] **Resend** — create the account, verify `yearwellbuilt.com`, generate an
      API key. Until this exists, `/send` correctly refuses and tells the
      visitor to use Save as PDF.
- [ ] **Ghost** — create a custom integration for the Admin API key, and a
      `ywb` label. Use the **non-redirecting** admin URL or the auth header is
      stripped and Ghost answers 403.
- [ ] **Umami** — add yearwellbuilt.com as a site, set `PUBLIC_UMAMI_SITE_ID`.
      Until it's set, no script loads and every event is a silent no-op.
- [ ] **Coolify** — create the app against this repo, point it at a staging
      subdomain, set the build args and runtime secrets. The split is in
      `README.md` under "Deploying to Coolify".
- [ ] **Confirm the newsletter URL.** The header's Newsletter link currently
      defaults to `https://www.mattrutherford.co.uk`, taken from the Values
      Finder's own `.env.example`. If Stuff that MattRs lives elsewhere, set
      `PUBLIC_NEWSLETTER_URL`.
- [ ] **Decide on the Values Finder changes.** `docs/values-finder-changes.md`
      specifies all four. That repo has not been touched. One is
      security-relevant: the return URL needs validating against an origin
      allowlist, or it's an open redirect.

## 2. Waiting on Matt's next pass

He walked the deck on the evening of 14 October and these came out of it,
all fixed and pushed: the footings merged into one footer, the deck nav
anchored above it, setup's two opening cards merged, the deck no longer
sliding while you type, the life wheel four-and-four with the shape below,
the values scored on the wheel's own slider with an × to un-pick, every
moment card using one field treatment, goal cards naming their theme and
asking for a commitment rather than six fields, one spacing rhythm inside a
card, Back going back one card across steps, and Save as PDF printing the
whole plan instead of blank pages.

Open from that session:

- [ ] **The hand-over dot appears mid-typing.** On 0.2 the third dot arrives
      with the first keystroke, because the hand-over card only exists once
      there is a word. The alternative is to always show it and have it read
      differently when empty. Matt has seen it; no decision yet.
- [ ] **Unscored values on the plan.** The document prints "lived it n/5"
      only for values that were scored. Matt noticed the gap — worth asking
      whether an unscored value should say so.
- [ ] **Inline editing on the document.** Two lines are editable (the
      headline and the closing line) and nothing else. The affordance is
      quiet now and the guidance is honest, but the feature is still odd:
      either make everything editable or nothing.

## 3. Build work remaining

Short. The two rebuild passes in `docs/build-2.md` and `docs/build-3.md` are
done: the journey is rebalanced, the interface calmed, and every page shares
one left edge.

- [ ] **Navigation.** View transitions between steps, so the journey reads as
      one continuous thing rather than seven page loads. The rail now has
      2–2–2–1 to express. The last item from `build-2.md`.
- [ ] **Instrument the funnel.** We track nine events but not *reached the
      close screen* or *subscribed*, so the drop-off between Step 7 and the
      close is invisible — which is the thing we most want to see. The Step 7
      booking CTA itself is now in.
- [ ] **Review the email.** `npm run preview:email` renders it from the real
      template into `preview/email.html`.
- [ ] **Read the copy.** Every intro was rewritten in build 3 and every file
      is marked LIVE, but the words are mine, not Matt's. `content/*.md` is
      plain markdown.

## 4. Testing, once staging is up

- [ ] End-to-end on a real phone and a laptop: the whole journey, resume,
      clear, backup and restore.
- [ ] `/send` with a real Resend key — the email itself, and the Ghost opt-in
      creating a member with the `ywb` label.
- [ ] The Values Finder hand-off, both directions, once that side is changed.
- [ ] Print and Save as PDF from Step 7, on paper and on screen.
- [ ] The `.ics` download opening correctly in Apple Calendar and Google
      Calendar.
- [ ] Lighthouse, targeting 95+. Nothing obvious stands in the way: no
      third-party requests, fonts self-hosted and subset, ~100kB of JS across
      the whole site.

## 5. Decisions still open

- **Dark theme.** Deferred for MVP. The tokens are structured for it; the
  palette needs signing off. Both sibling sites are light-only, so if it lands
  here they should follow.
- **Step 7 and progressive disclosure.** Every other step reveals its
  questions one at a time. Step 7 does not, deliberately: gating it would put
  the email capture behind an optional note to your future self.
- **The prose measure.** Set to 40rem, about 80 characters — slightly wider
  than the classic comfortable range, chosen so the text relates to the
  headline and the column. If it reads long, 38rem is the alternative.
- **`/send` rate limits.** 5 sends per hour per IP, 3 per day per recipient,
  plus a 30/hour abuse guard. Fine for normal use; worth a look before a launch
  push.

## 6. After launch (v1.1)

All flagged off in `src/lib/config.js`:

- Daily nudge emails for the one-step-a-day pace. The setup email field is
  hidden until this exists, so no address is collected that can't be used.
- Quarterly check-in emails.
- A generated PDF, rather than the print stylesheet.

## Timeline, from `docs/plan.md`

| When | What |
| --- | --- |
| Now | Staging deploy, once the accounts above exist |
| 12–30 Oct | Five to ten testers |
| 2–13 Nov | Production live, soft share, cancel EmailOctopus once Resend is proven, point the Ghost sidebar here, check nothing still links to buildyourbestyear.com |
| Mon 16 Nov | Launch: newsletter, LinkedIn, Instagram, Threads, Ghost post |
| Mon 4 Jan | Second push |
