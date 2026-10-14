/*
  Step 3: Picture it. The headline, then the detail.
  The headline is a moment — it becomes the hero of the document.
*/
import { useStore } from "../lib/use-store.js";
import CardDeck from "./CardDeck.jsx";
import StepSummary from "./StepSummary.jsx";
import FromStep from "./FromStep.jsx";

export default function Step3Cards({ prompts = [], titleHtml = "", intro = [], transition = "" }) {
  const [state, set] = useStore();
  const byName = (n) => prompts.find((p) => p.name.toLowerCase().includes(n)) || {};
  const headline = byName("headline");
  const detail = byName("detail");

  const cards = [
    {
      key: "scene", variant: "scene", eyebrow: "Step 3 of 7",
      title: "Picture it", titleHtml, nextLabel: "Begin",
      body: <>{intro.map((p, i) => <p class="lede" key={i}>{p}</p>)}</>,
    },
    {
      key: "headline", variant: "moment",
      title: headline.question, guidance: headline.hint,
      body: (
        <textarea
          class="moment-input moment-textarea"
          value={state.step3.headline}
          placeholder={headline.example}
          maxLength={300}
          rows={2}
          aria-label={headline.question}
          onInput={(e) => set((s) => { s.step3.headline = e.currentTarget.value; })}
        ></textarea>
      ),
    },
    {
      key: "detail", variant: "wide",
      title: detail.question, guidance: detail.hint,
      body: (
        <div class="prompt-with-aside">
          <textarea
            value={state.step3.detail}
            placeholder={detail.example}
            maxLength={2000}
            rows={5}
            aria-label={detail.question}
            onInput={(e) => set((s) => { s.step3.detail = e.currentTarget.value; })}
          ></textarea>
          <FromStep kind="lowestAreas" />
        </div>
      ),
    },
    {
      key: "summary", variant: "summary", title: "Added to your plan",
      body: <StepSummary step={3} transition={transition} showNext={false} />,
    },
  ];

  return (
    <CardDeck cards={cards} step={3} backTo="/step/2" onLeave="/step/4" leaveLabel="Next: Your compass" />
  );
}
