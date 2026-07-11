"use client";

import { PROMPT_MAX, PROMPT_MIN } from "@/app/lib/validation";

interface GenerateFormProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

/** Form for the "generate from scratch" mode: just a description textarea. */
export default function GenerateForm({
  prompt,
  onPromptChange,
  onSubmit,
  loading,
}: GenerateFormProps) {
  const trimmedLen = prompt.trim().length;
  const valid = trimmedLen >= PROMPT_MIN && trimmedLen <= PROMPT_MAX;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !loading) onSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="generate-prompt"
          className="text-sm font-semibold uppercase tracking-wide text-neutral-300"
        >
          Descreva a tatuagem
        </label>
        <textarea
          id="generate-prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          maxLength={PROMPT_MAX}
          rows={4}
          disabled={loading}
          placeholder="Ex.: uma serpente ornamental enrolada em uma adaga, estilo geométrico com dotwork"
          className="w-full resize-none rounded-lg border border-ink-line bg-ink-soft px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-400 focus:outline-none disabled:opacity-60"
        />
        <div className="flex justify-between text-xs text-neutral-500">
          <span>Mínimo {PROMPT_MIN} caracteres.</span>
          <span>
            {trimmedLen}/{PROMPT_MAX}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!valid || loading}
        className="flex items-center justify-center gap-2 rounded-lg bg-neutral-100 px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="tattoo-spinner inline-block h-4 w-4 rounded-full border-2 border-ink-black border-t-transparent" />
            Gerando…
          </>
        ) : (
          "Gerar tatuagem"
        )}
      </button>
    </form>
  );
}
