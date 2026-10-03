/*
  A small repeatable list of free-text items (energy givers and drainers,
  letting-go entries). Adds a row as you fill the last one, so there's no
  "add another" button to hunt for.
*/
import { useState } from "preact/hooks";

export default function ListInput({ items = [], onChange, placeholder = "", label, max = 10 }) {
  const rows = [...items, ""].slice(0, Math.max(items.length + 1, 1));
  const [focused, setFocused] = useState(-1);

  const setAt = (index, value) => {
    const next = [...items];
    if (index >= next.length) next.push(value);
    else next[index] = value;
    onChange(next.filter((v, i) => v.trim() !== "" || i === index).slice(0, max));
  };

  const removeAt = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <ul class="list-input" aria-label={label}>
      {rows.map((value, i) => (
        <li key={i}>
          <input
            type="text"
            value={value}
            placeholder={i === 0 ? placeholder : ""}
            maxLength={300}
            aria-label={`${label}, item ${i + 1}`}
            onFocus={() => setFocused(i)}
            onBlur={() => setFocused(-1)}
            onInput={(e) => setAt(i, e.currentTarget.value)}
          />
          {value.trim() && (
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
  );
}
