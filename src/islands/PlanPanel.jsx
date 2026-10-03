/*
  "Your plan so far" — the vision document filling in as steps complete.

  Desktop (>=1100px): a sticky column beside the step.
  Mobile: a sticky tab, "Your plan · 3 of 7", opening a bottom sheet.

  Same VisionDocument component as Step 7, in compact mode, so the preview
  can never disagree with the finished page.
*/
import { useEffect, useRef, useState } from "preact/hooks";
import { useStore } from "../lib/use-store.js";
import VisionDocument from "./VisionDocument.jsx";
import * as cf from "../lib/carry-forward.js";
import { TOTAL_STEPS } from "../lib/steps.js";

export default function PlanPanel({ current }) {
  const [state] = useStore();
  const [open, setOpen] = useState(false);
  const sheetRef = useRef(null);
  const tabRef = useRef(null);

  const filled = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1)
    .filter((n) => cf.stepHasContent(state, n)).length;

  // Esc closes the sheet; focus goes back to the tab that opened it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); tabRef.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Keep focus inside the sheet while it's open.
  const onKeyDown = (e) => {
    if (e.key !== "Tab" || !sheetRef.current) return;
    const focusable = sheetRef.current.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const summary = `Your plan · ${filled} of ${TOTAL_STEPS}`;

  return (
    <>
      {/* Desktop: sticky column */}
      <aside class="plan-panel no-print" aria-labelledby="plan-panel-title">
        <div class="plan-panel-head">
          <h2 id="plan-panel-title">Your plan so far</h2>
          <span class="plan-count">{filled} of {TOTAL_STEPS}</span>
        </div>
        <div class="plan-panel-body">
          <VisionDocument state={state} compact />
        </div>
      </aside>

      {/* Mobile: sticky tab + bottom sheet */}
      <button
        ref={tabRef}
        type="button"
        class="plan-tab no-print"
        aria-expanded={open}
        aria-controls="plan-sheet"
        onClick={() => setOpen(true)}
      >
        <span>{summary}</span>
        <span class="plan-tab-chev" aria-hidden="true">▲</span>
      </button>

      {open && (
        <div class="plan-sheet-backdrop no-print" onClick={() => setOpen(false)}>
          <div
            id="plan-sheet"
            ref={sheetRef}
            class="plan-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-sheet-title"
            tabIndex={-1}
            onKeyDown={onKeyDown}
            onClick={(e) => e.stopPropagation()}
          >
            <div class="plan-sheet-head">
              <span class="plan-sheet-grip" aria-hidden="true"></span>
              <h2 id="plan-sheet-title">Your plan so far</h2>
              <button type="button" class="btn small text" onClick={() => { setOpen(false); tabRef.current?.focus(); }}>
                Close
              </button>
            </div>
            <div class="plan-sheet-body">
              <VisionDocument state={state} compact />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
