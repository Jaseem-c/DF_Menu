"use client";

import { useId, useState } from "react";

type Props = {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
  hint?: string;
};

export function TagInput({ id, label, values, onChange, suggestions = [], hint }: Props) {
  const [draft, setDraft] = useState("");
  const listId = useId();

  const add = (raw: string) => {
    const value = raw.trim().replace(/,$/, "").trim();
    if (value && !values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      onChange([...values, value]);
    }
    setDraft("");
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-bold">
        {label}
      </label>
      {values.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {values.map((value) => (
            <li
              key={value}
              className="flex items-center gap-1 rounded-full bg-brand-100 py-1 pr-1 pl-3 text-sm font-semibold"
            >
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() => onChange(values.filter((v) => v !== value))}
                className="flex size-6 items-center justify-center rounded-full hover:bg-brand-200"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={id}
        list={suggestions.length ? listId : undefined}
        value={draft}
        onChange={(e) => {
          if (e.target.value.endsWith(",")) add(e.target.value);
          else setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
        placeholder="Type and press Enter"
        className="input"
        enterKeyHint="done"
      />
      {suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
      {hint && <p className="mt-1 text-xs text-brand-800/70">{hint}</p>}
    </div>
  );
}
