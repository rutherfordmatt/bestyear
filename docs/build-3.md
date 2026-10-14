# Build 3: calm the interface

Agreed 14 October 2026, after Matt walked the whole journey. Twelve notes,
but most come from three underlying problems. Not started — this is the plan.

## The three problems

**1. Too many voices.** A single prompt can stack five type treatments: serif
question, *italic* hint, sans note, bold field label, italic empty-state. The
italic hint was added so guidance couldn't be missed, and it became a third
voice competing with the other two.

**2. Hairlines everywhere.** Nine separate sources of rules on a step page:
every prompt, "Show all questions", the storage footing, the rail, each value
family, the send form, the picker's add-your-own, the bar. On a sparse screen
that is four rules with almost nothing between them.

**3. Everything is one tall column.** Roughly 400px of unused horizontal space
on every screen, while text-entry series stack vertically and repeat their
furniture. The alignment question is printed once per value — eight times
down the page.

## The rules

One question block, used everywhere, no exceptions:

```
The question            serif 1.5rem, ink
One line of guidance    sans 0.9rem, muted — not italic
[ the control ]
status                  attached to the control, never its own line
```

- **Italic is reserved for the exercise's own voice** — the transition lines
  and the document's quotes. Guidance becomes plain muted sans.
- **No empty-state sentences.** "No values chosen yet." goes; the button says it.
- **One guidance line per card set**, not per field, so the first card and the
  last card look the same.
- **Dividers earn their place**: between answered prompts only, never before
  the first, never stacked against the footer.
- **Two columns wherever there is a series of short text entries**, on wide
  screens, collapsing to one on narrow.

## The work, in order

Each numbered section is a separate commit, so it can be stopped or reviewed
part way.

### 1. The rules, and the quick fixes

- Apply the question block above: retire the italic tip, fold status into its
  control, delete empty-state lines.
- Cut the hairlines down to the ones that help scanning.
- The privacy page gets a way back into the flow — currently the only way out
  is the browser's back button.
- The energy audit shows a phantom blank field under each column, because the
  list always renders one empty row. Replace with "+ Add", matching the
  letting-go piles.
- Remove Step 1's "Some years are heavier than others" note. Nothing in the
  journey should feel like it is selling.
- Close and privacy pages still sit 180px right of the header. Carried over.

### 2. Step 1 reordered

The wheel measures where you are *now*, not the year behind, so it moves to
the end of the step: wins, challenges, energy, then the wheel as "where has
that left you". It reads as the outcome of the year rather than a survey at
the door, and it lands immediately before Step 3 asks what a 7 or 8 would
look like.

The original reason for putting it first — six text boxes before anything
visual — no longer holds, since wins and challenges now start as one each.

### 3. Step 2: picker and scoring together

Today the chosen values and their scoring sit *above* the picker, so a visitor
may not know they exist until they have finished picking and scrolled back up.
Each value is a bulky card that reprints the alignment question.

```
Choose six to eight values that matter most.

┌── PICK ──────────────┬── YOURS, AND HOW WELL YOU LIVED THEM ──┐
│ search…              │  How well did each show up?            │
│ Community            │  Community    1 2 3 4 5            ×   │
│  ○ Belonging         │  Humour       1 2 3 4 5            ×   │
│  ○ Collaboration     │  Courage      1 2 3 4 5            ×   │
│ Joy                  │                                        │
│  ○ Enthusiasm        │  3 chosen · 3 left to score            │
└──────────────────────┴────────────────────────────────────────┘
```

Eight cards become eight rows, the question is asked once, and picking and
scoring are visible at the same time. On narrow screens the chosen list sits
above the picker.

### 4. Goal cards

Two columns, labels only, guidance once above the set rather than inside the
first card — which is why card 1 and card 2 currently look like different
designs.

```
┌─ THEME 1 · Influence ──────────────────────────── ☆ priority ─┐
│ How will you know you've done it?                             │
│ [                                                           ] │
│                                                               │
│ Why it matters            │ The habit that carries it         │
│ [ value ▾ ] [          ]  │ [                               ] │
│                           │                                   │
│ This week                 │ By                                │
│ [                      ]  │ [ End of June ▾ ]                 │
└───────────────────────────────────────────────────────────────┘
```

The priority question stops being a star to find after the cards and becomes a
real choice that lists the goals.

### 5. The handover at the end of a step

The "Added to your plan" panel is liked, but the next action is in the
opposite corner. The panel spans the content column and carries
"Next: Picture it →" at its bottom right, so finishing and continuing are one
gesture. The bar keeps Back and Next for persistent navigation.

### 6. Step 7 below the document

- Check-in rows show a native date picker *and* the same date spelled out
  beside it. One of them goes.
- Tighten the stack of headings between the document and the email form.
- Add the Clarity Session block that build-2 called for — this is the page
  where people get what they came for, and the booking ask is currently only
  on the close screen, which many will never reach.

### 7. Copy pass

Every step intro to two short paragraphs, about forty words. Step 2's
three-paragraph essay is the worst of them. Matt reviews and edits
`content/*.md` afterwards; the words stay his.

## Decisions taken

- **The wheel goes last in Step 1**, framed as where the year has left you.
- **Step 6's coach note stays.** It only appears if the visitor has chosen
  "A coach" as who's in their corner, so it answers a question they raised.
  The Step 1 note being removed was unprompted; this one isn't.
- **Copy: drafted here, edited by Matt.**

## Not doing

- No new steps. The journey is seven and stays seven.
- No change to the privacy position, the storage model, or the schema.
