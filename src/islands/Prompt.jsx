/*
  One prompt: question, optional "From Step N" card, the input itself, and a
  collapsed "Stuck?" hint. Copy comes from content/step-N.md.
*/
import FromStep from "./FromStep.jsx";

/* `helper` is an optional one-line note under the question. The follow-up
   question is NOT shown here — it belongs in the field it asks about. */
export default function Prompt({ prompt = {}, from = null, onPick = null, helper = null, children }) {
  if (!prompt.question) return <div class="prompt">{children}</div>;
  const aside = from ? <FromStep kind={from} onPick={onPick} /> : null;

  return (
    <section class="prompt">
      <div class="prompt-head">
        <h2 class="prompt-question">{prompt.question}</h2>
        {helper && <p class="note">{helper}</p>}
      </div>
      <div class={aside ? "prompt-with-aside" : ""}>
        <div class="prompt-body">
          {children}
          {prompt.hint && (
            <details class="stuck">
              <summary>Stuck?</summary>
              <p>{prompt.hint}</p>
            </details>
          )}
        </div>
        {aside}
      </div>
    </section>
  );
}
