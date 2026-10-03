/*
  Step 6: obstacles and support.
  One if-then card per goal from Step 5, then "who's in your corner".
  Choosing "A coach" surfaces the Clarity Session touchpoint from the copy.
*/
import { useStore } from "../lib/use-store.js";
import { useDisclosure } from "../lib/use-disclosure.js";
import Reveal from "./Reveal.jsx";
import ShowAll from "./ShowAll.jsx";
import Prompt from "./Prompt.jsx";
import { goals as goalsOf, themeOf } from "../lib/carry-forward.js";
import { CORNER_OPTIONS, pathForStep } from "../lib/steps.js";
import { BOOKING_URL } from "../lib/config.js";
import { track, EVENTS } from "../lib/analytics.js";

export default function Step6({ prompts = [], coachNote = "", cornerOptions = [] }) {
  const [state, set] = useStore();
  const byName = (name) => prompts.find((p) => p.name.toLowerCase().includes(name)) || {};
  const goals = goalsOf(state);

  const ifPrompt = byName("if");
  const thenPrompt = byName("then");
  const cornerPrompt = byName("corner");

  const options = cornerOptions.length
    ? cornerOptions.map((name, i) => ({ key: CORNER_OPTIONS[i]?.key || `opt${i}`, name }))
    : CORNER_OPTIONS;

  const setPair = (goalId, field, value) =>
    set((s) => {
      s.step6.ifThen[goalId] = { ...(s.step6.ifThen[goalId] || { if: "", then: "" }), [field]: value };
    });

  const toggleWho = (key) =>
    set((s) => {
      const who = new Set(s.step6.corner.who);
      who.has(key) ? who.delete(key) : who.add(key);
      s.step6.corner.who = [...who];
    }, { immediate: true });

  const wantsCoach = state.step6.corner.who.includes("coach");

  // Who's in your corner arrives once there's a plan for them to support.
  const filled = (v) => Boolean(v && String(v).trim());
  const anyIfThen = goals.some((g) => {
    const pair = state.step6.ifThen[g.id] || {};
    return filled(pair.if) || filled(pair.then);
  });
  const { visible, allShown, showAll } = useDisclosure([
    anyIfThen || goals.length === 0,
    state.step6.corner.who.length > 0,
  ]);
  const [, showCorner] = visible;

  return (
    <div class="step-prompts">
      <section class="prompt">
        <div class="prompt-head">
          <h2 class="prompt-question">{ifPrompt.question || "What's most likely to get in the way?"}</h2>
          <p class="note">One for each goal. Be specific about the trigger.</p>
        </div>

        {goals.length === 0 ? (
          <div class="callout warn">
            <h3>Your goals come first</h3>
            <p>
              If-then plans attach to the goals you set in Step 5.
              <a href={pathForStep(5)}> Set them first</a>, then come back.
            </p>
          </div>
        ) : (
          <ul class="ifthen-cards">
            {goals.map((goal, i) => {
              const pair = state.step6.ifThen[goal.id] || { if: "", then: "" };
              const theme = themeOf(state, goal);
              const isPriority = goal.id === state.step5.priorityGoalId;
              return (
                <li key={goal.id} class={`ifthen-card${isPriority ? " priority" : ""}`}>
                  <div class="ifthen-goal">
                    {isPriority && <span class="star" aria-label="Priority goal">★</span>}
                    {theme && <span class="label">{theme.text}</span>}
                    <p><b>{goal.done}</b></p>
                  </div>
                  <div class="ifthen-fields">
                    <div class="field">
                      <label for={`if-${goal.id}`}>If…</label>
                      <input
                        id={`if-${goal.id}`} type="text" value={pair.if}
                        placeholder={i === 0 ? cleanEllipsis(ifPrompt.example) : ""} maxLength={500}
                        onInput={(e) => setPair(goal.id, "if", e.currentTarget.value)}
                      />
                    </div>
                    <div class="field">
                      <label for={`then-${goal.id}`}>…then I will</label>
                      <input
                        id={`then-${goal.id}`} type="text" value={pair.then}
                        placeholder={i === 0 ? cleanEllipsis(thenPrompt.example) : ""} maxLength={500}
                        onInput={(e) => setPair(goal.id, "then", e.currentTarget.value)}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {ifPrompt.hint && <p class="tip">{ifPrompt.hint}</p>}
      </section>

      <Reveal when={showCorner}>
      <Prompt prompt={cornerPrompt}>
        <div class="corner-options">
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              class="chip"
              aria-pressed={state.step6.corner.who.includes(opt.key)}
              onClick={() => toggleWho(opt.key)}
            >
              {opt.name}
            </button>
          ))}
        </div>

        {wantsCoach && coachNote && (
          <aside class="callout coach-note">
            <p>{coachNote}</p>
            <a
              class="btn small primary"
              href={BOOKING_URL}
              onClick={() => track(EVENTS.bookingClicked)}
            >
              Find out more
            </a>
          </aside>
        )}

        <div class="field">
          <label for="corner-ask">{cornerPrompt.followUp || "What will you ask them for?"}</label>
          <textarea
            id="corner-ask"
            value={state.step6.corner.ask}
            placeholder={cornerPrompt.example}
            maxLength={800}
            rows={3}
            onInput={(e) => set((s) => { s.step6.corner.ask = e.currentTarget.value; })}
          ></textarea>
        </div>
      </Prompt>
      </Reveal>

      <ShowAll allShown={allShown} onShow={showAll} />
    </div>
  );
}

const cleanEllipsis = (s = "") => String(s).replace(/^\s*\.{3}\s*/, "").replace(/,\s*$/, "");
