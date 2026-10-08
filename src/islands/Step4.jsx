/*
  Step 4: Your compass.

  One word for the year, then the three themes the goals will hang off.
  The headline written in Step 3 sits above both, because that is what the
  word and the themes have to serve.
*/
import { useStore } from "../lib/use-store.js";
import { useDisclosure } from "../lib/use-disclosure.js";
import Reveal from "./Reveal.jsx";
import ShowAll from "./ShowAll.jsx";
import Prompt from "./Prompt.jsx";

export default function Step4({ prompts = [] }) {
  const [state, set] = useStore();
  const s = state.step4;
  const byName = (name) => prompts.find((p) => p.name.toLowerCase().includes(name)) || {};

  const filled = (v) => Boolean(v && String(v).trim());
  const { visible, allShown, showAll } = useDisclosure([
    filled(s.word),
    s.themes.some((t) => filled(t.text)),
  ]);
  const [, showThemes] = visible;

  return (
    <div class="step-prompts">
      {filled(state.step3.headline) && (
        <aside class="recall" aria-label="Your headline, from the last step">
          <p class="label">The year you just pictured</p>
          <p class="recall-headline">{state.step3.headline}</p>
        </aside>
      )}

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

      <Reveal when={showThemes}>
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
          <p class="hint">Each theme becomes a goal card in the next step.</p>
        </Prompt>
      </Reveal>

      <ShowAll allShown={allShown} onShow={showAll} />
    </div>
  );
}

const firstExample = (example = "") => String(example).split(" / ")[0].trim();
