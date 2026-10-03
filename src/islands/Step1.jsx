/*
  Step 1: the year you had.
  Wins (+ what made it possible), challenges (+ what it taught you),
  the six-area life wheel, and the energy audit.
*/
import { useState } from "preact/hooks";
import { useStore } from "../lib/use-store.js";
import Reveal from "./Reveal.jsx";
import LifeWheelChart from "./LifeWheelChart.jsx";
import ListInput from "./ListInput.jsx";
import { LIFE_AREAS } from "../lib/steps.js";
import Prompt from "./Prompt.jsx";

export default function Step1({ prompts = [] }) {
  const [state, set] = useStore();
  const [showAll, setShowAll] = useState(false);
  const s = state.step1;

  /*
    One question at a time: the next prompt arrives once the current one has
    something in it. "Something" is deliberately loose — one win is enough to
    move on, so nobody is held up trying to think of a third.

    "Show all questions" is the escape hatch for anyone who would rather see
    the whole step, or who has nothing to say to a prompt.
  */
  const filled = (v) => Boolean(v && String(v).trim());
  const hasWins = s.wins.some((w) => filled(w.text));
  const hasChallenges = s.challenges.some((c) => filled(c.text));
  const hasWheel = Object.values(s.wheel).some((v) => typeof v === "number");

  const showChallenges = showAll || hasWins;
  const showWheel = showAll || (hasWins && hasChallenges);
  const showEnergy = showAll || (hasWins && hasChallenges && hasWheel);
  const allShown = showChallenges && showWheel && showEnergy;
  const byName = (name) => prompts.find((p) => p.name.toLowerCase().includes(name)) || {};

  const winsPrompt = byName("wins");
  const challengesPrompt = byName("challenges");
  const wheelPrompt = byName("life wheel");
  const energyPrompt = byName("energy");

  // Every placeholder comes from content/step-1.md. "A / B" examples split
  // into their two halves; nothing here is hard-coded.
  const [winExample, winEnablerExample] = splitExample(winsPrompt.example);
  const [chExample, chLessonExample] = splitExample(challengesPrompt.example);
  const [gaveExample, drainedExample] = splitExample(energyPrompt.example);

  return (
    <div class="step-prompts">
      <Prompt prompt={winsPrompt}>
        <ol class="pair-list">
          {s.wins.map((win, i) => (
            <li key={win.id} class="pair">
              <span class="pair-n" aria-hidden="true">{i + 1}</span>
              <div class="pair-fields">
                <input
                  type="text"
                  value={win.text}
                  placeholder={i === 0 ? winExample : ""}
                  maxLength={500}
                  aria-label={`Win ${i + 1}`}
                  onInput={(e) => set((st) => { st.step1.wins[i].text = e.currentTarget.value; })}
                />
                <input
                  type="text"
                  class="pair-sub"
                  value={win.enabler}
                  placeholder={i === 0 ? winEnablerExample : winsPrompt.followUp}
                  maxLength={500}
                  aria-label={`What made win ${i + 1} possible?`}
                  onInput={(e) => set((st) => { st.step1.wins[i].enabler = e.currentTarget.value; })}
                />
              </div>
            </li>
          ))}
        </ol>
      </Prompt>

      <Reveal when={showChallenges}>
      <Prompt prompt={challengesPrompt}>
        <ol class="pair-list">
          {s.challenges.map((ch, i) => (
            <li key={ch.id} class="pair">
              <span class="pair-n" aria-hidden="true">{i + 1}</span>
              <div class="pair-fields">
                <input
                  type="text"
                  value={ch.text}
                  placeholder={i === 0 ? chExample : ""}
                  maxLength={500}
                  aria-label={`Challenge ${i + 1}`}
                  onInput={(e) => set((st) => { st.step1.challenges[i].text = e.currentTarget.value; })}
                />
                <input
                  type="text"
                  class="pair-sub"
                  value={ch.lesson}
                  placeholder={i === 0 ? chLessonExample : challengesPrompt.followUp}
                  maxLength={500}
                  aria-label={`What challenge ${i + 1} taught you`}
                  onInput={(e) => set((st) => { st.step1.challenges[i].lesson = e.currentTarget.value; })}
                />
              </div>
            </li>
          ))}
        </ol>
      </Prompt>
      </Reveal>

      <Reveal when={showWheel}>
      <Prompt prompt={wheelPrompt}>
        <div class="wheel-layout">
          <div class="sliders">
            {LIFE_AREAS.map((area) => {
              const value = s.wheel[area.key];
              const id = `wheel-${area.key}`;
              return (
                <div class="slider-row" key={area.key}>
                  <label for={id}>
                    <b>{area.name}</b>
                    <span>{area.blurb}</span>
                  </label>
                  <div class="slider-control">
                    <input
                      id={id}
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={value ?? 5}
                      class={value === null ? "unset" : ""}
                      aria-valuetext={value === null ? "Not rated yet" : `${value} out of 10`}
                      onInput={(e) => {
                        const n = Number(e.currentTarget.value);
                        set((st) => { st.step1.wheel[area.key] = n; });
                      }}
                    />
                    <output for={id} class={value === null ? "unset" : ""}>
                      {value === null ? "–" : value}
                    </output>
                  </div>
                </div>
              );
            })}
            <p class="note">
              Sliders start unset. Move one to rate that area; the chart draws only what you've rated.
            </p>
          </div>
          <div class="wheel-holder">
            <LifeWheelChart wheel={s.wheel} size={340} id="wheel-step1" />
            <p class="note wheel-caption">
              Your year, in one shape. Lopsided is normal. It's where the next year starts.
            </p>
          </div>
        </div>
      </Prompt>
      </Reveal>

      <Reveal when={showEnergy}>
      <Prompt prompt={energyPrompt}>
        <div class="energy-grid">
          <div class="field">
            <span class="field-label">What gave you energy</span>
            <ListInput
              items={s.energy.gave}
              label="Things that gave you energy"
              placeholder={gaveExample}
              onChange={(next) => set((st) => { st.step1.energy.gave = next; })}
            />
          </div>
          <div class="field">
            <span class="field-label">What drained it</span>
            <ListInput
              items={s.energy.drained}
              label="Things that drained your energy"
              placeholder={drainedExample}
              onChange={(next) => set((st) => { st.step1.energy.drained = next; })}
            />
            <p class="hint">These come back in Step 3, as a head start on what to leave behind.</p>
          </div>
        </div>
      </Prompt>
      </Reveal>

      {!allShown && (
        <p class="show-all">
          <button type="button" class="linklike" onClick={() => setShowAll(true)}>
            Show all questions
          </button>
        </p>
      )}
    </div>
  );
}

/** "Gave: long walks. / Drained: back-to-back calls." → the two halves. */
function splitExample(example = "") {
  const parts = String(example).split(" / ");
  return [clean(parts[0]), clean(parts[1])];
}
const clean = (s = "") => s.replace(/^(Gave|Drained):\s*/i, "").trim();
