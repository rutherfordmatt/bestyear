/*
  EXPERIMENT — Step 1 as a deck of cards, one question per screen.
  Lives at /experiment/cards alongside the real /step/1 so the two can be
  compared. Same content, same storage; only the presentation differs.
*/
import { useStore } from "../lib/use-store.js";
import CardDeck from "./CardDeck.jsx";
import LifeWheelChart from "./LifeWheelChart.jsx";
import ListInput from "./ListInput.jsx";
import { LIFE_AREAS } from "../lib/steps.js";
import { emptyWin, emptyChallenge } from "../lib/schema.js";

const MAX_ENTRIES = 3;

export default function Step1Cards({ prompts = [] }) {
  const [state, set] = useStore();
  const s = state.step1;
  const byName = (name) => prompts.find((p) => p.name.toLowerCase().includes(name)) || {};
  const winsPrompt = byName("wins");
  const challengesPrompt = byName("challenges");
  const energyPrompt = byName("energy");
  const wheelPrompt = byName("life wheel");

  const [winExample, winEnablerExample] = splitExample(winsPrompt.example);
  const [chExample, chLessonExample] = splitExample(challengesPrompt.example);
  const [gaveExample, drainedExample] = splitExample(energyPrompt.example);

  const addWin = () => set((st) => { if (st.step1.wins.length < MAX_ENTRIES) st.step1.wins.push(emptyWin()); });
  const addChallenge = () =>
    set((st) => { if (st.step1.challenges.length < MAX_ENTRIES) st.step1.challenges.push(emptyChallenge()); });

  const cards = [
    {
      key: "wins",
      title: winsPrompt.question,
      guidance: winsPrompt.hint,
      body: (
        <>
          <ol class="pair-list">
            {s.wins.map((win, i) => (
              <li key={win.id} class="pair">
                <span class="pair-n" aria-hidden="true">{i + 1}</span>
                <div class="pair-fields">
                  <input
                    type="text" value={win.text}
                    placeholder={i === 0 ? winExample : ""} maxLength={500}
                    aria-label={`Win ${i + 1}`}
                    onInput={(e) => set((st) => { st.step1.wins[i].text = e.currentTarget.value; })}
                  />
                  <input
                    type="text" class="pair-sub" value={win.enabler}
                    placeholder={i === 0 ? winEnablerExample : winsPrompt.followUp} maxLength={500}
                    aria-label={`What made win ${i + 1} possible?`}
                    onInput={(e) => set((st) => { st.step1.wins[i].enabler = e.currentTarget.value; })}
                  />
                </div>
              </li>
            ))}
          </ol>
          {s.wins.length < MAX_ENTRIES && (
            <button type="button" class="btn small text add-another" onClick={addWin}>+ Add another</button>
          )}
        </>
      ),
    },
    {
      key: "challenges",
      title: challengesPrompt.question,
      guidance: challengesPrompt.hint,
      body: (
        <>
          <ol class="pair-list">
            {s.challenges.map((ch, i) => (
              <li key={ch.id} class="pair">
                <span class="pair-n" aria-hidden="true">{i + 1}</span>
                <div class="pair-fields">
                  <input
                    type="text" value={ch.text}
                    placeholder={i === 0 ? chExample : ""} maxLength={500}
                    aria-label={`Challenge ${i + 1}`}
                    onInput={(e) => set((st) => { st.step1.challenges[i].text = e.currentTarget.value; })}
                  />
                  <input
                    type="text" class="pair-sub" value={ch.lesson}
                    placeholder={i === 0 ? chLessonExample : challengesPrompt.followUp} maxLength={500}
                    aria-label={`What challenge ${i + 1} taught you`}
                    onInput={(e) => set((st) => { st.step1.challenges[i].lesson = e.currentTarget.value; })}
                  />
                </div>
              </li>
            ))}
          </ol>
          {s.challenges.length < MAX_ENTRIES && (
            <button type="button" class="btn small text add-another" onClick={addChallenge}>+ Add another</button>
          )}
        </>
      ),
    },
    {
      key: "energy",
      title: energyPrompt.question,
      guidance: energyPrompt.hint,
      body: (
        <div class="energy-grid">
          <div class="field">
            <span class="field-label">What gave you energy</span>
            <ListInput
              items={s.energy.gave} label="Things that gave you energy" placeholder={gaveExample}
              onChange={(next) => set((st) => { st.step1.energy.gave = next; })}
            />
          </div>
          <div class="field">
            <span class="field-label">What drained it</span>
            <ListInput
              items={s.energy.drained} label="Things that drained your energy" placeholder={drainedExample}
              onChange={(next) => set((st) => { st.step1.energy.drained = next; })}
            />
          </div>
        </div>
      ),
    },
    {
      key: "wheel",
      title: wheelPrompt.question,
      guidance: wheelPrompt.hint,
      body: (
        <div class="wheel-layout">
          <div class="sliders">
            {LIFE_AREAS.map((area) => {
              const value = s.wheel[area.key];
              const id = `cardwheel-${area.key}`;
              return (
                <div class="slider-row" key={area.key}>
                  <label for={id}><b>{area.name}</b><span>{area.blurb}</span></label>
                  <div class="slider-control">
                    <input
                      id={id} type="range" min="1" max="10" step="1"
                      value={value ?? 5} class={value === null ? "unset" : ""}
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
          </div>
          <div class="wheel-holder">
            <LifeWheelChart wheel={s.wheel} size={300} id="wheel-cards" />
          </div>
        </div>
      ),
    },
  ];

  return <CardDeck cards={cards} onLeave="/step/2" leaveLabel="Next: What matters" />;
}

function splitExample(example = "") {
  const parts = String(example).split(" / ");
  return [clean(parts[0]), clean(parts[1])];
}
const clean = (s = "") => s.replace(/^(Gave|Drained):\s*/i, "").trim();
