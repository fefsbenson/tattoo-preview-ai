"use client";

interface ErrorBannerProps {
  message: string | null;
  onDismiss?: () => void;
}

/** Prominently renders a PT-BR error message from the API contract. */
export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100"
    >
      <span aria-hidden className="mt-0.5 text-lg leading-none">
        !
      </span>
      <p className="flex-1 leading-relaxed">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar aviso"
          className="text-red-200/70 transition hover:text-red-100"
        >
          ×
        </button>
      )}
    </div>
  );
}
