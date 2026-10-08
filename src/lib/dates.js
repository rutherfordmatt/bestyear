/*
  Dates are always derived from "today". No year is ever hard-coded —
  see CLAUDE.md, Evergreen.
*/

const LOCALE = "en-IE";

/*
  Goal targets are months, not days. This is annual visioning: "by the end of
  June" is a commitment someone can feel, and 23 June is false precision that
  invites fiddling with a date picker instead of thinking about the goal.
  Stored as "YYYY-MM".
*/

/** "End of June" / "End of June 2027" if it isn't the coming twelve months. */
export function formatDate(value, from = new Date()) {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})$/.exec(String(value));
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
    const sameYear = d.getFullYear() === from.getFullYear();
    return `End of ${d.toLocaleDateString(LOCALE, { month: "long", ...(sameYear ? {} : { year: "numeric" }) })}`;
  }
  // Tolerate full dates from saves made before months replaced them.
  const d = parseISO(value);
  if (!d) return String(value);
  return `End of ${d.toLocaleDateString(LOCALE, { month: "long" })}`;
}

/** The next twelve months, as { value: "YYYY-MM", label: "End of June" }. */
export function monthOptions(from = new Date(), count = 12) {
  const out = [];
  for (let i = 1; i <= count; i += 1) {
    const d = addMonths(from, i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ value, label: formatDate(value, from) });
  }
  return out;
}

/** "Monday 6 January" — used for check-in dates. */
export function formatLongDate(value) {
  const d = parseISO(value);
  if (!d) return String(value || "");
  return d.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" });
}

export function parseISO(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toISO(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // Clamp 31 Jan + 1 month to end of February rather than rolling into March.
  if (d.getDate() < day) d.setDate(0);
  return d;
}

/** Four quarterly check-ins, counted from today. Evergreen by construction. */
export function suggestedCheckIns(from = new Date(), count = 4, everyMonths = 3) {
  const out = [];
  for (let i = 1; i <= count; i += 1) out.push(toISO(addMonths(from, i * everyMonths)));
  return out;
}

/** The year label for a date, derived, never hard-coded. */
export function yearOf(date = new Date()) {
  return new Date(date).getFullYear();
}
