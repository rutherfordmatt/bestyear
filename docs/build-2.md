# Build 2: rebalance, and build for the funnel

Agreed 8 October 2026, after testing with friends. `docs/plan.md` still holds
the overall scope; this covers what changes and in what order.

## The problem

Measured, not guessed:

| Phase | Steps | Minutes | Share of time | Input fields |
| --- | --- | --- | --- | --- |
| Look back | 3 | 30 | **43%** | 28 |
| Turn | 1 | 10 | 14% | 6 |
| Plan | 2 | 20 | 29% | 25 |
| Commit | 1 | 8 | 11% | 6 |

Three separate causes:

1. **The rail advertises it.** `LOOK BACK ①②③` is the first and widest block,
   and the landing page lists three backward steps before any forward one.
2. **The heaviest step is first.** Step 1 is 22 fields and 12 minutes, and it
   opens with six text boxes before anything visual appears.
3. **The review repeats itself.** Step 1 asks "What did it teach you?" for each
   of three challenges; Step 3 then asks "What are three things this year
   taught you?" — and its own hint says to go back and read Step 1. Six fields
   for the same material.

## The new shape

Still seven steps. The balance inverts from 3 back / 4 forward to **2 back /
5 forward**, and the time split from 43% to roughly 38% — without cutting
anything of substance.

| Phase | Step | Was |
| --- | --- | --- |
| **Look back** | 1. The year you had | Step 1, reordered and trimmed |
| **Look back** | 2. What matters, and what doesn't | Steps 2 + 3 merged |
| **Imagine** | 3. Picture it | Step 4, first half |
| **Imagine** | 4. Your compass | Step 4, second half |
| **Plan** | 5. Goals | Step 5 |
| **Plan** | 6. Obstacles and support | Step 6 |
| **Commit** | 7. Your year, on one page | Step 7 |

"Turn" becomes "Imagine" — plainer, and it leans forward.

## The work, in order

### 1. Rebalance the journey

- **Drop Step 3's lessons prompt.** The lessons already exist as the
  "What did it teach you?" follow-ups on Step 1's challenges. The vision
  document pulls them from there. Removes three redundant fields.
- **Merge what remains of Step 3 into Step 2.** "What matters, and what
  doesn't": values → alignment → where you compromised → what you're leaving
  behind → the closing line. It has a clean arc: what you keep, what you drop,
  how the chapter ends. The letting-go cross-out and the energy-drainer
  suggestions move with it.
- **Split Step 4 into two.** *Picture it* (the headline and the detail) and
  *Your compass* (the word and the three themes). Each gets a proper artefact
  and about five minutes. This adds weight to the imagining, not the planning.
- **Renumber everything.** Steps, routes, the carry-forward map, the "From
  Step N" labels, the content filenames, and the browser tests.

### 2. Fix the on-ramp

- **Lead Step 1 with the life wheel.** Sliders first: the radar appears within
  a minute, so the first thing that happens is visible rather than typed.
  Wins, challenges and the energy audit follow.
- **Require one win and one challenge**, with "add another" for the second and
  third. Three is an aspiration, not an entry fee. Roughly halves the typing in
  the heaviest step.

### 3. Widen the life wheel to eight areas

Six is thin against the classic eight, and the two most useful signals for a
career and leadership audience — the people around you, and whether any of it
means anything — are currently collapsed into one axis or missing.

| # | Area | What it covers |
| --- | --- | --- |
| 1 | Career | Your work, your progress, and whether it still fits |
| 2 | Money | How secure and in control you feel, not the number |
| 3 | Health | Sleep, movement, food and how your body feels |
| 4 | Family | Partner, children, the people closest to you |
| 5 | Friends | The wider circle, and feeling part of something |
| 6 | Growth | Learning, curiosity and becoming more of who you want to be |
| 7 | Fun | Play, rest, adventure and things done purely for joy |
| 8 | **Purpose** | Whether what you do feels like it matters |

Eight, not ten: ten starts to feel like a survey, and the radar gets crowded.

Two useful side effects. The labels get shorter — "Relationships" (13
characters) was the one overflowing the chart, and every new name is seven
characters or fewer. And an octagon reads better than a hexagon.

**Needs a decision:** the eighth area. *Purpose* is my recommendation because
it feeds the rest of the journey — a low score there flows into the values
step and the themes. The classic alternative is *Space* (home and
surroundings), which is a real gap for many people but connects to nothing
downstream.

