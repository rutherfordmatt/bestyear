import { useEffect, useRef, useState } from "preact/hooks";

/*
  Shows its children once `when` becomes true, animating only if that happens
  while the visitor is on the page.

  The "arming" matters: the store hydrates from localStorage in a mount effect,
  so on a return visit several prompts become visible in the same tick as the
  first paint. Without this, everything they had already answered would fade in
  at once, which looks like the page is loading badly. Arming on the next tick
  means the first paint is treated as the baseline, and only genuinely new
  arrivals animate.
*/
export default function Reveal({ when, children }) {
  const [armed, setArmed] = useState(false);
  const everShown = useRef(when);

  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 0);
    return () => clearTimeout(t);
  }, []);

  const isNew = armed && !everShown.current;
  if (when) everShown.current = true;

  if (!when) return null;

  return <div class={`reveal-wrap${isNew ? " reveal" : ""}`}>{children}</div>;
}
