import { useStore } from "../lib/use-store.js";
import * as cf from "../lib/carry-forward.js";
import { pathForStep } from "../lib/steps.js";

/*
  "From Step N" cards: answers from earlier steps, surfaced beside the prompt
  that needs them, so nothing has to be retyped or remembered.

  Each `kind` is one row of the carry-forward map in docs/plan.md.
*/
const SOURCES = {
  challenges: {
    from: 1, title: "Your challenges",
    note: "The hardest moments usually carry the clearest lessons.",
    items: (s) => cf.challenges(s).map((c) => ({ id: c.id, text: c.text, sub: c.lesson })),
  },
  drainers: {
    from: 1, title: "What drained your energy",
    note: "A good place to start your letting-go list.",
    items: (s) => cf.energyDrainers(s).map((t, i) => ({ id: `d${i}`, text: t })),
  },
  lowestAreas: {
    from: 1, title: "Your lowest-scoring areas",
    note: "What would a 7 or 8 look like here?",
    items: (s) => cf.lowestAreas(s, 3).map((a) => ({ id: a.key, text: a.name, sub: `${a.score} out of 10` })),
  },
  valueGaps: {
    from: 2, title: "Your biggest value gaps",
    note: "A theme often lives in that gap.",
    items: (s) => cf.valueGaps(s).map((v) => ({ id: v.slug, text: v.name, sub: `Lived it ${v.alignment} out of 5` })),
  },
  values: {
    from: 2, title: "Your values",
    items: (s) => cf.chosenValues(s).map((v) => ({ id: v.slug, text: v.name, sub: v.meaning })),
  },
  themes: {
    from: 4, title: "Your three themes",
    items: (s) => cf.themes(s).map((t) => ({ id: t.id, text: t.text })),
  },
  goals: {
    from: 5, title: "Your goals",
    items: (s) => cf.goals(s).map((g) => ({ id: g.id, text: g.done })),
  },
};

export default function FromStep({ kind, onPick = null }) {
  const [state] = useStore();
  const source = SOURCES[kind];
  if (!source) return null;

  const items = source.items(state);
  if (!items.length) return null;

  return (
    <aside class="from-step" aria-label={`${source.title}, from step ${source.from}`}>
      <p class="from-step-head">
        <span class="label">From Step {source.from}</span>
        <a href={pathForStep(source.from)} class="from-step-edit">Edit</a>
      </p>
      <h4>{source.title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {onPick ? (
              <button type="button" class="from-step-pick" onClick={() => onPick(item)}>
                <span>{item.text}</span>
                {item.sub && <em>{item.sub}</em>}
                <span class="plus" aria-hidden="true">+</span>
                <span class="visually-hidden">Add to this step</span>
              </button>
            ) : (
              <>
                <span>{item.text}</span>
                {item.sub && <em>{item.sub}</em>}
              </>
            )}
          </li>
        ))}
      </ul>
      {source.note && <p class="from-step-note">{source.note}</p>}
    </aside>
  );
}
