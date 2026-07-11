"use client";

import { useState } from "react";
import ModeToggle from "@/app/components/ModeToggle";
import GenerateForm from "@/app/components/GenerateForm";
import TryOnForm from "@/app/components/TryOnForm";
import ResultCanvas from "@/app/components/ResultCanvas";
import ErrorBanner from "@/app/components/ErrorBanner";
import { downscaleImage } from "@/app/lib/imageUtils";
import type { ApiResponse, Mode } from "@/app/lib/types";

export default function Home() {
  const [mode, setMode] = useState<Mode>("generate");
  const [prompt, setPrompt] = useState("");

  // Try-on image: the downscaled data URL sent to the API.
  const [imageData, setImageData] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);

  // Generation state.
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [textNote, setTextNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: Mode) {
    if (loading) return;
    setMode(next);
    setError(null);
    // Keep the prompt (useful when experimenting), reset image + result.
    setResultImage(null);
    setTextNote(null);
  }

  async function handleFileSelected(file: File) {
    setError(null);
    setProcessingImage(true);
    try {
      const downscaled = await downscaleImage(file);
      setImageData(downscaled);
    } catch {
      setError("Não foi possível processar a imagem. Tente outra foto.");
      setImageData(null);
    } finally {
      setProcessingImage(false);
    }
  }

  function clearImage() {
    setImageData(null);
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResultImage(null);
    setTextNote(null);

    try {
      const payload =
        mode === "tryon"
          ? { mode, prompt: prompt.trim(), image: imageData }
          : { mode, prompt: prompt.trim() };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as ApiResponse;

      if (!data.ok) {
        setError(data.error.message);
        return;
      }

      setResultImage(data.image);
      setTextNote(data.textNote);
    } catch {
      // Network-level failure (server unreachable, JSON parse, etc.).
      setError(
        "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:py-16">
      {/* Header */}
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-4xl font-black uppercase tracking-tight sm:text-5xl">
          Blackwork Tattoo
        </h1>
        <p className="text-sm text-neutral-400 sm:text-base">
          Gere designs 100% blackwork com IA — ou veja como uma tatuagem fica na
          sua pele.
        </p>
      </header>

      {/* Mode toggle */}
      <div className="mx-auto w-full max-w-md">
        <ModeToggle mode={mode} onChange={switchMode} disabled={loading} />
      </div>

      {/* Two-column layout: form + result */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          {mode === "generate" ? (
            <GenerateForm
              prompt={prompt}
              onPromptChange={setPrompt}
              onSubmit={handleGenerate}
              loading={loading}
            />
          ) : (
            <TryOnForm
              prompt={prompt}
              onPromptChange={setPrompt}
              imagePreview={imageData}
              onFileSelected={handleFileSelected}
              onClearImage={clearImage}
              onSubmit={handleGenerate}
              loading={loading}
              processingImage={processingImage}
            />
          )}
        </section>

        <section>
          <ResultCanvas
            image={resultImage}
            textNote={textNote}
            mode={mode}
            loading={loading}
          />
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-6 text-center text-xs text-neutral-600">
        MVP • Sem login • As imagens não são armazenadas.
      </footer>
    </main>
  );
}
