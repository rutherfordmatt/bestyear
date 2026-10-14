/*
  The values panel: pick on the left, yours and their scores on the right.

  Extracted so the page layout and the card deck show exactly the same thing —
  two copies of this would drift within a week.
*/
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { useStore } from "../lib/use-store.js";
import { finderLink, consumeIncomingValues, MIN_VALUES, IDEAL_MIN_VALUES, MAX_VALUES } from "../lib/values-link.js";
import { track, EVENTS } from "../lib/analytics.js";

export default function ValuesPanel({ card = {}, returnLine = "", prompts = {}, headless = false }) {
  const [state, set] = useStore();
  const [families, setFamilies] = useState(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [justImported, setJustImported] = useState(0);
  const [custom, setCustom] = useState("");

  const chosen = state.step2.values;
  const chosenSlugs = new Set(chosen.map((v) => v.slug));
  const full = chosen.length >= MAX_VALUES;

  /*
    Values and their ratings, then the gap, then what you're putting down,
    then the line that closes it. Each arrives once the one before has
    something in it.
  */
  const allRated = chosen.length > 0 && chosen.every((v) => typeof v.alignment === "number");

  // Catch values coming back from the Values Finder.
  useEffect(() => {
    consumeIncomingValues().then((incoming) => {
      if (!incoming.length) return;
      set((s) => {
        for (const v of incoming) {
          if (s.step2.values.some((x) => x.slug === v.slug)) continue;
          if (s.step2.values.length >= MAX_VALUES) break;
          s.step2.values.push({ slug: v.slug, name: v.name, source: v.source, alignment: null });
        }
      }, { immediate: true });
      setJustImported(incoming.length);
      track(EVENTS.valuesImported);
    });
  }, []);

  const [valueCount, setValueCount] = useState(null);

  const chosenRef = useRef(null);

  const closePicker = () => {
    setOpen(false);
    // The chosen values sit above the picker, so returning there is the
    // difference between "now score them" and "now go and find them".
    requestAnimationFrame(() => {
      chosenRef.current?.scrollIntoView({
        behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  const loadList = async () => {
    setOpen(true);
    if (families) return;
    const mod = await import("../lib/values.js");
    setFamilies(mod.FAMILIES);
    setValueCount(mod.VALUE_COUNT);
  };

  // With nothing chosen the pick column is just a button and a lot of empty
  // space, and the list is what the visitor needs anyway. Open it.
  useEffect(() => {
    if (!chosen.length) loadList();
  }, []);

  const matches = useMemo(() => {
    if (!families) return [];
    const q = query.trim().toLowerCase();
    return families
      .map((f) => ({
        ...f,
        values: f.values.filter(
          (v) => !q || v.name.toLowerCase().includes(q) || v.meaning.toLowerCase().includes(q)
        ),
      }))
      .filter((f) => f.values.length);
  }, [families, query]);

  const matchCount = matches.reduce((n, f) => n + f.values.length, 0);

  const toggle = (value) => {
    set((s) => {
      const i = s.step2.values.findIndex((v) => v.slug === value.slug);
      if (i >= 0) { s.step2.values.splice(i, 1); return; }
      if (s.step2.values.length >= MAX_VALUES) return;
      s.step2.values.push({ slug: value.slug, name: value.name, source: "list", alignment: null });
    });
  };

  const addCustom = () => {
    const name = custom.trim();
    if (!name || full) return;
    const slug = name.toLowerCase().replaceAll(" ", "-");
    if (chosenSlugs.has(slug)) { setCustom(""); return; }
    set((s) => {
      s.step2.values.push({ slug, name, source: "custom", alignment: null });
    });
    setCustom("");
  };

  const setAlignment = (slug, alignment) =>
    set((s) => {
      const v = s.step2.values.find((x) => x.slug === slug);
      if (v) v.alignment = alignment;
    });

  return (
    <>
      {justImported > 0 && <p class="callout" role="status">{returnLine}</p>}
      {/* Picker and scoring side by side: the chosen list used to sit above
          the picker, so you only found it after scrolling back up, and every
          value reprinted the alignment question. */}
      <section class="prompt values-step" ref={chosenRef}>
        <div class="prompt-head" hidden={headless}>
          <h2 class="prompt-question">{prompts.choose?.question}</h2>
          {prompts.choose?.hint && <p class="tip">{prompts.choose.hint}</p>}
        </div>

        <p class="note values-finder-line">
          Not sure what yours are?{" "}
          <a href={finderLink("/step/2")} onClick={() => track(EVENTS.valuesImported)}>
            Take the Values Finder first
          </a>{" "}
          — about ten minutes, and your results come straight back here.
        </p>

        <div class="values-grid">
          <div class="values-pick">
            <div class="values-col-head">
              <h3>Pick</h3>
              {open && (
                <input
                  type="search"
                  value={query}
                  placeholder={valueCount ? `Search ${valueCount}…` : "Search…"}
                  aria-label="Search values"
                  onInput={(e) => setQuery(e.currentTarget.value)}
                />
              )}
            </div>

            {!open ? (
              <div class="values-start">
                <button type="button" class="btn" onClick={loadList} disabled={full}>
                  {chosen.length ? "Add or swap values" : "Pick from the list"}
                </button>
              </div>
            ) : (
              <div class="picker">
                {families && matches.map((family) => (
                  <div class="family" key={family.name}>
                    <h4 class="family-name">{family.name}</h4>
                    <div class="chips">
                      {family.values.map((v) => {
                        const picked = chosenSlugs.has(v.slug);
                        return (
                          <button
                            key={v.slug}
                            type="button"
                            class="chip"
                            aria-pressed={picked}
                            disabled={!picked && full}
                            title={v.meaning}
                            onClick={() => toggle(v)}
                          >
                            {v.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {families && matchCount === 0 && (
                  <p class="muted">Nothing matches "{query}". Add it as your own below.</p>
                )}
                {!families && <p class="muted">Loading…</p>}
                <div class="add-own">
                  <label class="field-label" for="custom-value">Not on the list?</label>
                  <div class="row">
                    <input
                      id="custom-value"
                      type="text"
                      value={custom}
                      maxLength={40}
                      placeholder="Your own word"
                      disabled={full}
                      onInput={(e) => setCustom(e.currentTarget.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                    />
                    <button type="button" class="btn small" onClick={addCustom} disabled={full || !custom.trim()}>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div class="values-chosen">
            <div class="values-col-head">
              <h3>Yours</h3>
              <p class="note" aria-live="polite">{statusLine(chosen, allRated)}</p>
            </div>

            {chosen.length === 0 ? (
              <p class="values-none">They'll appear here as you pick them.</p>
            ) : (
              <>
                {/* Asked once, not once per value. */}
                <p class="tip values-score-ask">
                  {prompts.alignment?.question || "How well did each show up in how you spent your time?"}
                </p>
                <ul class="scored-values">
                  {chosen.map((v) => {
                    const isGap = typeof v.alignment === "number" && v.alignment <= 2;
                    return (
                      <li key={v.slug} class={`scored-value${isGap ? " is-gap" : ""}`}>
                        <span class="scored-name">{v.name}</span>
                        <div class="dial" role="group" aria-label={`How well you lived ${v.name}`}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              class="dial-btn"
                              aria-pressed={v.alignment === n}
                              aria-label={`${v.name}: ${n} out of 5`}
                              onClick={() => setAlignment(v.slug, n)}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          class="list-remove"
                          onClick={() => toggle(v)}
                          aria-label={`Remove ${v.name}`}
                        >
                          ×
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p class="dial-ends" aria-hidden="true"><span>1 barely</span><span>5 fully</span></p>
                {chosen.some((v) => typeof v.alignment === "number" && v.alignment <= 2) && (
                  <p class="gap-flag">
                    The low ones are gaps worth watching. They come back in Step 4.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

/** One status line for the chosen column: how many, and what's left to do. */
function statusLine(chosen, allRated) {
  if (!chosen.length) return countLabel(0);
  const unscored = chosen.filter((v) => typeof v.alignment !== "number").length;
  if (unscored) return `${chosen.length} chosen · ${unscored} left to score`;
  if (!allRated) return `${chosen.length} chosen`;
  return `${chosen.length} chosen and scored`;
}

/**
 * The counter guides toward six to eight without nagging. Five is accepted,
 * because the Values Finder can hand off exactly five — see
 * docs/values-finder-changes.md.
 */
function countLabel(n) {
  if (n === 0) return `Choose ${IDEAL_MIN_VALUES} to ${MAX_VALUES}`;
  if (n < MIN_VALUES) return `${n} chosen — ${MIN_VALUES - n} more to go`;
  if (n < IDEAL_MIN_VALUES) return `${n} chosen — ${IDEAL_MIN_VALUES} to ${MAX_VALUES} works best`;
  if (n < MAX_VALUES) return `${n} chosen — add up to ${MAX_VALUES - n} more, or carry on`;
  return `${n} chosen, the most this works with — remove one to swap it out`;
}
