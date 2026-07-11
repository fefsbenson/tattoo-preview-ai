"use client";

import type { Mode } from "@/app/lib/types";

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
  disabled?: boolean;
}

const OPTIONS: { value: Mode; label: string }[] = [
  { value: "generate", label: "Gerar do zero" },
  { value: "tryon", label: "Ver-se tatuado" },
];

/** Segmented control that switches between the two generation modes. */
export default function ModeToggle({
  mode,
  onChange,
  disabled = false,
}: ModeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Modo de geração"
      className="inline-flex w-full rounded-full border border-ink-line bg-ink-soft p-1"
    >
      {OPTIONS.map((option) => {
        const active = option.value === mode;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={[
              "flex-1 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide transition",
              active
                ? "bg-neutral-100 text-ink-black"
                : "text-neutral-400 hover:text-neutral-100",
              disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
