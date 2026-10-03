/*
  "Email it to me".

  Posts the ANSWERS as JSON — never rendered HTML. The server validates every
  field, caps lengths, and renders the email from its own template with all
  text escaped. See server/send.js and CLAUDE.md.

  The honeypot field is visually hidden and must stay empty.
*/
import { useState } from "preact/hooks";
import { useStore } from "../lib/use-store.js";
import { track, EVENTS } from "../lib/analytics.js";

const IDLE = "idle";
const SENDING = "sending";
const SENT = "sent";
const FAILED = "failed";

export default function SendForm({ actions = {} }) {
  const [state] = useStore();
  const [email, setEmail] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState(IDLE);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === SENDING) return;
    setStatus(SENDING);
    setError("");

    try {
      const res = await fetch("/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          newsletter,
          website: honeypot, // honeypot — real people leave this empty
          answers: state,
        }),
      });

      if (res.ok) {
        setStatus(SENT);
        track(EVENTS.documentEmailed);
        return;
      }

      const body = await res.json().catch(() => ({}));
      setError(body.error || "Something went wrong. Try again in a moment.");
      setStatus(FAILED);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setStatus(FAILED);
    }
  };

  if (status === SENT) {
    return (
      <section class="prompt send-form no-print">
        <div class="callout" role="status">
          <p>{actions.success || "Sent. Check your inbox (and your spam folder, just in case)."}</p>
        </div>
      </section>
    );
  }

  return (
    <section class="prompt send-form no-print">
      <div class="prompt-head">
        <h2 class="prompt-question">Email it to me</h2>
        <p class="note">{actions.line}</p>
      </div>

      <form onSubmit={onSubmit} class="send-fields">
        <div class="field">
          <label for="send-email">{actions.fieldLabel || "Your email"}</label>
          <input
            id="send-email"
            type="email"
            value={email}
            required
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            placeholder="you@example.com"
            onInput={(e) => setEmail(e.currentTarget.value)}
          />
        </div>

        {/* Honeypot. Hidden from people, irresistible to bots. */}
        <div class="hp" aria-hidden="true">
          <label for="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onInput={(e) => setHoneypot(e.currentTarget.value)}
          />
        </div>

        <label class="checkbox">
          <input
            type="checkbox"
            checked={newsletter}
            onChange={(e) => setNewsletter(e.currentTarget.checked)}
          />
          <span>{actions.checkbox || "Also send me Stuff that MattRs, my weekly newsletter."}</span>
        </label>

        <div class="row">
          <button type="submit" class="btn primary" disabled={status === SENDING || !email.trim()}>
            {status === SENDING ? "Sending…" : (actions.button || "Send my plan")}
          </button>
        </div>

        {error && <p class="send-error" role="alert">{error}</p>}
      </form>
    </section>
  );
}
