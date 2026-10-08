import { useEffect, useRef, useState } from "preact/hooks";

/*
  Progressive disclosure for a step's prompts.

  Pass one "has something in it" flag per prompt, in the order they appear.
  A prompt is visible once every prompt before it has content — the first is
  always visible, and "content" is deliberately loose, so one answer is enough
  to move on rather than a complete set.

  TIMING MATTERS MORE THAN THE RULE. Unlocking on the first keystroke makes the
  page lurch while someone is still mid-word, which reads as impatient. A
  prompt therefore unlocks only once its predecessor has been left alone:
  either the visitor has stopped typing for SETTLE_MS, or they have moved out
  of the field entirely. Finish the thought, then the next one arrives.

  Every step that uses this must also render <ShowAll>, so nobody is held at a
  prompt they have nothing to say to.
*/

const SETTLE_MS = 1100;

const isTextField = (el) =>
  el &&
  ((el.tagName === "INPUT" && !["checkbox", "radio", "range", "button", "submit"].includes(el.type)) ||
    el.tagName === "TEXTAREA");

/**
 * Returns `flags`, but each `false -> true` change is held back until the
 * visitor pauses or leaves the field. Changes back to false apply at once, so
 * clearing an answer never leaves a stale prompt showing.
 */
function useSettled(flags) {
  const [settled, setSettled] = useState(flags);
  const timers = useRef([]);
  const key = flags.join(",");

  useEffect(() => {
    setSettled((prev) => {
      // Anything that turned off, turns off immediately.
      const next = prev.map((was, i) => (flags[i] ? was : false));
      return next.length === prev.length && next.every((v, i) => v === prev[i]) ? prev : next;
    });

    const pending = [];
    flags.forEach((on, i) => {
      if (!on || settled[i]) return;

      const commit = () => setSettled((prev) => {
        if (prev[i]) return prev;
        const next = [...prev];
        next[i] = true;
        return next;
      });

      // Not typing at all (a slider, a chip, a button): no reason to wait.
      if (!isTextField(document.activeElement)) {
        const t = setTimeout(commit, 120);
        pending.push(() => clearTimeout(t));
        return;
      }

      const t = setTimeout(commit, SETTLE_MS);
      const onBlur = () => { clearTimeout(t); commit(); };
      document.activeElement.addEventListener("blur", onBlur, { once: true });
      pending.push(() => {
        clearTimeout(t);
        document.removeEventListener("blur", onBlur);
      });
    });

    timers.current = pending;
    return () => pending.forEach((cancel) => cancel());
  }, [key]);

  // Keep the array the same length as the flags it mirrors.
  return flags.map((_, i) => settled[i] ?? false);
}

export function useDisclosure(filled = []) {
  const [forceAll, setForceAll] = useState(false);
  const settled = useSettled(filled);

  const visible = [];
  let unlocked = true;
  for (const hasContent of settled) {
    visible.push(forceAll || unlocked);
    unlocked = unlocked && Boolean(hasContent);
  }

  return {
    visible,
    allShown: visible.every(Boolean),
    showAll: () => setForceAll(true),
  };
}
