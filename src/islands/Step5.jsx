/*
  Step 5: goals. One card per theme from Step 4, maximum three.
  Each goal: what done looks like, why (a value plus free text), a date,
  the habit that carries it, and the first step. One is starred as priority.
*/
import { useEffect, useState } from "preact/hooks";
import { useStore } from "../lib/use-store.js";
import { useDisclosure } from "../lib/use-disclosure.js";
import Reveal from "./Reveal.jsx";
import ShowAll from "./ShowAll.jsx";
import Prompt from "./Prompt.jsx";
import { themes as themesOf, chosenValues } from "../lib/carry-forward.js";
import { emptyGoal } from "../lib/schema.js";
import { pathForStep } from "../lib/steps.js";
import { monthOptions } from "../lib/dates.js";

export default function Step5({ prompts = [] }) {
  const [state, set] = useStore();
  const [allValues, setAllValues] = useState(null);
  const byName = (name) => prompts.find((p) => p.name.toLowerCase().includes(name)) || {};

  const themes = themesOf(state);
  const picked = chosenValues(state);

  // A goal can be anchored to a value the visitor didn't shortlist, so offer
  // the full list too — loaded on demand.
  useEffect(() => {
    if (picked.length >= 3) return;
    import("../lib/values.js").then((m) => setAllValues(m.ALL_VALUES));
  }, [picked.length]);

  // Make sure every theme has a goal card to write into.
  useEffect(() => {
    if (!themes.length) return;
    const missing = themes.filter((t) => !state.step5.goals.some((g) => g.themeId === t.id));
    if (!missing.length) return;
    set((s) => {
      for (const theme of missing) {
        if (s.step5.goals.length >= 3) break;
        s.step5.goals.push(emptyGoal(theme.id));
      }
    });
  }, [themes.map((t) => t.id).join(",")]);

  if (!themes.length) {
    return (
      <div class="callout warn">
        <h2>Your themes come first</h2>
        <p>
          Goals hang off the three themes you choose in Step 4.
          <a href={pathForStep(4)}> Go back and name them</a>, then come here.
        </p>
      </div>
    );
  }

  const setGoal = (goalId, field, value) =>
    set((s) => {
      const g = s.step5.goals.find((x) => x.id === goalId);
      if (g) g[field] = value;
    });

  const setPriority = (goalId) =>
    set((s) => { s.step5.priorityGoalId = s.step5.priorityGoalId === goalId ? null : goalId; },
      { immediate: true });

  const valueOptions = picked.length
    ? picked
    : (allValues || []);

  /*
    Here the unit is a card, not a prompt: the next goal card arrives once the
    one above it says what done looks like. Three empty goal forms at once is
    the most daunting screen in the whole journey.
  */
  const filled = (v) => Boolean(v && String(v).trim());
  const goalFor = (theme) => state.step5.goals.find((g) => g.themeId === theme.id);
  const { visible, allShown, showAll } = useDisclosure([
    ...themes.map((t) => filled(goalFor(t)?.done)),
  ]);
  const anyGoal = themes.some((t) => filled(goalFor(t)?.done));
  const months = monthOptions();

  const q = {
    done: byName("what done"),
    why: byName("why it matters"),
    date: byName("by when"),
    habit: byName("habit"),
    first: byName("first step"),
    priority: byName("priority"),
  };

  return (
    <div class="step-prompts">
      <div class="goal-guide">
        <p class="goal-intro">
          One goal per theme, up to three. Every field is optional — a half-filled
          goal still beats a vague one.
        </p>
        <ul class="goal-guide-list">
          <li><b>How you'll know</b> — what would make you say yes without hesitating?</li>
          <li><b>Why it matters</b> — if it serves none of your values, is it really yours?</li>
          <li><b>The habit</b> — small enough to survive a busy week.</li>
          <li><b>This week</b> — if it takes more than an hour, break it down again.</li>
        </ul>
      </div>

      <ol class="goal-cards">
        {themes.map((theme, i) => {
          const goal = state.step5.goals.find((g) => g.themeId === theme.id);
          if (!goal) return null;
          const isPriority = state.step5.priorityGoalId === goal.id;
          return (
            <Reveal
              key={theme.id}
              when={visible[i]}
              as="li"
              class={`goal-card${isPriority ? " priority" : ""}`}
            >
              <div class="goal-card-head">
                <p class="label">Theme {i + 1}</p>
                <h2 class="goal-card-title">{theme.text}</h2>
              </div>

              <div class="goal-fields">
                <div class="field goal-done">
                  <label for={`done-${goal.id}`}>{q.done.question}</label>
                  <input
                    id={`done-${goal.id}`} type="text" value={goal.done}
                    placeholder={i === 0 ? q.done.example : ""} maxLength={500}
                    onInput={(e) => setGoal(goal.id, "done", e.currentTarget.value)}
                  />
                </div>

                <div class="field">
                  <label for={`value-${goal.id}`}>The value it serves</label>
                  <select
                    id={`value-${goal.id}`}
                    value={goal.valueSlug || ""}
                    onChange={(e) => setGoal(goal.id, "valueSlug", e.currentTarget.value || null)}
                  >
                    <option value="">Choose a value…</option>
                    {valueOptions.map((v) => (
                      <option key={v.slug} value={v.slug}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div class="field">
                  <label for={`why-${goal.id}`}>Why it matters to you</label>
                  <input
                    id={`why-${goal.id}`}
                    type="text" value={goal.why}
                    placeholder={i === 0 ? stripValue(q.why.example) : ""}
                    maxLength={500}
                    onInput={(e) => setGoal(goal.id, "why", e.currentTarget.value)}
                  />
                </div>

                <div class="field">
                  <label for={`habit-${goal.id}`}>The habit that carries it</label>
                  <input
                    id={`habit-${goal.id}`} type="text" value={goal.habit}
                    placeholder={i === 0 ? q.habit.example : ""} maxLength={400}
                    onInput={(e) => setGoal(goal.id, "habit", e.currentTarget.value)}
                  />
                </div>

                <div class="field">
                  <label for={`first-${goal.id}`}>This week</label>
                  <input
                    id={`first-${goal.id}`} type="text" value={goal.firstStep}
                    placeholder={i === 0 ? q.first.example : ""} maxLength={400}
                    onInput={(e) => setGoal(goal.id, "firstStep", e.currentTarget.value)}
                  />
                </div>

                <div class="field">
                  <label for={`date-${goal.id}`}>Done by</label>
                  <select
                    id={`date-${goal.id}`}
                    class="month-select"
                    value={goal.date}
                    onChange={(e) => setGoal(goal.id, "date", e.currentTarget.value)}
                  >
                    <option value="">No date yet</option>
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Reveal>
          );
        })}
      </ol>

      <Reveal when={anyGoal}>
        <Prompt prompt={q.priority}>
          <ul class="priority-choice" role="radiogroup" aria-label={q.priority.question}>
            {themes.map((theme) => {
              const goal = goalFor(theme);
              if (!goal || !filled(goal.done)) return null;
              const isPriority = state.step5.priorityGoalId === goal.id;
              return (
                <li key={goal.id}>
                  <button
                    type="button"
                    class="priority-option"
                    role="radio"
                    aria-checked={isPriority}
                    onClick={() => setPriority(goal.id)}
                  >
                    <span class="priority-mark" aria-hidden="true">{isPriority ? "★" : "☆"}</span>
                    <span class="priority-text">
                      <b>{goal.done}</b>
                      <em>{theme.text}</em>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {state.step5.priorityGoalId && (
            <p class="note">This one leads your vision document.</p>
          )}
        </Prompt>
      </Reveal>

      <ShowAll allShown={allShown} onShow={showAll} label="Show all goals" />
    </div>
  );
}

/** "Creativity. I want to make something that's mine." → the sentence. */
const stripValue = (example = "") => {
  const parts = String(example).split(". ");
  return parts.length > 1 ? parts.slice(1).join(". ") : example;
};
