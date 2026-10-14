/*
  Step 2 as a deck, divided as Matt described:
  pick and score, where you compromised, what you're leaving behind, and the
  line that closes the chapter.

  The last of those is a "moment" card. Some questions are not form fields,
  they are the point of the exercise — summing up, naming the thing. Those
  get room and weight rather than another box in a list.
*/
import { useStore } from "../lib/use-store.js";
import CardDeck from "./CardDeck.jsx";
import StepSummary from "./StepSummary.jsx";
import LettingGo from "./LettingGo.jsx";
import ValuesPanel from "./ValuesPanel.jsx";

export default function Step2Cards({
  card = {}, returnLine = "", prompts = {}, bucketLabels = [],
  titleHtml = "", intro = [], transition = "",
}) {
  const [state, set] = useStore();

  const cards = [
    {
      key: "scene",
      variant: "scene",
      eyebrow: "Step 2 of 7",
      title: "What matters, and what doesn't",
      titleHtml,
      nextLabel: "Begin",
      body: <>{intro.map((p, i) => <p class="lede" key={i}>{p}</p>)}</>,
    },
    {
      key: "values",
      variant: "wide",
      title: prompts.choose?.question,
      guidance: prompts.choose?.hint,
      body: <ValuesPanel card={card} returnLine={returnLine} prompts={prompts} headless />,
    },
    {
      key: "gap",
      title: prompts.gap?.question,
      guidance: prompts.gap?.hint,
      body: (
        <textarea
          value={state.step2.compromise}
          placeholder={prompts.gap?.example}
          maxLength={1500}
          rows={4}
          aria-label={prompts.gap?.question}
          onInput={(e) => set((s) => { s.step2.compromise = e.currentTarget.value; })}
        ></textarea>
      ),
    },
    {
      key: "letting",
      variant: "wide",
      title: prompts.letting?.question?.split("?")[0] + "?",
      guidance: prompts.letting?.hint,
      body: <LettingGo prompt={prompts.letting || {}} bucketLabels={bucketLabels} />,
    },
    {
      key: "closing",
      variant: "moment",
      title: prompts.closing?.question,
      guidance: prompts.closing?.hint,
      body: (
        <input
          type="text"
          class="moment-input"
          value={state.step2.closingLine}
          placeholder={prompts.closing?.example}
          maxLength={400}
          aria-label={prompts.closing?.question}
          onInput={(e) => set((s) => { s.step2.closingLine = e.currentTarget.value; })}
        />
      ),
    },
    {
      key: "summary",
      variant: "summary",
      title: "Added to your plan",
      body: <StepSummary step={2} transition={transition} showNext={false} />,
    },
  ];

  return (
    <CardDeck
      cards={cards}
      step={2}
      backTo="/step/1"
      onLeave="/step/3"
      leaveLabel="Next: Picture it"
    />
  );
}
