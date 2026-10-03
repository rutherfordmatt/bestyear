import { useStore } from "../lib/use-store.js";
import Reveal from "./Reveal.jsx";
import { track, EVENTS } from "../lib/analytics.js";
import { FEATURES } from "../lib/config.js";

/*
  Setup: pace, then a word for the year that's ending.

  The second question stays out of sight until the first is answered, so the
  screen asks one thing at a time and arrives rather than confronts.

  The daily-nudge email field is deferred to v1.1 (FEATURES.dailyNudges) —
  there is no endpoint for it yet, so we don't collect addresses we can't use.
*/
export default function Setup({ paceOptions = [], paceQuestion = "", prompt = {}, transition = "" }) {
  const [state, set] = useStore();

  const choosePace = (pace) => {
    set((s) => { s.pace = pace; }, { immediate: true });
    track(EVENTS.setupStarted);
  };

  const hasPace = Boolean(state.pace);
  const hasWord = Boolean(state.yearEnding.word.trim());

  return (
    <div class="setup">
      <section class="prompt">
        <fieldset class="pace">
          <legend class="prompt-question">{paceQuestion}</legend>
          <div class="pace-options">
            {paceOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                class="pace-option"
                aria-pressed={state.pace === opt.key}
                onClick={() => choosePace(opt.key)}
              >
                <b>{opt.title}</b>
                <span>{opt.body}</span>
              </button>
            ))}
          </div>
          {state.pace === "daily" && !FEATURES.dailyNudges && (
            <p class="tip pace-note">
              Your answers wait on this device — come back to yearwellbuilt.com in
              the same browser and pick up where you left off.
            </p>
          )}
        </fieldset>
      </section>

      <Reveal when={hasPace}>
        <section class="prompt">
          <label class="prompt-question" for="year-word">{prompt.question}</label>
          <input
            id="year-word"
            type="text"
            class="word-field"
            value={state.yearEnding.word}
            placeholder={prompt.example}
            maxLength={120}
            autoComplete="off"
            onInput={(e) => set((s) => { s.yearEnding.word = e.currentTarget.value; })}
          />
          {prompt.hint && <p class="tip">{prompt.hint}</p>}
        </section>
      </Reveal>

      {/* Reads "Good. That's the title of the chapter you're closing." — it
          would be orphaned before there is a title to be good about. */}
      {/* No scroll here: it fires mid-sentence as the word is typed. */}
      <Reveal when={Boolean(transition && hasWord)} scroll={false}>
        <p class="step-transition" role="status">{transition}</p>
      </Reveal>
    </div>
  );
}
