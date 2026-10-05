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
- **`workflow.mjs`** — walks the whole journey as a visitor: chooses a pace,
  fills each step, checks that the next question is revealed only when it
  should be, that answers carry forward between steps, that the document
  assembles, and that resume and clear behave.

## A trap worth knowing

`innerText` returns the **rendered** text, so it reflects `text-transform`.
Buttons here are CSS-uppercased, so matching on `innerText` against the real
copy silently fails. Use `textContent`.
