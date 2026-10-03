import { useStore } from "../lib/use-store.js";
import { stepHasContent } from "../lib/carry-forward.js";

/*
  The optional, gentler note some steps carry — Step 1's "some years are
  heavier than others". The copy says it belongs at the end of the step, so it
  waits until there is something in the step to have been heavy.
*/
export default function SoftNote({ step, paragraphs = [] }) {
  const [state] = useStore();
  if (!paragraphs.length || !stepHasContent(state, step)) return null;

  return (
    <aside class="callout soft-note reveal-wrap">
      {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
    </aside>
  );
}
