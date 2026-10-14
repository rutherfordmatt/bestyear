/*
  Step 7: your year, on one page.

  The document itself is a wide card — it is the artefact, not a question.
  The note to future self is a moment. The booking ask comes last, after the
  plan is safely theirs.
*/
import { useEffect, useState } from "preact/hooks";
import { useStore } from "../lib/use-store.js";
import CardDeck from "./CardDeck.jsx";
import VisionDocument from "./VisionDocument.jsx";
import SendForm from "./SendForm.jsx";
import { downloadIcs } from "../lib/ics.js";
import { suggestedCheckIns, formatLongDate } from "../lib/dates.js";
import { track, EVENTS } from "../lib/analytics.js";
import { BOOKING_URL } from "../lib/config.js";

export default function Step7Cards({
  prompts = [], livesOptions = [], actions = {},
  titleHtml = "", intro = [],
}) {
  const [state, set] = useStore();
  const [seeded, setSeeded] = useState(false);
  const byName = (n) => prompts.find((p) => p.name.toLowerCase().includes(n)) || {};
  const notePrompt = byName("note to your future self");
  const alivePrompt = byName("keep it alive");
  const aliveQ = (i, fallback) => alivePrompt.questions?.[i] || fallback;

  useEffect(() => {
    if (seeded || state.step7.checkIns.length) return;
    set((s) => { s.step7.checkIns = suggestedCheckIns(new Date()); });
    setSeeded(true);
  }, [state.step7.checkIns.length, seeded]);

  const onEdit = (field, value) =>
    set((s) => {
      if (field === "headline") s.step3.headline = value;
      else if (field === "closingLine") s.step2.closingLine = value;
      else if (field === "noteToFutureSelf") s.step7.noteToFutureSelf = value;
      else s.step7.overrides[field] = value;
    }, { immediate: true });

  const setCheckIn = (i, value) =>
    set((s) => { const next = [...s.step7.checkIns]; next[i] = value; s.step7.checkIns = next.filter(Boolean); });
  const removeCheckIn = (i) =>
    set((s) => { s.step7.checkIns = s.step7.checkIns.filter((_, j) => j !== i); }, { immediate: true });

  const cards = [
    {
      key: "scene", variant: "scene", eyebrow: "Step 7 of 7",
      title: "Your year, on one page", titleHtml, nextLabel: "See it",
      body: <>{intro.map((p, i) => <p class="lede" key={i}>{p}</p>)}</>,
    },
    {
      key: "document", variant: "wide",
      title: byName("review").question || "Does this sound like you?",
      guidance: "This is exactly what prints. The headline and the closing line can be edited here; everything else lives in its step.",
      body: (
        <>
          <div class="doc-holder"><VisionDocument state={state} editable onEdit={onEdit} /></div>
          <div class="doc-actions no-print">
            <button type="button" class="btn"
              onClick={() => { track(EVENTS.printed); window.print(); }}>
              Save as PDF or print
            </button>
            <p class="note">Your browser's print dialog has a "Save as PDF" option.</p>
          </div>
        </>
      ),
    },
    {
      key: "note", variant: "moment",
      title: notePrompt.question, guidance: notePrompt.hint,
      body: (
        <input type="text" class="moment-input"
          value={state.step7.noteToFutureSelf} placeholder={notePrompt.example}
          maxLength={500} aria-label={notePrompt.question}
          onInput={(e) => set((s) => { s.step7.noteToFutureSelf = e.currentTarget.value; })} />
      ),
    },
    {
      key: "alive", variant: "wide",
      title: alivePrompt.name || "Keep it alive", guidance: alivePrompt.hint,
      body: (
        <>
          <div class="field">
            <span class="field-label">{aliveQ(0, "Where will this page live?")}</span>
            <div class="corner-options">
              {livesOptions.map((opt) => (
                <button key={opt} type="button" class="chip"
                  aria-pressed={state.step7.livesAt === opt}
                  onClick={() => set((s) => {
                    s.step7.livesAt = s.step7.livesAt === opt ? "" : opt;
                  }, { immediate: true })}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div class="field check-ins">
            <span class="field-label">{aliveQ(1, "When will you check in on it?")}</span>
            <ul class="checkin-list">
              {state.step7.checkIns.map((date, i) => (
                <li key={`${date}-${i}`}>
                  <input type="date" value={date}
                    aria-label={`Check-in ${i + 1}, ${formatLongDate(date)}`}
                    onInput={(e) => setCheckIn(i, e.currentTarget.value)} />
                  <button type="button" class="list-remove" onClick={() => removeCheckIn(i)}
                    aria-label={`Remove check-in on ${formatLongDate(date)}`}>×</button>
                </li>
              ))}
            </ul>
            <button type="button" class="btn small" disabled={!state.step7.checkIns.length}
              onClick={() => {
                downloadIcs(state.step7.checkIns, {
                  summary: "Check in on my year",
                  description: "Read your vision document. What's working? What's drifted?",
                });
                track(EVENTS.icsDownloaded);
              }}>
              Add check-ins to my calendar
            </button>
          </div>
        </>
      ),
    },
    {
      key: "send", variant: "wide",
      title: "Email it to me", guidance: actions.line,
      body: <SendForm actions={actions} headless />,
    },
    {
      key: "clarity", variant: "scene", eyebrow: "If you'd like a second pair of eyes",
      title: "Want an hour to pressure-test it?",
      body: (
        <>
          <p class="lede">
            A Clarity Session is one focused hour with me. Bring the plan you've
            just made — it's the pre-work.
          </p>
          <p>
            <a class="btn primary" href={BOOKING_URL}
              onClick={() => track(EVENTS.bookingClicked)}
              data-umami-event="booking-clicked" data-umami-event-from="step-7">
              Book a Clarity Session
            </a>
          </p>
        </>
      ),
    },
  ];

  return (
    <CardDeck cards={cards} step={7} backTo="/step/6" onLeave="/close" leaveLabel="Finish" />
  );
}
