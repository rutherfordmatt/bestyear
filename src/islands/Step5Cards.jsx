/*
  Step 5: Goals. One card per theme, then the priority as a moment.
  The goal card is the one place a card holds several fields — they are all
  about the same goal, and splitting them would make five cards per theme.
*/
import { useEffect, useState } from "preact/hooks";
import { useStore } from "../lib/use-store.js";
import CardDeck from "./CardDeck.jsx";
import StepSummary from "./StepSummary.jsx";
import { themes as themesOf, chosenValues } from "../lib/carry-forward.js";
import { emptyGoal } from "../lib/schema.js";
import { monthOptions } from "../lib/dates.js";

export default function Step5Cards({ prompts = [], titleHtml = "", intro = [], transition = "" }) {
  const [state, set] = useStore();
  const [allValues, setAllValues] = useState(null);
  const byName = (n) => prompts.find((p) => p.name.toLowerCase().includes(n)) || {};
  const q = {
    done: byName("what done"), why: byName("why it matters"), habit: byName("habit"),
    first: byName("first step"), priority: byName("priority"), when: byName("by when"),
  };
  const filled = (v) => Boolean(v && String(v).trim());
  const themes = themesOf(state);
  const picked = chosenValues(state);
  const months = monthOptions();

  useEffect(() => {
    if (picked.length >= 3) return;
    import("../lib/values.js").then((m) => setAllValues(m.ALL_VALUES));
  }, [picked.length]);

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

  const setGoal = (goalId, field, value) =>
    set((s) => { const g = s.step5.goals.find((x) => x.id === goalId); if (g) g[field] = value; });
  const setPriority = (goalId) =>
    set((s) => { s.step5.priorityGoalId = s.step5.priorityGoalId === goalId ? null : goalId; },
      { immediate: true });
  const goalFor = (theme) => state.step5.goals.find((g) => g.themeId === theme.id);
  const valueOptions = picked.length ? picked : (allValues || []);

  const cards = [
    {
      key: "scene", variant: "scene", eyebrow: "Step 5 of 7",
      title: "Goals", titleHtml, nextLabel: "Begin",
      body: <>{intro.map((p, i) => <p class="lede" key={i}>{p}</p>)}</>,
    },
  ];

  if (!themes.length) {
    cards.push({
      key: "no-themes", title: "Your themes come first",
      body: (
        <p class="lede">
          Goals hang off the three themes you choose in Step 4.
          {" "}<a href="/step/4">Go back and name them</a>, then come here.
        </p>
      ),
    });
  }

  themes.forEach((theme, i) => {
    const goal = goalFor(theme);
    if (!goal) return;
    cards.push({
      key: theme.id,
      variant: "wide",
      // The first line of a goal card is the visitor's own theme, carried
      // from Step 4. Without saying so it reads as a question we invented.
      eyebrow: `Theme ${i + 1} of ${themes.length} · from Step 4`,
      title: theme.text,
      guidance: i === 0 ? "Every field is optional — a half-filled goal still beats a vague one." : null,
      body: (
        <div class="goal-fields">
          <div class="field goal-done">
            <label for={`done-${goal.id}`}>{q.done.label || q.done.question}</label>
            <input id={`done-${goal.id}`} type="text" value={goal.done}
              placeholder={i === 0 ? q.done.example : ""} maxLength={500}
              onInput={(e) => setGoal(goal.id, "done", e.currentTarget.value)} />
          </div>
          <div class="field">
            <label for={`value-${goal.id}`}>{q.why.valueLabel || "The value it serves"}</label>
            <select id={`value-${goal.id}`} value={goal.valueSlug || ""}
              onChange={(e) => setGoal(goal.id, "valueSlug", e.currentTarget.value || null)}>
              <option value="">Choose a value…</option>
              {valueOptions.map((v) => <option key={v.slug} value={v.slug}>{v.name}</option>)}
            </select>
          </div>
          <div class="field">
            <label for={`why-${goal.id}`}>{q.why.label || "Why it matters to you"}</label>
            <input id={`why-${goal.id}`} type="text" value={goal.why}
              maxLength={500}
              onInput={(e) => setGoal(goal.id, "why", e.currentTarget.value)} />
          </div>
          <div class="field">
            <label for={`habit-${goal.id}`}>{q.habit.label || "The habit that carries it"}</label>
            <input id={`habit-${goal.id}`} type="text" value={goal.habit}
              placeholder={i === 0 ? q.habit.example : ""} maxLength={400}
              onInput={(e) => setGoal(goal.id, "habit", e.currentTarget.value)} />
          </div>
          <div class="field">
            <label for={`first-${goal.id}`}>{q.first.label || "Your first step, this week"}</label>
            <input id={`first-${goal.id}`} type="text" value={goal.firstStep}
              placeholder={i === 0 ? q.first.example : ""} maxLength={400}
              onInput={(e) => setGoal(goal.id, "firstStep", e.currentTarget.value)} />
          </div>
          <div class="field">
            <label for={`date-${goal.id}`}>{q.when.label || "Done by"}</label>
            <select id={`date-${goal.id}`} class="month-select" value={goal.date}
              onChange={(e) => setGoal(goal.id, "date", e.currentTarget.value)}>
              <option value="">No date yet</option>
              {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
      ),
    });
  });

  if (themes.some((t) => filled(goalFor(t)?.done))) {
    cards.push({
      key: "priority", variant: "moment",
      title: q.priority.question, guidance: q.priority.hint,
      body: (
        <ul class="priority-choice" role="radiogroup" aria-label={q.priority.question}>
          {themes.map((theme) => {
            const goal = goalFor(theme);
            if (!goal || !filled(goal.done)) return null;
            const isPriority = state.step5.priorityGoalId === goal.id;
            return (
              <li key={goal.id}>
                <button type="button" class="priority-option" role="radio"
                  aria-checked={isPriority} onClick={() => setPriority(goal.id)}>
                  <span class="priority-mark" aria-hidden="true">{isPriority ? "★" : "☆"}</span>
                  <span class="priority-text"><b>{goal.done}</b><em>{theme.text}</em></span>
                </button>
              </li>
            );
          })}
        </ul>
      ),
    });
  }

  cards.push({
    key: "summary", variant: "summary", title: "Added to your plan",
    body: <StepSummary step={5} transition={transition} showNext={false} />,
  });

  return (
    <CardDeck cards={cards} step={5} backTo="/step/4" onLeave="/step/6"
      leaveLabel="Next: Obstacles and support" />
  );
}
