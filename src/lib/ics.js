/*
  Calendar file for the quarterly check-ins. Hand-rolled so no library ships
  to the browser, and so nothing about the visitor's plan leaves the device:
  the file is built and downloaded locally.

  All-day events, per RFC 5545. No year is hard-coded — dates come from the
  visitor's own check-in list.
*/

import { parseISO, toISO } from "./dates.js";

const CRLF = "\r\n";

/** Escape per RFC 5545: backslash, semicolon, comma and newlines. */
function esc(text = "") {
  return String(text)
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Long lines must be folded at 75 octets. */
function fold(line) {
  if (line.length <= 73) return line;
  const parts = [];
  let rest = line;
  parts.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length > 72) {
    parts.push(` ${rest.slice(0, 72)}`);
    rest = rest.slice(72);
  }
  if (rest.length) parts.push(` ${rest}`);
  return parts.join(CRLF);
}

const stamp = (date = new Date()) =>
  `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

const dateOnly = (iso) => String(iso).replaceAll("-", "");

/** A stable-ish uid that reveals nothing about the visitor. */
function uid(iso, index) {
  return `ywb-${dateOnly(iso)}-${index}@yearwellbuilt.com`;
}

/**
 * Build the .ics text for a list of ISO dates.
 * `summary` and `description` are the same for each check-in.
 */
export function buildIcs(dates = [], { summary, description } = {}) {
  const now = stamp();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Year Well Built//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  dates
    .map((d) => (parseISO(d) ? d : null))
    .filter(Boolean)
    .forEach((iso, i) => {
      const start = parseISO(iso);
      const end = new Date(start);
      end.setDate(end.getDate() + 1); // DTEND is exclusive for all-day events
      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid(iso, i)}`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${dateOnly(iso)}`,
        `DTEND;VALUE=DATE:${dateOnly(toISO(end))}`,
        `SUMMARY:${esc(summary || "Check in on my year")}`,
        `DESCRIPTION:${esc(description || "Read your vision document. What's working? What's drifted? What's one thing to adjust?")}`,
        "TRANSP:TRANSPARENT",
        "BEGIN:VALARM",
        "TRIGGER:-PT9H",
        "ACTION:DISPLAY",
        `DESCRIPTION:${esc(summary || "Check in on my year")}`,
        "END:VALARM",
        "END:VEVENT"
      );
    });

  lines.push("END:VCALENDAR");
  return lines.map(fold).join(CRLF) + CRLF;
}

export function downloadIcs(dates, options) {
  if (typeof window === "undefined") return;
  const blob = new Blob([buildIcs(dates, options)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "year-well-built-check-ins.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
