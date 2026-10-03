import { useEffect, useState } from "preact/hooks";
import { load, hasProgress, clearAll, get, update } from "../lib/storage.js";
import { pathForStep, STEPS } from "../lib/steps.js";
import { consumeIncomingValues, MAX_VALUES } from "../lib/values-link.js";
import { track, EVENTS } from "../lib/analytics.js";

/*
  The action row on the landing page.

  There is deliberately no "welcome back" banner at the top: a returning
  visitor is offered the choice where their eye already is, in the button row,
  the same way thevaluesfinder.com does it.

  Three states:
  - first visit          → "Start building"
  - saved answers        → "Continue where you left off" + "Start again"
  - values just arrived  → "Continue to Step 2", with a line saying so

  This is also where values handed over from the Values Finder are caught,
  since that link points at the site root.
*/
export default function StartActions({
  startLabel = "Start building",
  continueLabel = "Continue where you left off",
  restartLabel = "Start again",
  valuesLine = "Your values are saved. Pick up at Step 2.",
  timeLine = "",
  privacyLine = "",
}) {
  const [resumeTo, setResumeTo] = useState(null);
  const [imported, setImported] = useState(0);

  useEffect(() => {
    load();

    consumeIncomingValues().then((incoming) => {
      if (incoming.length) {
        update((s) => {
          const existing = new Set(s.step2.values.map((v) => v.slug));
          for (const v of incoming) {
            if (existing.has(v.slug) || s.step2.values.length >= MAX_VALUES) continue;
            s.step2.values.push({ slug: v.slug, name: v.name, source: v.source, alignment: null });
          }
        }, { immediate: true });
        setImported(incoming.length);
        track(EVENTS.valuesImported);
        return;
      }

      if (!hasProgress()) return;
      const furthest = get().progress.furthestStep || 0;
      const next = Math.min(furthest + 1, STEPS.length);
      setResumeTo(furthest >= STEPS.length ? pathForStep(STEPS.length) : pathForStep(next));
    });
  }, []);

  const onRestart = () => {
    const ok = confirm(
      "Start again?\n\nThis deletes every answer saved on this device. It can't be undone."
    );
    if (!ok) return;
    clearAll();
    track(EVENTS.answersCleared);
    setResumeTo(null);
    setImported(0);
  };

  return (
    <div class="start-actions">
      <div class="row">
        {imported > 0 ? (
          <a class="btn primary" href="/step/2">Continue to Step 2</a>
        ) : resumeTo ? (
          <>
            <a class="btn primary" href={resumeTo}>{continueLabel}</a>
            <button type="button" class="btn text" onClick={onRestart}>{restartLabel}</button>
          </>
        ) : (
          <a class="btn primary" href="/setup" data-umami-event="setup-started">{startLabel}</a>
        )}
      </div>

      {imported > 0 && (
        <p class="note is-confirm" role="status">{valuesLine}</p>
      )}

      {timeLine && !resumeTo && imported === 0 && <p class="note">{timeLine}</p>}
      {privacyLine && <p class="note">{privacyLine}</p>}
    </div>
  );
}
