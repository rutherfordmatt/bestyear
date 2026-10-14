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
  const [wantLast, setWantLast] = useState(false);
  const deckRef = useRef(null);
  const trackRef = useRef(null);
  const liveRef = useRef(null);
  const viewportRef = useRef(null);
  const [height, setHeight] = useState(null);
  const [floor, setFloor] = useState(null);

  const last = cards.length - 1;
  const atEnd = index >= last;
  const atStart = index === 0;

  const go = (next) => {
    const clamped = Math.max(0, Math.min(last, next));
    if (clamped === index) return;
    setIndex(clamped);
  };

  /*
    Back from the first card of a step leaves to the step before it — and
    landing at the top of that step means Back jumped backwards through five
    cards at once. "#last" says: open on the card they were actually on.

    A hash, not a query: fragments never reach the server or analytics, and
    this one is stripped the moment it is read. The card count can still
    grow after mount (a hand-over card appears once there is an answer), so
    the intent is held until the deck is its full size.
  */
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#last") return;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setWantLast(true);
  }, []);

  useEffect(() => {
    if (!wantLast || !cards.length) return;
    setIndex(cards.length - 1);
    setWantLast(false);
  }, [wantLast, cards.length]);

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

  /*
    The way on is anchored to the bottom of the screen, just above the footer,
    so it is in the same place on every card. Otherwise it rides up and down
    with the card's height and the thing you are reaching for moves between
    one question and the next.

    Measured rather than guessed: the deck's own top, the window, and the
    footer's real height. A card taller than the space still grows and pushes
    the nav below the fold, which is correct — then the page scrolls.
  */
  useEffect(() => {
    const footer = document.querySelector("footer.site");
    const measure = () => {
      const deck = deckRef.current;
      if (!deck || !footer) return;
      const d = deck.getBoundingClientRect();
      const f = footer.getBoundingClientRect();
      // The gap between the deck and the footer — the page's bottom padding
      // and the footer's margin — does not change with the deck's height, so
      // measuring it here stays true after the floor is applied.
      const gap = f.top - d.bottom;
      setFloor(Math.max(0, window.innerHeight - d.top - gap - f.height));
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = footer ? new ResizeObserver(measure) : null;
    if (footer) ro.observe(footer);
    return () => {
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, []);

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
    <div
      class="deck"
      ref={deckRef}
      onKeyDown={onKeyDown}
      style={floor ? { minHeight: `${Math.round(floor)}px` } : undefined}
    >
      <p class="visually-hidden" role="status" aria-live="polite" ref={liveRef}></p>

      <div
        class="deck-viewport"
        ref={viewportRef}
        onScroll={(e) => { e.currentTarget.scrollLeft = 0; }}
        style={height ? { height: `${Math.round(height)}px` } : undefined}
      >
        {/*
          The track stays one viewport wide and the cards overflow it, so a
          card's width — and the slide distance — is 100% whatever the deck
          holds. Sizing the track to the cards instead made the transform a
          fraction of a changing width: adding a card mid-deck (the hand-over
          appears as soon as you type) changed the fraction and the width in
          the same frame, and the deck slid away and back while you typed.
        */}
        <div
          class="deck-track"
          ref={trackRef}
          style={{ transform: `translateX(-${index * 100}%)` }}
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
                    {card.eyebrow && <p class="label">{card.eyebrow}</p>}
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
          <a class="btn text" href={backTo.startsWith("/step/") ? `${backTo}#last` : backTo}>
            {backLabel}
          </a>
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
