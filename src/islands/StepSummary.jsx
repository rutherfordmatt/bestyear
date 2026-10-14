/*
  The "Added to your plan" moment at the end of each step: what just landed on
  the vision document, the step's hand-over line, and the way on.

  The way on matters. The summary sat on the left and the Next button in the
  opposite corner of the bar, so finishing and continuing were two unrelated
  gestures. Carrying the next step here makes them one.
*/
import { useStore } from "../lib/use-store.js";
import { addedInStep } from "../lib/carry-forward.js";
import { markStepComplete } from "../lib/storage.js";
import { STEPS, pathForStep, stepByNumber } from "../lib/steps.js";
import { track, EVENTS } from "../lib/analytics.js";

export default function StepSummary({ step, transition }) {
  const [state] = useStore();
  const n = Number(step);
  const added = addedInStep(state, n);

  // Nothing added yet means nothing to hand over from.
  if (!added.length) return null;

  const isLast = n >= STEPS.length;
  const next = isLast ? "/close" : pathForStep(n + 1);
  const nextStep = isLast ? null : stepByNumber(n + 1);
  const label = isLast ? "Finish" : `Next: ${nextStep.title}`;

  const onNext = () => {
    markStepComplete(n);
    if (!isLast) track(EVENTS.stepReached(n + 1));
  };

  return (
    <div class="step-summary" role="status">
      <p class="label">Added to your plan</p>
      <ul>
        {added.map((item) => (
          <li key={item.label}>
            <span class="tick" aria-hidden="true">✓</span>
            <b>{item.label}</b>
            <em>{item.detail}</em>
          </li>
        ))}
      </ul>
      {transition && <p class="step-transition">{transition}</p>}
      <p class="summary-next">
        <a class="btn primary" href={next} onClick={onNext}>
          {label} <span aria-hidden="true">→</span>
        </a>
      </p>
    </div>
  );
}
