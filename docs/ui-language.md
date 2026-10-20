# What to call things

Shared names for the parts of the interface, so feedback can point at one
thing without ambiguity. Each name is the CSS class too, so "the rail is
jumping" is enough for me to find it.

## The frame

Every step page is the same three parts.

```
┌──────────────────────────────────────────────────────────┐
│  Year Well Built                      COACHING NEWSLETTER │  ← header
├──────────────────────────────────────────────────────────┤
│  LOOK BACK        IMAGINE      PLAN        COMMIT         │  ← rail
│  ✓1  ●2           3  4         5  6        7              │
└──────────────────────────────────────────────────────────┘
           … the step's content …
┌──────────────────────────────────────────────────────────┐
│     BACK          ● ● ○ ○ ○          [ NEXT → ]           │  ← deck nav
└──────────────────────────────────────────────────────────┘
```

| Name | What it is | Where |
| --- | --- | --- |
| **header** | Wordmark and the two links. On every page. | `Base.astro` |
| **rail** | The progress strip: four **phases**, seven **steps**. Ticks for done. | `PhaseRail.jsx` |
| **deck nav** | Under the card: Back, the dots, and the way on. | `CardDeck.jsx` |
| **footer** | One row across the bottom: the **footing** on the left, credit and Privacy on the right. | `Base.astro` |

The **footing** is "Your answers stay on this device. Manage my answers" — the
backup, restore and clear controls. It lives inside the footer rather than
above it: two rules a few lines apart read as two footers, and the visitor
only has one.

A **phase** is one of the four groupings — Look back, Imagine, Plan, Commit.
A **step** is one of the seven numbered stages.

## Inside a step

```
┌─ card ───────────────────────────────────────────────────┐
│                                                          │
│   What are you leaving behind?            ← question     │
│   Your energy drainers from Step 1 are…   ← guidance     │
│                                                          │
│   [ the fields ]                          ← control(s)   │
│                              ┌──────────────────────┐    │
│                              │ A HEAD START         │    │
│                              │ …                    │ ← aside
│                              └──────────────────────┘    │
└──────────────────────────────────────────────────────────┘
    BACK            ● ● ● ○ ○                  [ NEXT → ]
                      ↑ dots                     ↑ deck nav
```

| Name | What it is |
| --- | --- |
| **deck** | The set of cards that make up one step. |
| **card** | One screen in the deck. Moves sideways. |
| **dots** | Position within the deck. Clickable. |
| **card reference** | The small number in a card's corner — "2.4" is step 2, card 4. Setup is step 0. Point at one to ask for a change. |
| **question** | The serif line asking the thing. |
| **guidance** | The one muted line under it. (Was "hint" — that word is retired.) |
| **control** | The input, textarea, chips, sliders, dial. |
| **aside** | The panel beside a control — usually carry-forward. |
| **carry-forward** | An answer from an earlier step, surfaced where it helps. Labelled "From Step N". |

## Card types

| Type | What it is for |
| --- | --- |
| **scene card** | You setting up the step: its title and framing, no fields. Also called the **interstitial**. |
| **question card** | One question, its guidance, its control. The default. |
| **moment card** | A question that is the point of the exercise, not a form field — the closing line, the headline, the word. Question large and centred, one field, nothing else. |
| **wide card** | A question needing the full column — the values panel, the letting-go piles. |
| **summary card** | "Added to your plan": what landed, the hand-over line, the way on. |

## Elsewhere

| Name | What it is |
| --- | --- |
| **the document** | The one-page plan on Step 7. Also "the vision document", "the one-pager". |
| **the panel** | The values pick-and-score, shared by the page and the deck. |
| **the piles** | The three letting-go columns: habits, commitments, shoulds. |
| **the wheel** | The eight-area life wheel and its radar chart. |
| **the dial** | The 1–5 slider beside a value — the same control as the life wheel's, so scoring is one gesture across the journey. |

## Type and spacing

| Name | What it means |
| --- | --- |
| **token** | A named value in `tokens.css`. No raw hex or pixel values anywhere else. |
| **measure** | How wide a block of text is allowed to run. |
| **the eyebrow** | The small uppercase accent-coloured (ochre) label above a title. Class is `.label`. |
| **serif / sans** | Cormorant Garamond for titles, questions and the document. Inter for everything else, including every input. |

Italic has one job: the exercise's own voice — the hand-over lines between
steps, and quotes on the document. Not guidance, not labels, not fields.

## Horizontal or vertical?

The deck moves **sideways**, deliberately:

- Vertical movement already belongs to the page. A card taller than the
  window has to scroll down, and a deck that also moves down would fight it.
- Sideways says "this is a sequence you are being taken through", where
  up-and-down says "there is more of the same below".
- It matches how the thing is described — cards, a deck, slides.

Cards having different heights is a separate problem from direction, and the
fix is a floor rather than a direction change: a card with a control is at
least 20rem tall, so short ones do not collapse and the frame stays still as
you move. Tall ones still grow, and the viewport follows. Scene and summary
cards are exempt — they have no fields, so a floor would only leave a
screenful of white under the words.

The **deck nav is anchored**, which matters more than the floor: the deck
fills the space down to the footer, so Back, the dots and the way on sit in
the same place on every card instead of riding up and down with the card's
height. The space is measured in the island — the deck's own top, the
window, and the footer's real height — so there is no magic number to go
stale. A card taller than the space still pushes the nav below the fold, and
then the page scrolls, which is right.
