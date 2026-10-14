import { useEffect, useRef, useState } from "preact/hooks";

/*
  One question per screen, moving sideways.

  The thing this buys is not the animation — it is that a card can only ever
  hold one question, so the clutter we keep chasing cannot accumulate. It also
  retires progressive disclosure: there is no need to hide the next question
  when it is not on screen anyway, which takes the settle timing, the reveal
  animation and "Show all questions" out of the design altogether.

  Cards that are not showing are `inert`, so they are skipped by tab and by
  screen readers rather than being invisible but still reachable.

  A card has a variant. "scene" is the coach setting up the step — the title
  and the framing — so the step header does not have to sit permanently above
  every question competing with it. "summary" closes the step. Everything
  between is one question each.
*/
export default function CardDeck({ cards = [], onLeave = null, leaveLabel = "Next" }) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef(null);
  const liveRef = useRef(null);
  const viewportRef = useRef(null);
  const [height, setHeight] = useState(null);

  const last = cards.length - 1;
  const atEnd = index >= last;

  const go = (next) => {
    const clamped = Math.max(0, Math.min(last, next));
    if (clamped === index) return;
    setIndex(clamped);
  };

  // Announce the move for anyone not watching it happen.
  useEffect(() => {
    if (liveRef.current) {
      liveRef.current.textContent = `${cards[index]?.title || "Question"}, ${index + 1} of ${cards.length}`;
    }
    // Put focus at the top of the new card, but never steal it mid-typing.
    const active = document.activeElement;
    const typing = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
    if (!typing) {
      const card = trackRef.current?.children[index];
      card?.querySelector("[data-card-focus]")?.focus?.();
    }
  }, [index]);

  /*
    Every card is in the DOM, so without this the viewport is as tall as the
    tallest one and a short card floats in a lot of empty space. Track the
    card you are actually on, and follow it when its own content grows.
  */
  // `inert` as a JSX attribute did not reliably clear when a card became
  // current, which left it present but invisible. Set the property directly.
  useEffect(() => {
    const children = trackRef.current?.children;
    if (!children) return;
    for (let i = 0; i < children.length; i += 1) children[i].inert = i !== index;
  }, [index, cards.length]);

  useEffect(() => {
    const card = trackRef.current?.children[index];
    if (!card) return;
    const measure = () => setHeight(card.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(card);
    return () => ro.disconnect();
  }, [index, cards.length]);

  const onKeyDown = (e) => {
    if (e.target.closest("input, textarea, select")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
  };

  return (
    <div class="deck" onKeyDown={onKeyDown}>
      <p class="visually-hidden" role="status" aria-live="polite" ref={liveRef}></p>

      <div
        class="deck-viewport"
        ref={viewportRef}
        style={height ? { height: `${Math.round(height)}px` } : undefined}
      >
        <div
          class="deck-track"
          ref={trackRef}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {cards.map((card, i) => (
            <section
              key={card.key || i}
              class="deck-card"
              aria-label={card.title}
            >
              <div class={`deck-card-inner${card.variant ? ` is-${card.variant}` : ""}`}>
                {card.variant === "scene" ? (
                  <>
                    {card.eyebrow && <p class="label">{card.eyebrow}</p>}
                    <h2 class="scene-title" tabIndex={-1} data-card-focus
                        dangerouslySetInnerHTML={{ __html: card.titleHtml || card.title }} />
                    <div class="deck-card-body scene-body">{card.body}</div>
                  </>
                ) : (
                  <>
                    <h2 class="prompt-question" tabIndex={-1} data-card-focus>{card.title}</h2>
                    {card.guidance && <p class="tip">{card.guidance}</p>}
                    <div class="deck-card-body">{card.body}</div>
                  </>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div class="deck-nav">
        <button
          type="button"
          class="btn text"
          onClick={() => go(index - 1)}
          disabled={index === 0}
        >
          Back
        </button>

        <ol class="deck-dots" aria-label={`Question ${index + 1} of ${cards.length}`}>
          {cards.map((card, i) => (
            <li key={card.key || i}>
              <button
                type="button"
                class={`deck-dot${i === index ? " is-here" : ""}${i < index ? " is-done" : ""}`}
                aria-current={i === index ? "step" : undefined}
                aria-label={`${card.title}, ${i + 1} of ${cards.length}`}
                onClick={() => go(i)}
              />
            </li>
          ))}
        </ol>

        {atEnd && onLeave ? (
          <a class="btn primary" href={onLeave}>{leaveLabel} <span aria-hidden="true">→</span></a>
        ) : (
          <button type="button" class="btn primary" onClick={() => go(index + 1)} disabled={atEnd}>
            {cards[index]?.nextLabel || "Next"} <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
