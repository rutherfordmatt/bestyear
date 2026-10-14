/*
  Step 6: Obstacles and support. One if-then card per goal, then who's in
  your corner.
*/
import { useStore } from "../lib/use-store.js";
import CardDeck from "./CardDeck.jsx";
import StepSummary from "./StepSummary.jsx";
import { goals as goalsOf, themeOf } from "../lib/carry-forward.js";
import { CORNER_OPTIONS } from "../lib/steps.js";
import { BOOKING_URL } from "../lib/config.js";
import { track, EVENTS } from "../lib/analytics.js";

const cleanEllipsis = (s = "") => String(s).replace(/^\s*\.{3}\s*/, "").replace(/,\s*$/, "");

export default function Step6Cards({
  prompts = [], coachNote = "", cornerOptions = [],
  titleHtml = "", intro = [], transition = "",
}) {
  const [state, set] = useStore();
  const byName = (n) => prompts.find((p) => p.name.toLowerCase().includes(n)) || {};
  const ifPrompt = byName("if");
  const thenPrompt = byName("then");
  const cornerPrompt = byName("corner");
  const goals = goalsOf(state);

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

  const cards = [
    {
      key: "scene", variant: "scene", eyebrow: "Step 6 of 7",
      title: "Obstacles and support", titleHtml, nextLabel: "Begin",
      body: <>{intro.map((p, i) => <p class="lede" key={i}>{p}</p>)}</>,
    },
  ];

  if (!goals.length) {
    cards.push({
      key: "no-goals", title: "Your goals come first",
      body: (
        <p class="lede">
          If-then plans attach to the goals you set in Step 5.
          {" "}<a href="/step/5">Set them first</a>, then come back.
        </p>
      ),
    });
  }

  goals.forEach((goal, i) => {
    const pair = state.step6.ifThen[goal.id] || { if: "", then: "" };
    const theme = themeOf(state, goal);
    cards.push({
      key: goal.id,
      title: ifPrompt.question || "What's most likely to get in the way?",
      guidance: i === 0 ? ifPrompt.hint : null,
      body: (
        <>
          <div class="ifthen-goal">
            {theme && <span class="label">{theme.text}</span>}
            <p><b>{goal.done}</b></p>
          </div>
          <div class="ifthen-fields">
            <div class="field">
              <label for={`if-${goal.id}`}>If…</label>
              <input id={`if-${goal.id}`} type="text" value={pair.if}
                placeholder={i === 0 ? cleanEllipsis(ifPrompt.example) : ""} maxLength={500}
                onInput={(e) => setPair(goal.id, "if", e.currentTarget.value)} />
            </div>
            <div class="field">
              <label for={`then-${goal.id}`}>…then I will</label>
              <input id={`then-${goal.id}`} type="text" value={pair.then}
                placeholder={i === 0 ? cleanEllipsis(thenPrompt.example) : ""} maxLength={500}
                onInput={(e) => setPair(goal.id, "then", e.currentTarget.value)} />
            </div>
          </div>
        </>
      ),
    });
  });

  cards.push({
    key: "corner", variant: "wide",
    title: cornerPrompt.question, guidance: cornerPrompt.hint,
    body: (
      <>
        <div class="corner-options">
          {options.map((opt) => (
            <button key={opt.key} type="button" class="chip"
              aria-pressed={state.step6.corner.who.includes(opt.key)}
              onClick={() => toggleWho(opt.key)}>
              {opt.name}
            </button>
          ))}
        </div>
        {state.step6.corner.who.includes("coach") && coachNote && (
          <aside class="callout coach-note">
            <p>{coachNote}</p>
            <a class="btn small primary" href={BOOKING_URL} onClick={() => track(EVENTS.bookingClicked)}>
              Find out more
            </a>
          </aside>
        )}
        <div class="field">
          <label for="corner-ask">{cornerPrompt.followUp || "What will you ask them for?"}</label>
          <textarea id="corner-ask" value={state.step6.corner.ask}
            placeholder={cornerPrompt.example} maxLength={800} rows={3}
            onInput={(e) => set((s) => { s.step6.corner.ask = e.currentTarget.value; })}></textarea>
        </div>
      </>
    ),
  });

  cards.push({
    key: "summary", variant: "summary", title: "Added to your plan",
    body: <StepSummary step={6} transition={transition} showNext={false} />,
  });

  return (
    <CardDeck cards={cards} step={6} backTo="/step/5" onLeave="/step/7"
      leaveLabel="Next: Your year, on one page" />
  );
}
