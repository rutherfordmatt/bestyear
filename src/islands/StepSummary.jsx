/*
  The "Added to your plan" moment at the end of each step: names exactly what
  just landed on the vision document, then hands over with the step's
  transition line.
*/
import { useStore } from "../lib/use-store.js";
import { addedInStep } from "../lib/carry-forward.js";

export default function StepSummary({ step, transition }) {
  const [state] = useStore();
  const added = addedInStep(state, step);

  if (!added.length) {
    return transition ? <p class="step-transition">{transition}</p> : null;
  }

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
    </div>
  );
}
