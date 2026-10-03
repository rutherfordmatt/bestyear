/*
  Dates are always derived from "today". No year is ever hard-coded —
  see CLAUDE.md, Evergreen.
*/

const LOCALE = "en-IE";

/** "End of June" style short form for a goal date (an ISO date or free text). */
export function formatDate(value) {
  if (!value) return "";
  const d = parseISO(value);
  if (!d) return String(value);
  return d.toLocaleDateString(LOCALE, { day: "numeric", month: "long" });
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
