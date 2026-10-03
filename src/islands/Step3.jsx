/*
  Step 3: lessons and letting go.

  The letting-go list is the interactive heart of this step: three piles, and
  a cross-out that marks something as actually let go. Energy drainers from
  Step 1 and value gaps from Step 2 are offered as a head start.
*/
import { useStore } from "../lib/use-store.js";
import Prompt from "./Prompt.jsx";
import FromStep from "./FromStep.jsx";
import { LETTING_GO_BUCKETS } from "../lib/steps.js";
import { suggestedLettingGo } from "../lib/carry-forward.js";
import { emptyLettingGo } from "../lib/schema.js";

export default function Step3({ prompts = [], bucketLabels = [] }) {
  const [state, set] = useStore();
  const byName = (name) => prompts.find((p) => p.name.toLowerCase().includes(name)) || {};
  const lessonsPrompt = byName("lessons");
  const lettingPrompt = byName("letting go");
  const closingPrompt = byName("one line");

  const suggestions = suggestedLettingGo(state);
  const items = state.step3.lettingGo;

  const addItem = (bucket, text = "") =>
    set((s) => {
      const item = emptyLettingGo(bucket);
      item.text = text;
      s.step3.lettingGo.push(item);
    }, { immediate: Boolean(text) });

  const setText = (id, text) =>
    set((s) => {
      const item = s.step3.lettingGo.find((l) => l.id === id);
      if (item) item.text = text;
    });

  const remove = (id) =>
    set((s) => { s.step3.lettingGo = s.step3.lettingGo.filter((l) => l.id !== id); }, { immediate: true });

  const toggleReleased = (id) =>
    set((s) => {
      const item = s.step3.lettingGo.find((l) => l.id === id);
      if (item) item.releasedAt = item.releasedAt ? null : new Date().toISOString();
    }, { immediate: true });

  const label = (key) =>
    bucketLabels.find((b) => b.toLowerCase().includes(key)) ||
    LETTING_GO_BUCKETS.find((b) => b.key === key)?.label;

  const released = items.filter((i) => i.releasedAt).length;

  return (
    <div class="step-prompts">
      <Prompt prompt={lessonsPrompt} from="challenges">
        <ol class="pair-list">
          {state.step3.lessons.map((lesson, i) => (
            <li key={i} class="pair">
              <span class="pair-n" aria-hidden="true">{i + 1}</span>
              <div class="pair-fields">
                <input
                  type="text"
                  value={lesson}
                  placeholder={i === 0 ? lessonsPrompt.example : ""}
                  maxLength={500}
                  aria-label={`Lesson ${i + 1}`}
                  onInput={(e) => {
                    const v = e.currentTarget.value;
                    set((s) => { s.step3.lessons[i] = v; });
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      </Prompt>

      <Prompt prompt={lettingPrompt}>
        <div class="letting-layout">
          <div class="piles">
            {LETTING_GO_BUCKETS.map((bucket) => {
              const inBucket = items.filter((i) => i.bucket === bucket.key);
              return (
                <div class="pile" key={bucket.key}>
                  <h3 class="pile-head">{label(bucket.key)}</h3>
                  <ul class="pile-items">
                    {inBucket.map((item) => (
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
                <p class="from-step-head"><span class="label">From Steps 1 and 2</span></p>
                <h3>A head start</h3>
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
      </Prompt>

      <Prompt prompt={closingPrompt}>
        <input
          type="text"
          class="closing-line"
          value={state.step3.closingLine}
          placeholder={closingPrompt.example}
          maxLength={400}
          aria-label={closingPrompt.question}
          onInput={(e) => set((s) => { s.step3.closingLine = e.currentTarget.value; })}
        />
        <p class="hint">This becomes the closing quote on your vision document.</p>
      </Prompt>
    </div>
  );
}
