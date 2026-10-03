import { useStore } from "../lib/use-store.js";
import { track, EVENTS } from "../lib/analytics.js";
import { FEATURES } from "../lib/config.js";

/*
  Setup: pace, then a word for the year that's ending.
  The daily-nudge email field is deferred to v1.1 (FEATURES.dailyNudges) —
  there is no endpoint for it yet, so we don't collect addresses we can't use.
*/
export default function Setup({ paceOptions = [], prompt = {} }) {
  const [state, set] = useStore();

  const choosePace = (pace) => {
    set((s) => { s.pace = pace; }, { immediate: true });
    track(EVENTS.setupStarted);
  };

  return (
    <div class="setup stack-lg">
      <fieldset class="pace">
        <legend class="field-label">How do you want to do this?</legend>
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
          <p class="note pace-note">
            Saved. Your answers wait on this device — come back to yearwellbuilt.com
            in the same browser and pick up where you left off.
          </p>
        )}
      </fieldset>

      <div class="field">
        <label for="year-word">{prompt.question}</label>
        <input
          id="year-word"
          type="text"
          value={state.yearEnding.word}
          placeholder={prompt.example}
          maxLength={120}
          autoComplete="off"
          onInput={(e) => set((s) => { s.yearEnding.word = e.currentTarget.value; })}
        />
        {prompt.hint && (
          <details class="stuck">
            <summary>Stuck?</summary>
            <p>{prompt.hint}</p>
          </details>
        )}
      </div>
    </div>
  );
}
