/*
  Available throughout, as promised on the landing page and in the privacy note.

  Deliberately NOT called "download my answers": that sounds like "get my plan",
  and what it produces is a backup file only the import button can read. The
  readable copy is Save as PDF on Step 7. These two jobs stay separate and
  honestly named.
*/
import { useRef, useState } from "preact/hooks";
import { clearAll, downloadJson, importFromFile } from "../lib/storage.js";
import { track, EVENTS } from "../lib/analytics.js";

export default function StorageControls({ expanded = false }) {
  const fileRef = useRef(null);
  const [open, setOpen] = useState(expanded);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const onClear = () => {
    const ok = confirm(
      "Clear all your answers?\n\n" +
      "This deletes everything saved on this device. It can't be undone.\n\n" +
      "If you want to keep a copy, cancel and choose \"Save a backup file\" first."
    );
    if (!ok) return;
    clearAll();
    track(EVENTS.answersCleared);
    setError(false);
    setMessage("Cleared. Nothing is saved on this device any more.");
  };

  const onImport = async (e) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    const result = await importFromFile(file);
    setError(!result.ok);
    setMessage(result.ok ? "Imported. Your answers are back." : result.error);
    e.currentTarget.value = "";
  };

  return (
    <div class="storage-controls no-print">
      <p class="storage-note">
        Your answers stay on this device. Nothing is sent anywhere unless you ask.
      </p>

      {!open && !expanded ? (
        <button type="button" class="btn small text storage-toggle" onClick={() => setOpen(true)}>
          Manage my answers
        </button>
      ) : (
        <div class="storage-detail">
          <div class="storage-action">
            <div>
              <b>Save a backup file</b>
              <span>
                For moving to another device, not for reading — it's a data file,
                and only the button below can open it again. For a copy you can
                actually read, use <a href="/step/7">Save as PDF</a> on the last step.
              </span>
            </div>
            <button
              type="button"
              class="btn small"
              onClick={() => { downloadJson(); track(EVENTS.answersExported); }}
            >
              Save backup
            </button>
          </div>

          <div class="storage-action">
            <div>
              <b>Restore from a backup</b>
              <span>Pick a backup file saved from another device. It replaces what's here.</span>
            </div>
            <button type="button" class="btn small" onClick={() => fileRef.current?.click()}>
              Restore
            </button>
          </div>

          <div class="storage-action">
            <div>
              <b>Clear all my answers</b>
              <span>Deletes everything on this device, instantly and permanently.</span>
            </div>
            <button type="button" class="btn small danger" onClick={onClear}>
              Clear
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            class="visually-hidden"
            onChange={onImport}
            aria-label="Choose a Year Well Built backup file"
          />
        </div>
      )}

      {message && (
        <p class={`storage-message${error ? " is-error" : ""}`} role="status">{message}</p>
      )}
    </div>
  );
}
