/*
  Step 2: what matters, and what doesn't.

  Values and their alignment, where you compromised one, what you're leaving
  behind, and the line that closes the chapter.

  The values panel is shared with the card deck — see ValuesPanel.jsx — so the
  two presentations cannot drift apart.
*/
import { useStore } from "../lib/use-store.js";
import { useDisclosure } from "../lib/use-disclosure.js";
import Reveal from "./Reveal.jsx";
import ShowAll from "./ShowAll.jsx";
import LettingGo from "./LettingGo.jsx";
import ValuesPanel from "./ValuesPanel.jsx";

export default function Step2({ card = {}, returnLine = "", prompts = {}, bucketLabels = [] }) {
  const [state, set] = useStore();
  const chosen = state.step2.values;

  /*
    Values and their ratings, then the gap, then what you're putting down,
    then the line that closes it. Each arrives once the one before has
    something in it.
  */
  const allRated = chosen.length > 0 && chosen.every((v) => typeof v.alignment === "number");
  const { visible, allShown, showAll } = useDisclosure([
    allRated,
    Boolean(state.step2.compromise.trim()),
    state.step2.lettingGo.some((l) => l.text.trim()),
    Boolean(state.step2.closingLine.trim()),
  ]);
  const [, showGap, showLetting, showClosing] = visible;

  return (
    <div class="values-step">
      <ValuesPanel card={card} returnLine={returnLine} prompts={prompts} />

      <Reveal when={showGap}>
        <section class="prompt">
          <div class="prompt-head">
            <h2 class="prompt-question">{prompts.gap?.question}</h2>
            {prompts.gap?.hint && <p class="tip">{prompts.gap.hint}</p>}
          </div>
          <div class="prompt-body">
            <textarea
              value={state.step2.compromise}
              placeholder={prompts.gap?.example}
              maxLength={1500}
              aria-label={prompts.gap?.question}
              onInput={(e) => set((s) => { s.step2.compromise = e.currentTarget.value; })}
            ></textarea>
          </div>
        </section>
      </Reveal>

      <Reveal when={showLetting}>
        <section class="prompt">
          <div class="prompt-head">
            <h2 class="prompt-question">{prompts.letting?.question?.split("?")[0]}?</h2>
            {prompts.letting?.hint && <p class="tip">{prompts.letting.hint}</p>}
          </div>
          <LettingGo prompt={prompts.letting || {}} bucketLabels={bucketLabels} />
        </section>
      </Reveal>

      <Reveal when={showClosing}>
        <section class="prompt">
          <div class="prompt-head">
            <h2 class="prompt-question">{prompts.closing?.question}</h2>
            {prompts.closing?.hint && <p class="tip">{prompts.closing.hint}</p>}
          </div>
          <div class="prompt-body">
            <input
              type="text"
              class="closing-line"
              value={state.step2.closingLine}
              placeholder={prompts.closing?.example}
              maxLength={400}
              aria-label={prompts.closing?.question}
              onInput={(e) => set((s) => { s.step2.closingLine = e.currentTarget.value; })}
            />
          </div>
        </section>
      </Reveal>

      <ShowAll allShown={allShown} onShow={showAll} />
    </div>
  );
}
