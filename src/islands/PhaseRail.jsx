import { useStore } from "../lib/use-store.js";
import { PHASES, STEPS, pathForStep } from "../lib/steps.js";

/*
  The single progress element: a pipeline across the top, grouped by phase.

  Completed steps carry a tick and are links back. The current step is marked.
  Steps not yet reached are inert. There is deliberately no replay of the
  document here — the plan is revealed once, on Step 7. Time remaining lives
  in the bottom bar, so this stays a clean pipeline.
*/
export default function PhaseRail({ current }) {
  const [state] = useStore();
  const completed = new Set(state.progress.completed);
  const furthest = state.progress.furthestStep;
  const now = Number(current);

  return (
    <nav class="phase-rail no-print" aria-label="Your progress">
      <ol class="phases">
        {PHASES.map((phase) => {
          const allDone = phase.steps.every((n) => completed.has(n));
          const isHere = phase.steps.includes(now);
          return (
            <li
              key={phase.id}
              class={`phase${allDone ? " done" : ""}${isHere ? " here" : ""}`}
            >
              <span class="phase-name">{phase.name}</span>
              <ol class="phase-steps">
                {phase.steps.map((n) => {
                  const step = STEPS.find((s) => s.n === n);
                  const isCurrent = n === now;
                  const isDone = completed.has(n);
                  const reachable = isDone || n <= furthest + 1 || isCurrent;
                  const state =
                    isCurrent ? "current" : isDone ? "done" : reachable ? "open" : "locked";
                  const label =
                    `Step ${n}, ${step.title}` +
                    (isCurrent ? ", you are here" : isDone ? ", done" : "");

                  const inner = (
                    <>
                      <span class="rail-mark" aria-hidden="true">
                        {isDone && !isCurrent ? "✓" : n}
                      </span>
                      <span class="rail-name">{step.short}</span>
                    </>
                  );

                  return (
                    <li key={n} class={`rail-item is-${state}`}>
                      {reachable && !isCurrent ? (
                        <a href={pathForStep(n)} class="rail-step" aria-label={label}>
                          {inner}
                        </a>
                      ) : (
                        <span
                          class="rail-step"
                          aria-current={isCurrent ? "step" : undefined}
                          aria-label={label}
                        >
                          {inner}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
