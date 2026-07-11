"use client";

import { useRef } from "react";
import { PROMPT_MAX, PROMPT_MIN } from "@/app/lib/validation";

interface TryOnFormProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  /** Data URL preview of the selected (already downscaled) photo, or null. */
  imagePreview: string | null;
  onFileSelected: (file: File) => void;
  onClearImage: () => void;
  onSubmit: () => void;
  loading: boolean;
  /** Whether the image is currently being processed/downscaled. */
  processingImage: boolean;
}

const ACCEPT = "image/jpeg,image/png,image/webp";

/** Form for the "try it on" mode: photo upload + description. */
export default function TryOnForm({
  prompt,
  onPromptChange,
  imagePreview,
  onFileSelected,
  onClearImage,
  onSubmit,
  loading,
  processingImage,
}: TryOnFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedLen = prompt.trim().length;
  const promptValid = trimmedLen >= PROMPT_MIN && trimmedLen <= PROMPT_MAX;
  const canSubmit = promptValid && !!imagePreview && !loading && !processingImage;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit();
      }}
      className="flex flex-col gap-4"
    >
      {/* Photo upload + preview */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide text-neutral-300">
          Sua foto
        </span>

        {imagePreview ? (
          <div className="relative overflow-hidden rounded-lg border border-ink-line bg-ink-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Prévia da foto enviada"
              className="max-h-72 w-full object-contain"
            />
            <button
              type="button"
              onClick={onClearImage}
              disabled={loading}
              className="absolute right-2 top-2 rounded-full bg-ink-black/80 px-3 py-1 text-xs font-semibold text-neutral-100 transition hover:bg-ink-black disabled:opacity-50"
            >
              Trocar foto
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading || processingImage}
            className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ink-line bg-ink-soft text-neutral-400 transition hover:border-neutral-500 hover:text-neutral-200 disabled:opacity-60"
          >
            {processingImage ? (
              <>
                <span className="tattoo-spinner inline-block h-5 w-5 rounded-full border-2 border-neutral-400 border-t-transparent" />
                <span className="text-sm">Processando imagem…</span>
              </>
            ) : (
              <>
                <span className="text-2xl">+</span>
                <span className="text-sm">Enviar uma foto (JPEG, PNG ou WebP)</span>
              </>
            )}
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
            // Reset so re-selecting the same file fires onChange again.
            e.target.value = "";
          }}
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="tryon-prompt"
          className="text-sm font-semibold uppercase tracking-wide text-neutral-300"
        >
          Descreva a tatuagem
        </label>
        <textarea
          id="tryon-prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          maxLength={PROMPT_MAX}
          rows={3}
          disabled={loading}
          placeholder="Ex.: uma rosa geométrica no antebraço, linhas finas e dotwork"
          className="w-full resize-none rounded-lg border border-ink-line bg-ink-soft px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-400 focus:outline-none disabled:opacity-60"
        />
        <div className="flex justify-between text-xs text-neutral-500">
          <span>Mínimo {PROMPT_MIN} caracteres.</span>
          <span>
            {trimmedLen}/{PROMPT_MAX}
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="rounded-md border border-ink-line bg-ink-soft/60 px-3 py-2 text-xs text-neutral-400">
        Prévia aproximada — não é o resultado final.
      </p>

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex items-center justify-center gap-2 rounded-lg bg-neutral-100 px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="tattoo-spinner inline-block h-4 w-4 rounded-full border-2 border-ink-black border-t-transparent" />
            Aplicando tatuagem…
          </>
        ) : (
          "Ver-me tatuado"
        )}
      </button>
    </form>
  );
}
