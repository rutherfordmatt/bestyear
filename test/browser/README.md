# Browser tests

These drive a real headless Chrome against the dev server, because the
layout bugs in this project have mostly been things that look right in the
code and silently do nothing in the browser.

## Running them

```bash
npm run dev                  # in one terminal
npm run test:browser         # in another
```

`test:browser` launches headless Chrome, runs both scripts, and shuts it down.

- **`audit.mjs`** — compares the same elements across every page (position,
  font, colour, spacing) and flags anything that differs between them.
- **`print.mjs`** — renders a complete plan to PDF and fails if it needs more
  than one sheet. The document is meant to be pinned up, so that is a
  requirement rather than a preference.
- **`workflow.mjs`** — walks the whole journey as a visitor: chooses a pace,
  fills each step, checks that the next question is revealed only when it
  should be, that answers carry forward between steps, that the document
  assembles, and that resume and clear behave.

## Seeding answers

Use `c.seed(stateObject)` BEFORE navigating. `storage.js` caches state in
memory on first read, so setting localStorage after a page has booted is
ignored and then overwritten by the next save. `seed()` installs the value
before any page script runs. `fixture-plan.mjs` holds a complete plan.

## Traps worth knowing

`innerText` returns the **rendered** text, so it reflects `text-transform`.
Buttons here are CSS-uppercased, so matching on `innerText` against the real
copy silently fails. Use `textContent`.
