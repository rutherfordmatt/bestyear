import { useRef } from "preact/hooks";

/*
  A small repeatable list of free-text items (energy givers and drainers).

  It used to render a permanently empty row after the last entry, which in the
  two-column energy audit looked like two stray fields had appeared from
  nowhere. Rows are now added on request, the same as the letting-go piles.
*/
export default function ListInput({ items = [], onChange, placeholder = "", label, max = 10 }) {
  const listRef = useRef(null);
  const rows = items.length ? items : [""];

  const setAt = (index, value) => {
    const next = [...rows];
    next[index] = value;
    onChange(next);
  };

  const removeAt = (index) => onChange(rows.filter((_, i) => i !== index));

  const add = () => {
    onChange([...rows, ""]);
    // Put the cursor where it is now expected to be.
    requestAnimationFrame(() => {
      const inputs = listRef.current?.querySelectorAll("input");
      inputs?.[inputs.length - 1]?.focus();
    });
  };

  const canAdd = rows.length < max && rows.every((v) => v.trim());

  return (
    <div class="list-input-wrap">
      <ul class="list-input" ref={listRef} aria-label={label}>
        {rows.map((value, i) => (
          <li key={i}>
            <input
              type="text"
              value={value}
              placeholder={i === 0 ? placeholder : ""}
              maxLength={300}
              aria-label={`${label}, item ${i + 1}`}
              onInput={(e) => setAt(i, e.currentTarget.value)}
            />
            {rows.length > 1 && (
              <button
                type="button"
                class="list-remove"
                onClick={() => removeAt(i)}
                aria-label={`Remove "${value}"`}
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
      {canAdd && (
        <button type="button" class="btn small text add-another" onClick={add}>
          + Add another
        </button>
      )}
    </div>
  );
}
