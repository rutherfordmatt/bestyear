import { useStore } from "../lib/use-store.js";
import { PHASES, STEPS, pathForStep, timeLeftLabel } from "../lib/steps.js";

/*
  Progress rail, grouped by phase, with rough time remaining.
  Completed steps are links; steps not yet reached are inert.
*/
export default function PhaseRail({ current }) {
  const [state] = useStore();
  const completed = new Set(state.progress.completed);
  const furthest = state.progress.furthestStep;
  const timeLeft = timeLeftLabel(state.progress.completed);

  return (
    <nav class="phase-rail no-print" aria-label="Your progress">
      <ol class="phases">
        {PHASES.map((phase) => (
          <li key={phase.id} class="phase">
            <span class="phase-name">{phase.name}</span>
            <ol class="phase-steps">
              {phase.steps.map((n) => {
                const step = STEPS.find((s) => s.n === n);
                const isCurrent = n === Number(current);
                const isDone = completed.has(n);
                const reachable = isDone || n <= furthest + 1 || isCurrent;
                const label = `Step ${n}, ${step.title}${isDone ? ", done" : ""}`;
                return (
                  <li key={n}>
                    {reachable && !isCurrent ? (
                      <a
                        href={pathForStep(n)}
                        class={`rail-step${isDone ? " done" : ""}`}
                        aria-label={label}
                      >
                        <span class="n">{n}</span>
                        <span class="t">{step.short}</span>
                      </a>
                    ) : (
                      <span
                        class={`rail-step${isCurrent ? " now" : ""}${isDone ? " done" : ""}${reachable ? "" : " locked"}`}
                        aria-current={isCurrent ? "step" : undefined}
                        aria-label={label}
                      >
                        <span class="n">{n}</span>
                        <span class="t">{step.short}</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
      {timeLeft && <p class="time-left" aria-live="polite">{timeLeft}</p>}
    </nav>
  );
}
