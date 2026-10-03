/*
  Step 4: imagine the year ahead.
  The headline and the word become the hero of the vision document, so they
  get the typographic weight here too.
*/
import { useStore } from "../lib/use-store.js";
import Prompt from "./Prompt.jsx";

export default function Step4({ prompts = [] }) {
  const [state, set] = useStore();
  const s = state.step4;
  const byName = (name) => prompts.find((p) => p.name.toLowerCase().includes(name)) || {};

  return (
    <div class="step-prompts">
      <Prompt prompt={byName("headline")}>
        <div class="headline-card">
          <textarea
            class="headline-input"
            value={s.headline}
            placeholder={byName("headline").example}
            maxLength={300}
            rows={2}
            aria-label={byName("headline").question}
            onInput={(e) => set((st) => { st.step4.headline = e.currentTarget.value; })}
          ></textarea>
          <p class="note">This leads your vision document.</p>
        </div>
      </Prompt>

      <Prompt prompt={byName("detail")} from="lowestAreas">
        <textarea
          value={s.detail}
          placeholder={byName("detail").example}
          maxLength={2000}
          rows={4}
          aria-label={byName("detail").question}
          onInput={(e) => set((st) => { st.step4.detail = e.currentTarget.value; })}
        ></textarea>
      </Prompt>

      <Prompt prompt={byName("your word")}>
        <div class="word-card">
          <input
            type="text"
            class="word-input"
            value={s.word}
            placeholder={byName("your word").example}
            maxLength={60}
            autoComplete="off"
            aria-label={byName("your word").question}
            onInput={(e) => set((st) => { st.step4.word = e.currentTarget.value; })}
          />
        </div>
      </Prompt>

      <Prompt prompt={byName("themes")} from="valueGaps">
        <ol class="theme-list">
          {s.themes.map((theme, i) => (
            <li key={theme.id} class="theme-row">
              <span class="theme-n" aria-hidden="true">{i + 1}</span>
              <input
                type="text"
                value={theme.text}
                placeholder={i === 0 ? firstExample(byName("themes").example) : ""}
                maxLength={200}
                aria-label={`Theme ${i + 1}`}
                onInput={(e) => {
                  const v = e.currentTarget.value;
                  set((st) => { st.step4.themes[i].text = v; });
                }}
              />
            </li>
          ))}
        </ol>
        <p class="hint">Each theme becomes a goal card in Step 5.</p>
      </Prompt>
    </div>
  );
}

const firstExample = (example = "") => String(example).split(" / ")[0].trim();
