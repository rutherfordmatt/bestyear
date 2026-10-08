/*
  Step 7: your year, on one page.

  The document itself is editable in place; edits are stored as overrides so
  the rest of it stays live against the underlying answers.
*/
import { useEffect, useState } from "preact/hooks";
import { useStore } from "../lib/use-store.js";
import VisionDocument from "./VisionDocument.jsx";
import SendForm from "./SendForm.jsx";
import { downloadIcs } from "../lib/ics.js";
import { suggestedCheckIns, formatLongDate } from "../lib/dates.js";
import { track, EVENTS } from "../lib/analytics.js";

export default function Step7({ prompts = [], livesOptions = [], actions = {} }) {
  const [state, set] = useStore();
  const [seeded, setSeeded] = useState(false);
  const byName = (name) => prompts.find((p) => p.name.toLowerCase().includes(name)) || {};

  const notePrompt = byName("note to your future self");
  const alivePrompt = byName("keep it alive");
  const aliveQ = (i, fallback) => alivePrompt.questions?.[i] || fallback;

  // Suggest four quarterly check-ins from today. Editable, and never
  // overwritten once the visitor has their own.
  useEffect(() => {
    if (seeded || state.step7.checkIns.length) return;
    set((s) => { s.step7.checkIns = suggestedCheckIns(new Date()); });
    setSeeded(true);
  }, [state.step7.checkIns.length, seeded]);

  const onEdit = (field, value) =>
    set((s) => {
      // An edit to a field that lives on an earlier step writes back to that
      // step, so the plan panel and the email agree with the document.
      if (field === "headline") s.step3.headline = value;
      else if (field === "closingLine") s.step2.closingLine = value;
      else if (field === "noteToFutureSelf") s.step7.noteToFutureSelf = value;
      else s.step7.overrides[field] = value;
    }, { immediate: true });

  const setCheckIn = (index, value) =>
    set((s) => {
      const next = [...s.step7.checkIns];
      next[index] = value;
      s.step7.checkIns = next.filter(Boolean);
    });

  const removeCheckIn = (index) =>
    set((s) => { s.step7.checkIns = s.step7.checkIns.filter((_, i) => i !== index); },
      { immediate: true });

  return (
    <div class="step7">
      <section class="prompt doc-section">
        <div class="prompt-head">
          <h2 class="prompt-question">{byName("review").question || "Does this sound like you?"}</h2>
          <p class="note">Click any line to edit it. This is exactly what prints.</p>
        </div>
        <div class="doc-holder">
          <VisionDocument state={state} editable onEdit={onEdit} />
        </div>
        <div class="doc-actions no-print">
          <button
            type="button"
            class="btn primary"
            onClick={() => { track(EVENTS.printed); window.print(); }}
          >
            Save as PDF or print
          </button>
          <p class="note">Your browser's print dialog has a "Save as PDF" option.</p>
        </div>
      </section>

      <section class="prompt">
        <div class="prompt-head">
          <h2 class="prompt-question">{notePrompt.question}</h2>
          {notePrompt.hint && <p class="tip">{notePrompt.hint}</p>}
        </div>
        <div class="prompt-body">
          <input
            type="text"
            class="closing-line"
            value={state.step7.noteToFutureSelf}
            placeholder={notePrompt.example}
            maxLength={500}
            aria-label={notePrompt.question}
            onInput={(e) => set((s) => { s.step7.noteToFutureSelf = e.currentTarget.value; })}
          />
        </div>
      </section>

      <section class="prompt">
        <div class="prompt-head">
          {/* This prompt asks two questions, so its name is the heading and
              each question labels its own field. */}
          <h2 class="prompt-question">{alivePrompt.name || "Keep it alive"}</h2>
        </div>

        <div class="field">
          <span class="field-label">{aliveQ(0, "Where will this page live?")}</span>
          <div class="corner-options">
            {livesOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                class="chip"
                aria-pressed={state.step7.livesAt === opt}
                onClick={() => set((s) => {
                  s.step7.livesAt = s.step7.livesAt === opt ? "" : opt;
                }, { immediate: true })}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div class="field check-ins">
          <span class="field-label">{aliveQ(1, "When will you check in on it?")}</span>
          <p class="hint">Suggested every three months from today. Change any date you like.</p>
          <ul class="checkin-list">
            {state.step7.checkIns.map((date, i) => (
              <li key={`${date}-${i}`}>
                <input
                  type="date"
                  value={date}
                  aria-label={`Check-in ${i + 1}`}
                  onInput={(e) => setCheckIn(i, e.currentTarget.value)}
                />
                <span class="checkin-day">{formatLongDate(date)}</span>
                <button
                  type="button"
                  class="list-remove"
                  onClick={() => removeCheckIn(i)}
                  aria-label={`Remove check-in on ${formatLongDate(date)}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            class="btn small"
            disabled={!state.step7.checkIns.length}
            onClick={() => {
              downloadIcs(state.step7.checkIns, {
                summary: "Check in on my year",
                description:
                  "Read your vision document. What's working? What's drifted? What's one thing to adjust before the next check-in?",
              });
              track(EVENTS.icsDownloaded);
            }}
          >
            Add check-ins to my calendar
          </button>
        </div>
      </section>

      <SendForm actions={actions} />
    </div>
  );
}
