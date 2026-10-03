/*
  Back / next for a step. "Next" marks the step complete, so the progress rail
  and the plan panel stay honest, and the save is immediate — a fast navigation
  must never lose the step.
*/
import { markStepComplete } from "../lib/storage.js";
import { STEPS, pathForStep } from "../lib/steps.js";
import { track, EVENTS } from "../lib/analytics.js";

export default function StepNav({ step }) {
  const n = Number(step);
  const prev = n > 1 ? pathForStep(n - 1) : "/setup";
  const isLast = n >= STEPS.length;
  const next = isLast ? "/close" : pathForStep(n + 1);

  const onNext = () => {
    markStepComplete(n);
    if (!isLast) track(EVENTS.stepReached(n + 1));
  };

  return (
    <nav class="step-nav no-print" aria-label="Step navigation">
      <a class="btn text" href={prev}>
        <span aria-hidden="true">←</span> Back
      </a>
      <a class="btn primary" href={next} onClick={onNext}>
        {isLast ? "Finish" : "Next"} <span aria-hidden="true">→</span>
      </a>
    </nav>
  );
}
