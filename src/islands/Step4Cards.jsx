/*
  Step 4: Your compass. The word, then the three themes.
  The word is a moment — one word to carry the whole year.
*/
import { useStore } from "../lib/use-store.js";
import CardDeck from "./CardDeck.jsx";
import StepSummary from "./StepSummary.jsx";
import FromStep from "./FromStep.jsx";
import { emptyTheme } from "../lib/schema.js";

export default function Step4Cards({ prompts = [], titleHtml = "", intro = [], transition = "" }) {
  const [state, set] = useStore();
  const s = state.step4;
  const byName = (n) => prompts.find((p) => p.name.toLowerCase().includes(n)) || {};
  const wordPrompt = byName("your word");
  const themesPrompt = byName("themes");
  const filled = (v) => Boolean(v && String(v).trim());

  const shown = Math.min(3, Math.max(1, s.themes.findLastIndex((t) => filled(t.text)) + 2));
  const addTheme = () =>
    set((st) => { if (!st.step4.themes.some((t) => !filled(t.text))) st.step4.themes.push(emptyTheme()); });

  const cards = [
    {
      key: "scene", variant: "scene", eyebrow: "Step 4 of 7",
      title: "Your compass", titleHtml, nextLabel: "Begin",
      body: (
        <>
          {intro.map((p, i) => <p class="lede" key={i}>{p}</p>)}
          {filled(state.step3.headline) && (
            <aside class="from-step recall">
              <p class="from-step-head"><span class="label">From Step 3</span></p>
              <p class="recall-headline">{state.step3.headline}</p>
            </aside>
          )}
        </>
      ),
    },
    {
      key: "word", variant: "moment",
      title: wordPrompt.question, guidance: wordPrompt.hint,
      body: (
        <input
          type="text" class="moment-input"
          value={s.word} placeholder={wordPrompt.example} maxLength={60}
          autoComplete="off" aria-label={wordPrompt.question}
          onInput={(e) => set((st) => { st.step4.word = e.currentTarget.value; })}
        />
      ),
    },
    {
      key: "themes", variant: "wide",
      title: themesPrompt.question, guidance: themesPrompt.hint,
      body: (
        <div class="prompt-with-aside">
          <div>
            <ol class="theme-list">
              {s.themes.slice(0, shown).map((theme, i) => (
                <li key={theme.id} class="theme-row">
                  <span class="theme-n" aria-hidden="true">{i + 1}</span>
                  <input
                    type="text" value={theme.text}
                    placeholder={i === 0 ? String(themesPrompt.example || "").split(" / ")[0] : ""}
                    maxLength={200} aria-label={`Theme ${i + 1}`}
                    onInput={(e) => {
                      const v = e.currentTarget.value;
                      set((st) => { st.step4.themes[i].text = v; });
                    }}
                  />
                </li>
              ))}
            </ol>
            {shown < 3 && (
              <button type="button" class="btn small text add-another" onClick={addTheme}>
                + Add another theme
              </button>
            )}
          </div>
          <FromStep kind="valueGaps" />
        </div>
      ),
    },
    {
      key: "summary", variant: "summary", title: "Added to your plan",
      body: <StepSummary step={4} transition={transition} showNext={false} />,
    },
  ];

  return <CardDeck cards={cards} step={4} backTo="/step/3" onLeave="/step/5" leaveLabel="Next: Goals" />;
}
