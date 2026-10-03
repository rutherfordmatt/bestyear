import { useEffect, useState } from "preact/hooks";
import { load, hasProgress, clearAll, get, update } from "../lib/storage.js";
import { pathForStep, STEPS } from "../lib/steps.js";
import { consumeIncomingValues, MAX_VALUES } from "../lib/values-link.js";
import { track, EVENTS } from "../lib/analytics.js";

/*
  Shown on the landing page only when there is something to resume.
  Also the first place incoming Values Finder values are caught, since the
  hand-off link points at the site root.
*/
export default function ResumeBanner() {
  const [state, setState] = useState(null);
  const [imported, setImported] = useState(0);

  useEffect(() => {
    load();

    // Values can arrive at the root: yearwellbuilt.com/#values=integrity,family
    consumeIncomingValues().then((incoming) => {
      if (!incoming.length) {
        if (hasProgress()) setState(get());
        return;
      }
      update((s) => {
        const existing = new Set(s.step2.values.map((v) => v.slug));
        for (const v of incoming) {
          if (existing.has(v.slug) || s.step2.values.length >= MAX_VALUES) continue;
          s.step2.values.push({ slug: v.slug, name: v.name, source: v.source, alignment: null });
        }
      }, { immediate: true });
      setImported(incoming.length);
      track(EVENTS.valuesImported);
    });
  }, []);

  if (imported) {
    return (
      <div class="resume callout" role="status">
        <p>
          <strong>{imported} {imported === 1 ? "value" : "values"} saved from the Values Finder.</strong>{" "}
          They're waiting for you in Step 2.
        </p>
        <a class="btn small primary" href="/step/2">Go to Step 2</a>
      </div>
    );
  }

  if (!state) return null;

  const furthest = state.progress.furthestStep || 0;
  const next = Math.min(furthest + 1, STEPS.length);
  const target = furthest >= STEPS.length ? pathForStep(STEPS.length) : pathForStep(next);

  return (
    <div class="resume callout" role="status">
      <p>Welcome back. Your answers are saved on this device. Pick up where you left off?</p>
      <div class="resume-actions">
        <a class="btn small primary" href={target}>Carry on</a>
        <button
          type="button"
          class="btn small text"
          onClick={() => {
            if (confirm("Start fresh? This deletes every answer saved on this device. It can't be undone.")) {
              clearAll();
              track(EVENTS.answersCleared);
              setState(null);
            }
          }}
        >
          Start fresh
        </button>
      </div>
    </div>
  );
}
