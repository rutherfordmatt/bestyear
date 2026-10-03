/*
  Available throughout, as promised on the landing page and in the privacy note:
  clear everything, download a copy, import one back.
*/
import { useRef, useState } from "preact/hooks";
import { clearAll, downloadJson, importFromFile } from "../lib/storage.js";
import { track, EVENTS } from "../lib/analytics.js";

export default function StorageControls() {
  const fileRef = useRef(null);
  const [message, setMessage] = useState("");

  const onClear = () => {
    const ok = confirm(
      "Clear all your answers?\n\nThis deletes everything saved on this device. It can't be undone. " +
      "If you want a copy first, cancel and choose Download my answers."
    );
    if (!ok) return;
    clearAll();
    track(EVENTS.answersCleared);
    setMessage("Cleared. Nothing is saved on this device any more.");
  };

  const onImport = async (e) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    const result = await importFromFile(file);
    setMessage(result.ok ? "Imported. Your answers are back." : result.error);
    e.currentTarget.value = "";
  };

  return (
    <div class="storage-controls no-print">
      <p class="storage-note">
        Your answers stay on this device. Nothing is sent anywhere unless you ask.
      </p>
      <div class="storage-actions">
        <button type="button" class="btn small text" onClick={() => { downloadJson(); track(EVENTS.answersExported); }}>
          Download my answers
        </button>
        <button type="button" class="btn small text" onClick={() => fileRef.current?.click()}>
          Import answers
        </button>
        <button type="button" class="btn small text danger" onClick={onClear}>
          Clear all my answers
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          class="visually-hidden"
          onChange={onImport}
          aria-label="Choose a Year Well Built answers file"
        />
      </div>
      {message && <p class="storage-message" role="status">{message}</p>}
    </div>
  );
}
