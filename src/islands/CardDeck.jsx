import { useEffect, useRef, useState } from "preact/hooks";
import { markStepComplete } from "../lib/storage.js";
import { track, EVENTS } from "../lib/analytics.js";

/*
  One question per screen, moving sideways.

  The thing this buys is not the animation. A card can hold exactly one
  question, so the clutter we kept chasing cannot accumulate — and it retires
  progressive disclosure, because there is no need to hide a question that is
  off screen anyway.

  The deck owns navigation. There is no separate bottom bar: Back at the first
  card leaves to the previous step, Next at the last card leaves to the next
  one, and everything between moves within the deck.

  Every card carries a reference like "2.4" — step 2, card 4 — so a change can
  be asked for by pointing at one.

  Cards that are not showing are inert, so tab and screen readers skip them.
*/
export default function CardDeck({
  cards = [],
  step = null,
  backTo = null,
  backLabel = "Back",
  onLeave = null,
  leaveLabel = "Next",
}) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef(null);
  const liveRef = useRef(null);
  const viewportRef = useRef(null);
  const [height, setHeight] = useState(null);

  const last = cards.length - 1;
  const atEnd = index >= last;
  const atStart = index === 0;

  const go = (next) => {
    const clamped = Math.max(0, Math.min(last, next));
    if (clamped === index) return;
    setIndex(clamped);
  };

  // inert as a JSX attribute did not reliably clear when a card became
  // current, which left it present but unreachable. Set the property.
  useEffect(() => {
    const children = trackRef.current?.children;
    if (!children) return;
    for (let i = 0; i < children.length; i += 1) children[i].inert = i !== index;
  }, [index, cards.length]);

  useEffect(() => {
    if (liveRef.current) {
      liveRef.current.textContent = `${cards[index]?.title || "Card"}, ${index + 1} of ${cards.length}`;
    }
    const active = document.activeElement;
    const typing = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
    if (!typing) {
      /*
        preventScroll matters more than it looks. Focusing an element inside
        an overflow:hidden box makes the browser scroll that box to reveal
        it — and a hidden overflow still scrolls programmatically. The track
        would slide one card by transform and the viewport would scroll
        another, landing two cards on from where you asked to go.
      */
      trackRef.current?.children[index]
        ?.querySelector("[data-card-focus]")
        ?.focus?.({ preventScroll: true });
    }
    // Belt and braces: nothing should ever scroll the viewport sideways.
    if (viewportRef.current) viewportRef.current.scrollLeft = 0;
  }, [index]);

  /*
    Every card is in the DOM, so without this the frame is as tall as the
    tallest one. Follow the card you are on, and follow it as it grows.
  */
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

  const onLeaveForward = () => {
    // Setup is step 0: it has cards and a reference, but it is not a step to
    // mark complete.
    if (!step) return;
    markStepComplete(step);
    track(EVENTS.stepReached(step + 1));
  };

  const hasStep = step !== null && step !== undefined;
  const cardRef = (i) => (hasStep ? `${step}.${i + 1}` : `${i + 1}`);

  return (
    <div class="deck" onKeyDown={onKeyDown}>
      <p class="visually-hidden" role="status" aria-live="polite" ref={liveRef}></p>

      <div
        class="deck-viewport"
        ref={viewportRef}
        onScroll={(e) => { e.currentTarget.scrollLeft = 0; }}
        style={height ? { height: `${Math.round(height)}px` } : undefined}
      >
        {/* The track is as wide as all the cards together and each card is a
            fraction of it, rather than cards overflowing a viewport-width
            track. Same result, but the slide distance is derived from the
            track rather than depending on overflow behaviour. */}
        <div
          class="deck-track"
          ref={trackRef}
          style={{
            width: `${cards.length * 100}%`,
            transform: `translateX(-${(index * 100) / cards.length}%)`,
          }}
        >
          {cards.map((card, i) => (
            <section key={card.key || i} class="deck-card" aria-label={card.title}>
              <div class={`deck-card-inner${card.variant ? ` is-${card.variant}` : ""}`}>
                <p class="card-ref" aria-hidden="true">{cardRef(i)}</p>

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
        {atStart && backTo ? (
          <a class="btn text" href={backTo}>{backLabel}</a>
        ) : (
          <button type="button" class="btn text" onClick={() => go(index - 1)} disabled={atStart}>
            Back
          </button>
        )}

        <ol class="deck-dots" aria-label={`Card ${index + 1} of ${cards.length}`}>
          {cards.map((card, i) => (
            <li key={card.key || i}>
              <button
                type="button"
                class={`deck-dot${i === index ? " is-here" : ""}${i < index ? " is-done" : ""}`}
                aria-current={i === index ? "step" : undefined}
                aria-label={`${card.title}, card ${cardRef(i)}`}
                onClick={() => go(i)}
              />
            </li>
          ))}
        </ol>

        {atEnd && onLeave ? (
          <a class="btn primary" href={onLeave} onClick={onLeaveForward}>
            {leaveLabel} <span aria-hidden="true">→</span>
          </a>
        ) : (
          <button type="button" class="btn primary" onClick={() => go(index + 1)} disabled={atEnd}>
            {cards[index]?.nextLabel || "Next"} <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
