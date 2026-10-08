/*
  The "leaving behind" list: three piles, and a cross-out that marks something
  as actually let go. It is the interactive heart of Step 2.

  Energy drainers from Step 1 and the values just rated low are offered as a
  head start, so nobody stares at an empty list.
*/
import { useStore } from "../lib/use-store.js";
import { LETTING_GO_BUCKETS } from "../lib/steps.js";
import { suggestedLettingGo } from "../lib/carry-forward.js";
import { emptyLettingGo } from "../lib/schema.js";

export default function LettingGo({ prompt = {}, bucketLabels = [] }) {
  const [state, set] = useStore();
  const items = state.step2.lettingGo;
  const suggestions = suggestedLettingGo(state);

  // "Checking my phone in bed. / Chairing the committee. / I should be…"
  // maps to the three piles, in order.
  const pileExamples = String(prompt.example || "")
    .split(" / ")
    .map((x) => x.trim().replace(/\.$/, ""));
  const exampleFor = (key) =>
    pileExamples[LETTING_GO_BUCKETS.findIndex((b) => b.key === key)] || "";

  const label = (key) =>
    bucketLabels.find((b) => b.toLowerCase().includes(key)) ||
    LETTING_GO_BUCKETS.find((b) => b.key === key)?.label;

  const addItem = (bucket, text = "") =>
    set((s) => {
      const item = emptyLettingGo(bucket);
      item.text = text;
      s.step2.lettingGo.push(item);
    }, { immediate: Boolean(text) });

  const setText = (id, text) =>
    set((s) => {
      const item = s.step2.lettingGo.find((l) => l.id === id);
      if (item) item.text = text;
    });

  const remove = (id) =>
    set((s) => { s.step2.lettingGo = s.step2.lettingGo.filter((l) => l.id !== id); },
      { immediate: true });

  const toggleReleased = (id) =>
    set((s) => {
      const item = s.step2.lettingGo.find((l) => l.id === id);
      if (item) item.releasedAt = item.releasedAt ? null : new Date().toISOString();
    }, { immediate: true });

  const released = items.filter((i) => i.releasedAt).length;

  return (
    <div class="letting-layout">
      <div class="piles">
        {LETTING_GO_BUCKETS.map((bucket) => {
          const inBucket = items.filter((i) => i.bucket === bucket.key);
          return (
            <div class="pile" key={bucket.key}>
              <h3 class="pile-head">{label(bucket.key)}</h3>
              <ul class="pile-items">
                {inBucket.map((item, idx) => (
                  <li key={item.id} class={`pile-item${item.releasedAt ? " released" : ""}`}>
                    <button
                      type="button"
                      class="release"
                      aria-pressed={Boolean(item.releasedAt)}
                      onClick={() => toggleReleased(item.id)}
                      title={item.releasedAt ? "Pick it back up" : "Let it go"}
                    >
                      <span aria-hidden="true">{item.releasedAt ? "✓" : "○"}</span>
                      <span class="visually-hidden">
                        {item.releasedAt ? `Pick "${item.text}" back up` : `Let "${item.text}" go`}
                      </span>
                    </button>
                    <input
                      type="text"
                      value={item.text}
                      maxLength={300}
                      placeholder={idx === 0 ? exampleFor(bucket.key) : ""}
                      aria-label={`${bucket.name}: ${item.text || "new item"}`}
                      onInput={(e) => setText(item.id, e.currentTarget.value)}
                    />
                    <button
                      type="button"
                      class="list-remove"
                      onClick={() => remove(item.id)}
                      aria-label={`Delete "${item.text}"`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" class="btn small text add-to-pile" onClick={() => addItem(bucket.key)}>
                + Add
              </button>
            </div>
          );
        })}
      </div>

      <div class="letting-aside">
        {suggestions.length > 0 && (
          <aside class="from-step" aria-label="Suggestions from your earlier answers">
            <p class="from-step-head"><span class="label">A head start</span></p>
            <h3>From what you've already said</h3>
            <ul>
              {suggestions.map((sug, i) => (
                <li key={i}>
                  <button type="button" class="from-step-pick" onClick={() => addItem("habit", sug.text)}>
                    <span>{sug.text}</span>
                    <em>{sug.from}</em>
                    <span class="plus" aria-hidden="true">+</span>
                    <span class="visually-hidden">Add to your letting-go list</span>
                  </button>
                </li>
              ))}
            </ul>
            <p class="from-step-note">Added items land in Habits. Retype or move them as you like.</p>
          </aside>
        )}
        {released > 0 && (
          <p class="released-count" role="status">
            {released} {released === 1 ? "thing" : "things"} let go.
          </p>
        )}
      </div>
    </div>
  );
}
