/*
  Step 2: values.

  Three ways in:
  1. Arriving from thevaluesfinder.com with values in the URL fragment.
  2. "Find my values" — out to the Values Finder with a return URL.
  3. The pick-list: all 155 values, searchable and grouped by family, using
     the Values Finder's own names and slugs.

  The list is loaded on demand so it isn't in the initial payload.
*/
import { useEffect, useMemo, useState } from "preact/hooks";
import { useStore } from "../lib/use-store.js";
import { finderLink, consumeIncomingValues, MAX_VALUES } from "../lib/values-link.js";
import { track, EVENTS } from "../lib/analytics.js";

export default function ValuesPicker({ card = {}, returnLine = "", prompts = {} }) {
  const [state, set] = useStore();
  const [families, setFamilies] = useState(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [justImported, setJustImported] = useState(0);
  const [custom, setCustom] = useState("");

  const chosen = state.step2.values;
  const chosenSlugs = new Set(chosen.map((v) => v.slug));
  const full = chosen.length >= MAX_VALUES;

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

  const loadList = async () => {
    setOpen(true);
    if (families) return;
    const mod = await import("../lib/values.js");
    setFamilies(mod.FAMILIES);
  };

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
    <div class="values-step">
      {justImported > 0 && (
        <p class="callout" role="status">{returnLine}</p>
      )}

      {chosen.length === 0 && (
        <div class="card finder-card">
          <h2>{card.heading}</h2>
          <p class="muted">{card.body}</p>
          <div class="row">
            <a
              class="btn primary"
              href={finderLink("/step/2")}
              onClick={() => track(EVENTS.valuesImported)}
            >
              {card.primary}
            </a>
            <button type="button" class="btn text" onClick={loadList}>
              {card.secondary}
            </button>
          </div>
        </div>
      )}

      {/* Chosen values, with alignment */}
      <section class="prompt">
        <div class="prompt-head">
          <h2 class="prompt-question">{prompts.choose?.question}</h2>
          <p class="note">
            {chosen.length} of {MAX_VALUES} chosen
            {full && " — remove one to swap it out"}
          </p>
        </div>

        {chosen.length > 0 ? (
          <ul class="chosen-values">
            {chosen.map((v) => (
              <li key={v.slug} class="chosen-value">
                <div class="chosen-head">
                  <b>{v.name}</b>
                  <button
                    type="button"
                    class="list-remove"
                    onClick={() => toggle(v)}
                    aria-label={`Remove ${v.name}`}
                  >
                    ×
                  </button>
                </div>
                <fieldset class="alignment">
                  <legend>{prompts.alignment?.question || "How well did it show up?"}</legend>
                  <div class="dial" role="group">
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
                    <span class="dial-ends" aria-hidden="true">
                      <span>barely</span><span>fully</span>
                    </span>
                  </div>
                </fieldset>
                {typeof v.alignment === "number" && v.alignment <= 2 && (
                  <p class="gap-flag">
                    A gap worth watching. This one comes back in Step 4.
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p class="muted empty-values">No values chosen yet.</p>
        )}

        <div class="row">
          <button type="button" class="btn small" onClick={loadList} disabled={full}>
            {chosen.length ? "Add or swap values" : "Pick from the list"}
          </button>
        </div>

        {prompts.choose?.hint && (
          <details class="stuck">
            <summary>Stuck?</summary>
            <p>{prompts.choose.hint}</p>
          </details>
        )}
      </section>

      {/* The pick-list: 155 values, searchable, grouped by family */}
      {open && (
        <section class="picker" aria-label="Choose your values">
          <div class="picker-tools">
            <input
              type="search"
              value={query}
              placeholder="Search 155 values…"
              aria-label="Search values"
              onInput={(e) => setQuery(e.currentTarget.value)}
            />
            <p class="note" aria-live="polite">
              {families ? `${matchCount} shown · ${chosen.length} of ${MAX_VALUES} chosen` : "Loading…"}
            </p>
            <button type="button" class="btn small text" onClick={() => setOpen(false)}>Done</button>
          </div>

          {families && matches.map((family) => (
            <div class="family" key={family.name}>
              <div class="family-head">
                <h3>{family.name}</h3>
                <p class="note">{family.blurb}</p>
              </div>
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
                      <span class="chip-name">{v.name}</span>
                      <span class="chip-meaning">{v.meaning}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {families && matchCount === 0 && (
            <p class="muted">Nothing matches "{query}". Add it as your own below.</p>
          )}

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
        </section>
      )}

      {/* The gap */}
      <section class="prompt">
        <div class="prompt-head">
          <h2 class="prompt-question">{prompts.gap?.question}</h2>
        </div>
        <div class="prompt-body">
          <textarea
            value={state.step2.compromise}
            placeholder={prompts.gap?.example}
            maxLength={1500}
            aria-label={prompts.gap?.question}
            onInput={(e) => set((s) => { s.step2.compromise = e.currentTarget.value; })}
          ></textarea>
          {prompts.gap?.hint && (
            <details class="stuck">
              <summary>Stuck?</summary>
              <p>{prompts.gap.hint}</p>
            </details>
          )}
        </div>
      </section>
    </div>
  );
}
