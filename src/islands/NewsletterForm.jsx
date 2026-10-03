/*
  The close screen's secondary ask: the newsletter on its own.
  Same endpoint as the vision document, with no answers attached — the server
  treats an empty `answers` as "subscribe only".
*/
import { useState } from "preact/hooks";

export default function NewsletterForm({ fieldLabel = "Your email", button = "Subscribe" }) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          newsletter: true,
          subscribeOnly: true,
          website: honeypot,
        }),
      });
      if (res.ok) { setStatus("done"); return; }
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Something went wrong. Try again in a moment.");
      setStatus("failed");
    } catch {
      setError("Couldn't reach the server. Try again in a moment.");
      setStatus("failed");
    }
  };

  if (status === "done") {
    return <p class="callout" role="status">You're on the list. Thanks for reading.</p>;
  }

  return (
    <form onSubmit={onSubmit} class="send-fields">
      <div class="field">
        <label for="news-email">{fieldLabel}</label>
        <input
          id="news-email" type="email" value={email} required
          autoComplete="email" inputMode="email" maxLength={254}
          placeholder="you@example.com"
          onInput={(e) => setEmail(e.currentTarget.value)}
        />
      </div>
      <div class="hp" aria-hidden="true">
        <label for="news-website">Website</label>
        <input
          id="news-website" name="website" type="text" tabIndex={-1}
          autoComplete="off" value={honeypot}
          onInput={(e) => setHoneypot(e.currentTarget.value)}
        />
      </div>
      <div class="row">
        <button type="submit" class="btn" disabled={status === "sending" || !email.trim()}>
          {status === "sending" ? "Subscribing…" : button}
        </button>
      </div>
      {error && <p class="send-error" role="alert">{error}</p>}
    </form>
  );
}
