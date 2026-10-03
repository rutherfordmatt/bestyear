/*
  Life wheel radar. Hand-rolled SVG, no chart library.

  Only areas the visitor has actually rated are plotted. An unrated area
  shows its spoke and label but no point, so a blank wheel never looks like
  a wheel of zeros.
*/
import { LIFE_AREAS } from "../lib/steps.js";

const MAX = 10;
const RINGS = [2, 4, 6, 8, 10];

function point(cx, cy, radius, index, count) {
  // Start at 12 o'clock and go clockwise.
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

export default function LifeWheelChart({ wheel = {}, size = 320, showLabels = true, id = "wheel" }) {
  // The ring fills `size`. Labels live OUTSIDE it, so the viewBox is widened
  // by a margin rather than the ring being shrunk — otherwise a long label
  // like "Relationships" is clipped at small sizes.
  const marginX = showLabels ? 74 : 4;
  const marginY = showLabels ? 26 : 4;
  const labelOffset = showLabels ? 18 : 0;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const areas = LIFE_AREAS;
  const n = areas.length;

  const vbWidth = size + marginX * 2;
  const vbHeight = size + marginY * 2;

  const rated = areas
    .map((a, i) => ({ ...a, i, score: wheel[a.key] }))
    .filter((a) => typeof a.score === "number");

  const ratedCount = rated.length;
  const hasShape = ratedCount >= 3;

  const polygon = hasShape
    ? rated
        .map((a) => point(cx, cy, (r * a.score) / MAX, a.i, n).map((v) => v.toFixed(1)).join(","))
        .join(" ")
    : "";

  const summary = ratedCount
    ? rated.map((a) => `${a.name} ${a.score} out of 10`).join(", ")
    : "No areas rated yet.";

  return (
    <figure class="wheel-figure">
      <svg
        viewBox={`${-marginX} ${-marginY} ${vbWidth} ${vbHeight}`}
        width={vbWidth}
        height={vbHeight}
        class="wheel"
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
      >
        <title id={`${id}-title`}>Your life wheel</title>
        <desc id={`${id}-desc`}>{summary}</desc>

        {/* rings */}
        {RINGS.map((ring) => (
          <polygon
            key={ring}
            class="wheel-ring"
            points={areas
              .map((_, i) => point(cx, cy, (r * ring) / MAX, i, n).map((v) => v.toFixed(1)).join(","))
              .join(" ")}
          />
        ))}

        {/* spokes */}
        {areas.map((a, i) => {
          const [x, y] = point(cx, cy, r, i, n);
          return <line key={a.key} class="wheel-spoke" x1={cx} y1={cy} x2={x.toFixed(1)} y2={y.toFixed(1)} />;
        })}

        {/* the shape */}
        {hasShape && <polygon class="wheel-shape" points={polygon} />}

        {/* points */}
        {rated.map((a) => {
          const [x, y] = point(cx, cy, (r * a.score) / MAX, a.i, n);
          return <circle key={a.key} class="wheel-point" cx={x.toFixed(1)} cy={y.toFixed(1)} r="3.5" />;
        })}

        {/* labels */}
        {showLabels &&
          areas.map((a, i) => {
            const [x, y] = point(cx, cy, r + labelOffset, i, n);
            const anchor = Math.abs(x - cx) < 6 ? "middle" : x > cx ? "start" : "end";
            const score = wheel[a.key];
            return (
              <text
                key={a.key}
                class={`wheel-label${typeof score === "number" ? "" : " unrated"}`}
                x={x.toFixed(1)}
                y={y.toFixed(1)}
                text-anchor={anchor}
                dominant-baseline="middle"
              >
                {a.name}
                {typeof score === "number" && <tspan class="wheel-score" dx="5">{score}</tspan>}
              </text>
            );
          })}
      </svg>
      {ratedCount > 0 && ratedCount < n && (
        <figcaption class="note">
          {ratedCount} of {n} areas rated so far.
        </figcaption>
      )}
    </figure>
  );
}
