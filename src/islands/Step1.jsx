/*
  Step 1: the year you had.

  The life wheel comes first on purpose. It is eight sliders, it takes under a
  minute, and it produces the radar chart — so the first thing that happens in
  the whole journey is visible rather than typed. Wins, challenges and the
  energy audit follow.

  One win and one challenge to begin with, with "add another" for the rest.
  Three was an entry fee rather than an aspiration.
*/
import { useStore } from "../lib/use-store.js";
import { useDisclosure } from "../lib/use-disclosure.js";
import Reveal from "./Reveal.jsx";
import ShowAll from "./ShowAll.jsx";
import LifeWheelChart from "./LifeWheelChart.jsx";
import ListInput from "./ListInput.jsx";
import { LIFE_AREAS } from "../lib/steps.js";
import { emptyWin, emptyChallenge } from "../lib/schema.js";
import Prompt from "./Prompt.jsx";

const MAX_ENTRIES = 3;

export default function Step1({ prompts = [] }) {
  const [state, set] = useStore();
  const s = state.step1;

  const filled = (v) => Boolean(v && String(v).trim());
  const { visible, allShown, showAll } = useDisclosure([
    Object.values(s.wheel).some((v) => typeof v === "number"),
    s.wins.some((w) => filled(w.text)),
    s.challenges.some((c) => filled(c.text)),
    s.energy.gave.some(filled) || s.energy.drained.some(filled),
  ]);
  const [, showWins, showChallenges, showEnergy] = visible;

  const byName = (name) => prompts.find((p) => p.name.toLowerCase().includes(name)) || {};
  const wheelPrompt = byName("life wheel");
  const winsPrompt = byName("wins");
  const challengesPrompt = byName("challenges");
  const energyPrompt = byName("energy");

  // Every placeholder comes from content/step-1.md. "A / B" examples split
  // into their two halves; nothing here is hard-coded.
  const [winExample, winEnablerExample] = splitExample(winsPrompt.example);
  const [chExample, chLessonExample] = splitExample(challengesPrompt.example);
  const [gaveExample, drainedExample] = splitExample(energyPrompt.example);

  const addWin = () => set((st) => { if (st.step1.wins.length < MAX_ENTRIES) st.step1.wins.push(emptyWin()); });
  const addChallenge = () =>
    set((st) => { if (st.step1.challenges.length < MAX_ENTRIES) st.step1.challenges.push(emptyChallenge()); });

  return (
    <div class="step-prompts">
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
            <p class="tip">
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

      <Reveal when={showWins}>
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
          {s.wins.length < MAX_ENTRIES && (
            <button type="button" class="btn small text add-another" onClick={addWin}>
              + Add another win
            </button>
          )}
        </Prompt>
      </Reveal>

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
          <p class="hint">
            What each one taught you is carried forward as a lesson on your vision document.
          </p>
          {s.challenges.length < MAX_ENTRIES && (
            <button type="button" class="btn small text add-another" onClick={addChallenge}>
              + Add another
            </button>
          )}
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
              <p class="hint">These come back in Step 2, as a head start on what to leave behind.</p>
            </div>
          </div>
        </Prompt>
      </Reveal>

      <ShowAll allShown={allShown} onShow={showAll} />
    </div>
  );
}

/** "Gave: long walks. / Drained: back-to-back calls." → the two halves. */
function splitExample(example = "") {
  const parts = String(example).split(" / ");
  return [clean(parts[0]), clean(parts[1])];
}
const clean = (s = "") => s.replace(/^(Gave|Drained):\s*/i, "").trim();
