/*
  Step 3: Picture it.

  The headline, then the detail. The headline is the hero of the vision
  document, so it gets the typographic weight here too.
*/
import { useStore } from "../lib/use-store.js";
import { useDisclosure } from "../lib/use-disclosure.js";
import Reveal from "./Reveal.jsx";
import ShowAll from "./ShowAll.jsx";
import Prompt from "./Prompt.jsx";

export default function Step3({ prompts = [] }) {
  const [state, set] = useStore();
  const s = state.step3;
  const byName = (name) => prompts.find((p) => p.name.toLowerCase().includes(name)) || {};

  const filled = (v) => Boolean(v && String(v).trim());
  const { visible, allShown, showAll } = useDisclosure([
    filled(s.headline),
    filled(s.detail),
  ]);
  const [, showDetail] = visible;

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
            onInput={(e) => set((st) => { st.step3.headline = e.currentTarget.value; })}
          ></textarea>
          <p class="note">This leads your vision document.</p>
        </div>
      </Prompt>

      <Reveal when={showDetail}>
        <Prompt prompt={byName("detail")} from="lowestAreas">
          <textarea
            value={s.detail}
            placeholder={byName("detail").example}
            maxLength={2000}
            rows={4}
            aria-label={byName("detail").question}
            onInput={(e) => set((st) => { st.step3.detail = e.currentTarget.value; })}
          ></textarea>
        </Prompt>
      </Reveal>

      <ShowAll allShown={allShown} onShow={showAll} />
    </div>
  );
}
