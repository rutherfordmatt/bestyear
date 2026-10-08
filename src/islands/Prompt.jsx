/*
  One prompt: the question, the guidance that helps you answer it, the input,
  and an optional "From Step N" card alongside.

  The hint sits UNDER THE QUESTION, not under the field. Below the input it
  came after a divider and read as a footnote — guidance you only find once
  you've already answered. Copy comes from content/step-N.md.
*/
import FromStep from "./FromStep.jsx";

export default function Prompt({ prompt = {}, from = null, onPick = null, helper = null, children }) {
  if (!prompt.question) return <div class="prompt">{children}</div>;
  const aside = from ? <FromStep kind={from} onPick={onPick} /> : null;

  return (
    <section class="prompt">
      <div class="prompt-head">
        <h2 class="prompt-question">{prompt.question}</h2>
        {helper && <p class="note">{helper}</p>}
        {prompt.hint && <p class="tip">{prompt.hint}</p>}
      </div>
      <div class={aside ? "prompt-with-aside" : ""}>
        <div class="prompt-body">{children}</div>
        {aside}
      </div>
    </section>
  );
}
