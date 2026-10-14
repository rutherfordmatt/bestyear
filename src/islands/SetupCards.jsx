/*
  Setup as a deck: the pace, the word for the year ending, the hand-over.
*/
import { useStore } from "../lib/use-store.js";
import CardDeck from "./CardDeck.jsx";
import { track, EVENTS } from "../lib/analytics.js";
import { FEATURES } from "../lib/config.js";

export default function SetupCards({
  paceOptions = [], paceQuestion = "", prompt = {},
  intro = [], transition = "",
}) {
  const [state, set] = useStore();

  const choosePace = (pace) => {
    set((s) => { s.pace = pace; }, { immediate: true });
    track(EVENTS.setupStarted);
  };

  /*
    One card, not two. The welcome used to be a scene card of its own that
    said "two quick choices" and then showed neither — and by the time the
    pace was the only choice left on it, the card was announcing a shape the
    deck no longer had. The framing now sits above the question it frames.
  */
  const cards = [
    {
      key: "pace",
      variant: "scene",
      eyebrow: "Before we start",
      title: paceQuestion,
      body: (
        <>
          {intro.map((p, i) => <p class="lede" key={i}>{p}</p>)}
          <div class="pace-options" role="group" aria-label={paceQuestion}>
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
            <p class="tip">
              Your answers wait on this device — come back in the same browser
              and pick up where you left off.
            </p>
          )}
        </>
      ),
    },
    {
      key: "word",
      variant: "moment",
      title: prompt.question,
      guidance: prompt.hint,
      body: (
        <input
          type="text"
          class="moment-input"
          value={state.yearEnding.word}
          placeholder={prompt.example}
          maxLength={120}
          autoComplete="off"
          aria-label={prompt.question}
          onInput={(e) => set((s) => { s.yearEnding.word = e.currentTarget.value; })}
        />
      ),
    },
  ];

  if (state.yearEnding.word.trim() && transition) {
    cards.push({
      key: "handover",
      variant: "scene",
      eyebrow: "Ready",
      title: "That's the chapter you're closing",
      body: <p class="lede">{transition}</p>,
    });
  }

  return <CardDeck cards={cards} step={0} backTo="/" onLeave="/step/1" leaveLabel="Next: The year you had" />;
}