**Migration:** existing saves have six keys. `repair()` already returns `null`
for anything missing, so an old save simply shows two unrated areas. No data
loss, no migration hop needed.

### 4. Copy pass

- **"Anchor" twice in two sentences** in the Step 2 intro. Keep one. The
  landing page's "Anchor it in what matters" is fine — it's the only other use.
- Rewrite Step 2's intro to cover the merged content.
- New copy for the two Imagine steps.
- Read every file for the guided voice: calm, practical, methodical, and
  recognisably Matt rather than an app. The transition lines between steps are
  where that voice lives hardest — they are the exercise speaking back.
- Change `Status: DRAFT` to `Status: LIVE` once each file is read through.

### 5. The artefact

The one-page plan is the thing people keep, and it carries both other
outcomes. It deserves more than it currently gets.

- Design the printed page properly as a page — not a web page that happens to
  print. Typography, hierarchy, and the headline and word as the hero.
- Check it on paper at A4, not just in the print preview.
- Make the radar chart print well: it is the one piece of visual interest.
- Decide whether the printed footer carries anything beyond "Built at
  yearwellbuilt.com". It is your artefact; a discreet line is reasonable, a
  marketing block is not.

### 6. The funnel

Three outcomes, in priority order: a Clarity Session booking, a newsletter
subscriber, and a one-page plan worth keeping. The plan is the vehicle for
the other two.

**The leak.** The booking CTA appears on Step 6 (only if someone picks "a
coach"), on the close screen, and in the email. It is **not** on Step 7 — the
page where people get what they came for, and where many will stop. The
primary conversion currently sits one click past the moment of maximum value.

- **Add a Clarity Session block to Step 7**, below the document actions,
  framed as it already is on the close screen: the document you just made is
  the pre-work. Quiet, not a banner.
- **Make "Finish" worth pressing.** The last button currently just says
  "Finish". It should say where it goes.
- **Keep the newsletter ask where it is** — the checkbox in the email form and
  the standalone form on the close screen. Two asks is enough; a third would
  cheapen it.
- **Instrument the funnel.** We currently track steps, document emailed,
  booking clicked, print and .ics. Add: close screen reached, newsletter
  subscribed, and document completed without emailing. Without those the
  drop-off between Step 7 and the close screen is invisible, which is exactly
  the thing we are trying to fix.
- **Note on retention:** the .ics check-ins are the MVP's only return loop. The
  quarterly check-in email in v1.1 is, by your own plan, the highest-intent
  coaching moment in the whole product. Worth pulling forward once the MVP is
  live.

### 7. Navigation

The brief is that this should feel guided, calm and methodical — like being
coached through it rather than filling in a form.

- **View transitions between steps.** Astro's `ClientRouter` animates
  navigation so the journey reads as one continuous thing rather than a series
  of page loads. The single biggest upgrade to how it *feels*. Needs testing:
  islands re-hydrate on navigation, and all state is in localStorage, so it
  should be safe — but it gets verified in the browser harness before it stays.
- **Refine the rail.** It works, but it is still chips in a band. With phases
  at 2–2–2–1 it has a better shape to express: a journey with a turn in the
  middle rather than a list of seven things.
- **The bottom bar** gets the same pass.

### 8. Verify

- Update `test/browser/workflow.mjs` for the new structure — it currently
  asserts the old step numbering, so it will fail loudly until it is updated,
  which is the point.
- Re-run `test/browser/audit.mjs` across the renumbered pages.
- Fix the close and privacy alignment carried over from the last session: both
  sit 180px right of the header.
- Lighthouse, and a real phone.

## Decisions needed

1. **The eighth life area** — Purpose (recommended) or Space.
2. **"Imagine" as the phase name**, replacing "Turn".
3. **The printed footer** — anything beyond "Built at yearwellbuilt.com"?

## Deliberately not doing

- **Not adding steps to Plan.** It would balance the count and make the whole
  thing longer, which is the opposite of what we are trying to achieve.
- **Not opening with the future.** It would kill the retro perception
  completely, but it contradicts the argument the copy itself makes — that
  most planning starts in the wrong place, with the future. That is the
  coaching insight the product is built on.
- **Not bringing back the live plan panel.** It was removed for good reason.
  The "Added to your plan" moments carry that job.
- **Not gating anything behind an email.** No change to the privacy position.
