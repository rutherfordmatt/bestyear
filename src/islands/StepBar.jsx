import { markStepComplete } from "../lib/storage.js";
import { useStore } from "../lib/use-store.js";
import { stepHasContent } from "../lib/carry-forward.js";
import { STEPS, PHASES, pathForStep, timeLeftLabel, phaseOf, stepByNumber } from "../lib/steps.js";
import { track, EVENTS } from "../lib/analytics.js";

/*
  The fixed bottom bar: where you are on the left, how to move on the right.

  Only ever ONE way forward on screen. Once the step has something in it the
  "Added to your plan" panel carries the primary Next, so the bar steps back
  to a quiet "Skip ahead" — still there for anyone who wants past a step they
  have nothing to say to, but no longer a second competing button.

  Next marks the step complete and saves immediately: a fast navigation must
  never lose the step.
*/
export default function StepBar({ step }) {
  const [state] = useStore();
  const n = Number(step);

  const isSetup = n === 0;
  const meta = isSetup ? null : stepByNumber(n);
  const phase = isSetup ? null : phaseOf(n);
  const isLast = !isSetup && n >= STEPS.length;

  const prev = isSetup ? "/" : n > 1 ? pathForStep(n - 1) : "/setup";
  const next = isSetup ? pathForStep(1) : isLast ? "/close" : pathForStep(n + 1);
  const nextStep = isSetup ? STEPS[0] : isLast ? null : stepByNumber(n + 1);

  const timeLeft = timeLeftLabel(state.progress.completed);
  // The summary panel owns the primary Next once there is anything to summarise.
  const summaryHasIt = !isSetup && stepHasContent(state, n);

  const status = isSetup
    ? { title: "Setup", detail: "Two quick choices, then Step 1" }
    : {
        title: `Step ${n} of ${STEPS.length}`,
        detail: [phase?.name, timeLeft].filter(Boolean).join(" · "),
      };

  const nextLabel = isSetup
    ? `Next: ${STEPS[0].title}`
    : isLast
      ? "Finish"
      : `Next: ${nextStep.title}`;

  const onNext = () => {
    if (isSetup) return;
    markStepComplete(n);
    if (!isLast) track(EVENTS.stepReached(n + 1));
  };

  return (
    <div class="bar no-print">
      <div class="in">
        <div class="status">
          <b>{status.title}</b>
          {status.detail && <span>{status.detail}</span>}
        </div>
        <div class="row">
          <a class="btn text" href={prev}>Back</a>
          {summaryHasIt ? (
            <a class="btn text" href={next} onClick={onNext}>Skip ahead</a>
          ) : (
            <a class="btn primary" href={next} onClick={onNext}>{nextLabel}</a>
          )}
        </div>
      </div>
    </div>
  );
}
