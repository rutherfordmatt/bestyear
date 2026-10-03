/*
  The vision document. One renderer, two modes:
  - compact  → the "Your plan so far" panel, filling in as steps complete
  - full     → Step 7, editable, printable

  Because the panel and the final page are the same component, the preview can
  never disagree with what gets printed or emailed.

  Section order is fixed by content/step-7.md.
*/
import LifeWheelChart from "./LifeWheelChart.jsx";
import * as cf from "../lib/carry-forward.js";
import { LETTING_GO_BUCKETS, CORNER_OPTIONS, pathForStep } from "../lib/steps.js";
import { formatDate, formatLongDate } from "../lib/dates.js";

const has = (v) => Boolean(v && String(v).trim());

/** A section that shows a greyed prompt instead of vanishing when empty. */
function Section({ title, step, filled, compact, children, hint }) {
  if (!filled && !compact) return null;
  return (
    <section class={`vd-section${filled ? "" : " vd-empty"}`}>
      {title && <h3 class="vd-h">{title}</h3>}
      {filled ? children : (
        <p class="vd-placeholder">
          {hint || "Not yet"} — <a href={pathForStep(step)}>Step {step}</a>
        </p>
      )}
    </section>
  );
}

export default function VisionDocument({ state, compact = false, editable = false, onEdit = null }) {
  const s = state;
  const values = cf.chosenValues(s);
  const lessons = cf.lessons(s);
  const letting = cf.lettingGo(s);
  const themes = cf.themes(s);
  const goals = cf.goalsForDocument(s);
  const pairs = cf.ifThenPairs(s);
  const rated = cf.ratedAreas(s);
  const corner = s.step6.corner;
  const cornerNames = corner.who
    .map((k) => CORNER_OPTIONS.find((o) => o.key === k)?.name)
    .filter(Boolean);

  const Editable = ({ field, value, tag: Tag = "p", ...rest }) => {
    if (!editable) return <Tag {...rest}>{value}</Tag>;
    return (
      <Tag
        {...rest}
        contentEditable
        suppressHydrationWarning
        onBlur={(e) => onEdit?.(field, e.currentTarget.textContent.trim())}
        dangerouslySetInnerHTML={{ __html: escapeHtml(value) }}
      />
    );
  };

  return (
    <article class={`vision-doc${compact ? " compact" : ""}`}>
      {/* 1 — Hero */}
      <header class="vd-hero">
        {has(s.step4.headline) ? (
          <Editable field="headline" value={s.step4.headline} tag="h2" class="vd-headline" />
        ) : (
          <p class="vd-placeholder vd-headline-empty">
            Your headline for the year ahead — <a href={pathForStep(4)}>Step 4</a>
          </p>
        )}
        {has(s.step4.word) && (
          <p class="vd-word">
            My word for the year: <em>{s.step4.word}</em>
          </p>
        )}
      </header>

      {/* 2 — The year behind */}
      {(has(s.yearEnding.word) || has(s.step3.closingLine)) && (
        <section class="vd-section vd-behind">
          <h3 class="vd-h">The year behind</h3>
          {has(s.yearEnding.word) && (
            <p class="vd-behind-word">A year of <em>{s.yearEnding.word}</em></p>
          )}
          {has(s.step3.closingLine) && (
            <blockquote class="vd-quote">
              <Editable field="closingLine" value={s.step3.closingLine} tag="p" />
            </blockquote>
          )}
        </section>
      )}

      {/* 3 — Life wheel */}
      <Section title="Your life wheel" step={1} filled={rated.length > 0} compact={compact}
               hint="Rate your six life areas">
        <LifeWheelChart wheel={s.step1.wheel} size={compact ? 240 : 340} id={compact ? "wheel-panel" : "wheel-doc"} />
      </Section>

      {/* 4 — Values */}
      <Section title="What matters" step={2} filled={values.length > 0} compact={compact}
               hint="Choose your values">
        <ul class="vd-values">
          {values.map((v) => (
            <li key={v.slug}>
              <b>{v.name}</b>
              {typeof v.alignment === "number" && (
                <span class={`vd-align${v.alignment <= cf.GAP_THRESHOLD ? " gap" : ""}`}>
                  lived it {v.alignment}/5
                </span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      {/* 5 — Lessons */}
      <Section title="Lessons I'm carrying forward" step={3} filled={lessons.length > 0} compact={compact}
               hint="Name what the year taught you">
        <ol class="vd-list">
          {lessons.map((l, i) => <li key={i}>{l}</li>)}
        </ol>
      </Section>

      {/* 6 — Leaving behind */}
      <Section title="Leaving behind" step={3} filled={letting.length > 0} compact={compact}
               hint="Name what you're putting down">
        <ul class="vd-letting">
          {LETTING_GO_BUCKETS.map((bucket) => {
            const items = letting.filter((l) => l.bucket === bucket.key);
            if (!items.length) return null;
            return (
              <li key={bucket.key}>
                <span class="vd-bucket">{bucket.name}</span>
                <span>{items.map((i) => i.text).join(" · ")}</span>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* 7 — Themes */}
      <Section title="My three themes" step={4} filled={themes.length > 0} compact={compact}
               hint="Choose three themes">
        <ul class="vd-themes">
          {themes.map((t) => <li key={t.id}>{t.text}</li>)}
        </ul>
      </Section>

      {/* 8 — Goals, priority first */}
      <Section title="My goals" step={5} filled={goals.length > 0} compact={compact}
               hint="Set up to three goals">
        <ol class="vd-goals">
          {goals.map((g) => {
            const theme = cf.themeOf(s, g);
            const value = cf.valueOf(g);
            const isPriority = g.id === s.step5.priorityGoalId;
            return (
              <li key={g.id} class={`goal${isPriority ? " priority" : ""}`}>
                <p class="vd-goal-head">
                  {isPriority && <span class="star" aria-label="Priority goal">★</span>}
                  <b>{g.done}</b>
                </p>
                <p class="vd-goal-meta">
                  {theme && <span>{theme.text}</span>}
                  {value && <span>{value.name}</span>}
                  {has(g.date) && <span>by {formatDate(g.date)}</span>}
                </p>
                {has(g.why) && <p class="vd-goal-why">{g.why}</p>}
                {has(g.habit) && <p class="vd-goal-line"><span>Habit</span> {g.habit}</p>}
                {has(g.firstStep) && <p class="vd-goal-line"><span>First step</span> {g.firstStep}</p>}
              </li>
            );
          })}
        </ol>
      </Section>

      {/* 9 — If-then */}
      <Section title="When it gets hard" step={6} filled={pairs.length > 0} compact={compact}
               hint="Plan for the bad days">
        <ul class="vd-ifthen">
          {pairs.map(({ goal, pair }) => (
            <li key={goal.id} class="if-then">
              <span class="vd-if">If {stripLead(pair.if)}</span>
              <span class="vd-then">then I will {stripLead(pair.then)}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 10 — My corner */}
      <Section title="In my corner" step={6} filled={cornerNames.length > 0 || has(corner.ask)} compact={compact}
               hint="Decide who's with you">
        {cornerNames.length > 0 && <p class="vd-corner-who">{cornerNames.join(" · ")}</p>}
        {has(corner.ask) && <p class="vd-corner-ask">{corner.ask}</p>}
      </Section>

      {/* 11 — Note to future self and check-ins */}
      {has(s.step7.noteToFutureSelf) && (
        <section class="vd-section vd-note">
          <h3 class="vd-h">A note to myself</h3>
          <blockquote class="vd-quote">
            <Editable field="noteToFutureSelf" value={s.step7.noteToFutureSelf} tag="p" />
          </blockquote>
        </section>
      )}

      {(s.step7.checkIns.length > 0 || has(s.step7.livesAt)) && (
        <section class="vd-section vd-checkins">
          <h3 class="vd-h">Keeping it alive</h3>
          {has(s.step7.livesAt) && <p class="vd-lives">This page lives: {s.step7.livesAt}</p>}
          {s.step7.checkIns.length > 0 && (
            <ul class="vd-dates">
              {s.step7.checkIns.map((d) => <li key={d}>{formatLongDate(d)}</li>)}
            </ul>
          )}
        </section>
      )}

      {!compact && (
        <footer class="vd-footer">
          <p>Built at yearwellbuilt.com</p>
        </footer>
      )}
    </article>
  );
}

/** "...work runs late" → "work runs late". The copy supplies the lead-in. */
function stripLead(text = "") {
  return String(text).replace(/^\s*\.{3}\s*/, "").replace(/^(if|then i will)\s+/i, "").trim();
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
