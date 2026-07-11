"use client";

import { downloadDataUrl } from "@/app/lib/imageUtils";
import type { Mode } from "@/app/lib/types";

interface ResultCanvasProps {
  image: string | null;
  textNote: string | null;
  mode: Mode;
  loading: boolean;
}

/** Displays the generated image with a download button, or a placeholder. */
export default function ResultCanvas({
  image,
  textNote,
  mode,
  loading,
}: ResultCanvasProps) {
  function handleDownload() {
    if (!image) return;
    const name =
      mode === "tryon" ? "tatuagem-na-foto.png" : "tatuagem-blackwork.png";
    downloadDataUrl(image, name);
  }

  return (
    <div className="flex min-h-[20rem] flex-col gap-4">
      <div className="flex flex-1 items-center justify-center rounded-xl border border-ink-line bg-ink-soft">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-neutral-400">
            <span className="tattoo-spinner inline-block h-8 w-8 rounded-full border-2 border-neutral-500 border-t-transparent" />
            <span className="text-sm uppercase tracking-wide">
              Criando sua arte…
            </span>
          </div>
        ) : image ? (
          <div className="flex w-full flex-col items-center gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt="Tatuagem blackwork gerada"
              className="max-h-[28rem] w-full rounded-lg object-contain"
            />
          </div>
        ) : (
          <p className="px-6 text-center text-sm text-neutral-600">
            O resultado aparecerá aqui.
          </p>
        )}
      </div>

      {image && !loading && (
        <div className="flex flex-col gap-3">
          {textNote && (
            <p className="rounded-md border border-ink-line bg-ink-soft/60 px-3 py-2 text-xs text-neutral-400">
              {textNote}
            </p>
          )}
          <button
            type="button"
            onClick={handleDownload}
            className="self-start rounded-lg border border-neutral-400 px-5 py-2 text-sm font-bold uppercase tracking-wide text-neutral-100 transition hover:bg-neutral-100 hover:text-ink-black"
          >
            Baixar imagem
          </button>
        </div>
      )}
    </div>
  );
}
