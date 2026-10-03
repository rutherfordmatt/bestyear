import { useEffect, useRef, useState } from "preact/hooks";

/*
  Shows its children once `when` becomes true, animating and scrolling into
  view only if that happens while the visitor is on the page.

  Three things this has to get right:

  1. Arming. The store hydrates from localStorage in a mount effect, so on a
     return visit several prompts become visible in the same tick as the first
     paint. Arming on the next tick makes that first paint the baseline, so
     only genuinely new arrivals animate.

  2. Not cutting the animation short. The class has to be held for the length
     of the animation in state — deriving it during render would strip it on
     the very next keystroke, since typing re-renders the whole step.

  3. Not yanking the page while someone is typing. The reveal is usually
     triggered by the first character typed into the field above. Scrolling
     at that moment moves the page under their hands, so when a text field
     has focus we wait for it to be left before scrolling.
*/

const ANIMATION_MS = 400;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const isTextField = (el) =>
  el &&
  ((el.tagName === "INPUT" && !["checkbox", "radio", "range", "button"].includes(el.type)) ||
    el.tagName === "TEXTAREA");

export default function Reveal({ when, scroll = true, as: Tag = "div", class: extra = "", children }) {
  const ref = useRef(null);
  const hasShown = useRef(when);
  const [armed, setArmed] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!when) return;
    if (hasShown.current) return;
    hasShown.current = true;

    // Appeared before the page settled: treat it as part of the first paint.
    if (!armed) return;

    setAnimating(true);
    const done = setTimeout(() => setAnimating(false), ANIMATION_MS);
    if (!scroll) return () => clearTimeout(done);

    const bringIntoView = () => {
      const el = ref.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      // The fixed bar covers the bottom ~96px; leave a little room above it.
      const visibleBottom = window.innerHeight - 140;
      if (box.top < visibleBottom && box.bottom > 0) return; // already in view
      el.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "nearest",
      });
    };

    const active = document.activeElement;
    if (!isTextField(active)) {
      const t = setTimeout(bringIntoView, 60); // let the layout settle first
      return () => { clearTimeout(done); clearTimeout(t); };
    }

    // Mid-sentence: wait until they've left the field.
    active.addEventListener("blur", bringIntoView, { once: true });
    return () => {
      clearTimeout(done);
      active.removeEventListener("blur", bringIntoView);
    };
  }, [when, armed, scroll]);

  if (!when) return null;

  // `as` matters for list items: a <div> between <ol> and <li> is invalid.
  return (
    <Tag ref={ref} class={`reveal-wrap${animating ? " reveal" : ""}${extra ? ` ${extra}` : ""}`}>
      {children}
    </Tag>
  );
}
