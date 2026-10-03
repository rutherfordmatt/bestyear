# Changes needed on the Values Finder side

Status: **Not yet applied.** This is a specification only — nothing in
`/Users/mattrutherford/Dev/Values` has been touched.

The Year Well Built side of the hand-off is already built and working. What
follows is everything the Values Finder needs so the two sites talk both ways.

## Summary

| Direction | What happens | Side that needs work |
| --- | --- | --- |
| YWB → VF | Step 2 offers "Find my values", linking out with a return URL | **Done** (YWB) |
| VF → YWB | Results page gets a CTA that builds `#values=…` | **Needed** (VF) |
| VF → YWB | VF accepts and honours a `return` parameter | **Needed** (VF) |

## The contract

### Value names and slugs

Both sites must use identical names and slugs. The rule, verified against all
155 values in `drafts/value-pages/_guide/values.json`:

```js
const slug = name.toLowerCase().replaceAll(" ", "-");
```

So `Emotional intelligence` → `emotional-intelligence`, `Hard work` →
`hard-work`, `Self-control` → `self-control` (hyphens already in a name are
kept as-is).

Year Well Built generates its copy of the list from the Values Finder's own
data with `npm run values`, and that script **throws** if any slug stops
matching the rule. If you change a value name in the Values Finder, rerun it
on the YWB side.

### The hand-off URL

Values travel in the **URL fragment only**, never the query string:

```
https://yearwellbuilt.com/#values=integrity,family,growth
```

Fragments are never sent to a server and never reach analytics. Year Well
Built reads the fragment, saves the values to localStorage, then strips the
fragment from the address bar with `history.replaceState`.

Rules:
- Comma-separated slugs, in the visitor's own order of importance.
- Maximum five. YWB ignores anything past the fifth.
- Unknown slugs are not dropped — YWB turns them into a custom value, so a
  renamed or bespoke value still arrives.
- No other data. No name, no email, no alignment scores.

## Change 1 — accept a return URL

Year Well Built links out like this (see `src/lib/values-link.js`):

```
https://thevaluesfinder.com/?return=https%3A%2F%2Fyearwellbuilt.com%2Fstep%2F2&source=ywb
```

The Values Finder should:

1. Read `return` on load, in `public/app.js`.
2. **Validate it against an allowlist of origins** before storing it. This is
   the security-critical bit: an unvalidated return URL is an open redirect.
   Suggested allowlist:

   ```js
   const RETURN_ORIGINS = new Set([
     "https://yearwellbuilt.com",
     "https://www.yearwellbuilt.com",
     // plus the staging subdomain while testing
   ]);

   function safeReturnUrl(raw) {
     try {
       const url = new URL(raw);
       if (!RETURN_ORIGINS.has(url.origin)) return null;
       url.hash = "";      // we supply the fragment ourselves
       url.search = "";    // and no query is needed
       return url.toString();
     } catch {
       return null;
     }
   }
   ```

3. Keep it in `sessionStorage` (not localStorage — it shouldn't outlive the
   visit), so it survives the walk through the exercise.
4. Ignore `source=ywb` beyond analytics, if you want to count the referral.

## Change 2 — the results-page CTA

On the results page, after the visitor has their ranked values, add a CTA.

**When they arrived from Year Well Built** (a valid `return` is stored), make
it the primary call to action:

> **Take your values back to your year**
> Your values are the anchor for the year you're planning.
> `[ Continue building my year ]`

**When they arrived cold** (no `return`), show it as a secondary suggestion:

> **Put your values to work: build your year**
> A free, guided review and plan in seven steps, built around the values you
> just chose.
> `[ Build my year ]`

Both build the same link:

```js
function yearWellBuiltLink(chosenValues, returnUrl) {
  const base = returnUrl || "https://yearwellbuilt.com/step/2";
  const slugs = chosenValues
    .slice(0, 5)
    .map((v) => v.name.toLowerCase().replaceAll(" ", "-"));
  return `${base}#values=${slugs.join(",")}`;
}
```

Notes:
- Use the visitor's **ranked order** — YWB keeps it.
- Five maximum.
- Build the fragment at click time, not on page load, so late reordering is
  picked up.
- Don't URL-encode the commas; plain `a,b,c` is what YWB parses.

## Change 3 — privacy note

The Values Finder's privacy page should mention the hand-off, since it's a
transfer of data (even though it never touches a server):

> If you choose to continue to Year Well Built, your chosen values are passed
> in the web address itself. This happens in your browser — the values are
> never sent to our server, and never reach our analytics.

## Testing

1. From YWB Step 2, click "Find my values" → the Values Finder opens with
   `return` set.
2. Complete the exercise → the results page shows the primary CTA.
3. Click it → land on YWB Step 2 with the values pre-filled, the confirmation
   line showing, and **the fragment gone from the address bar**.
4. Reload → the values are still there (they're in localStorage now).
5. Try `?return=https://evil.example.com` → the CTA must fall back to
   `https://yearwellbuilt.com/step/2`, not follow it.
6. Try a fragment with an unknown slug, e.g. `#values=integrity,made-up-word`
   → both arrive, the second as a custom value.

## Open question for Matt

The Values Finder is currently **light theme only**, as is Year Well Built's
MVP. If the dark palette lands on one site, the other should follow in the
same pass, or the family resemblance breaks.
