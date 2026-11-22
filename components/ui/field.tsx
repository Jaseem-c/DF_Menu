import type { ReactNode } from "react";

type Props = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

/** Label + control + error text. The control should use `id` and `aria-describedby`. */
export function Field({ id, label, error, hint, children }: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-bold">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-brand-800/70">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
