// Server-side request validation for /api/generate.
// Returns a typed, safe request or a contract-compliant error.

import type {
  ApiErrorShape,
  ApiRequest,
  GenerateRequest,
  TryOnRequest,
} from "@/app/lib/types";
import { ERROR_STATUS } from "@/app/lib/types";

export const PROMPT_MIN = 3;
export const PROMPT_MAX = 600;
/** Max decoded image size: 5 MB. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

function err(
  code: ApiErrorShape["code"],
  message: string
): { ok: false; error: ApiErrorShape } {
  return { ok: false, error: { code, message, status: ERROR_STATUS[code] } };
}

/**
 * Estimate the decoded byte size of a base64 payload without allocating a Buffer.
 * base64 encodes 3 bytes per 4 chars; padding "=" reduces the count.
 */
export function base64DecodedBytes(base64: string): number {
  const len = base64.length;
  if (len === 0) return 0;
  let padding = 0;
  if (base64.endsWith("==")) padding = 2;
  else if (base64.endsWith("=")) padding = 1;
  return Math.floor((len * 3) / 4) - padding;
}

/** Parse a data URL, returning its mime type and raw base64 payload. */
function parseDataUrl(
  value: unknown
): { mime: string; base64: string } | null {
  if (typeof value !== "string") return null;
  const match = /^data:([a-zA-Z0-9.+/-]+);base64,([\s\S]+)$/.exec(value);
  if (!match) return null;
  return { mime: match[1].toLowerCase(), base64: match[2] };
}

export type ValidationResult =
  | { ok: true; request: ApiRequest }
  | { ok: false; error: ApiErrorShape };

/**
 * Validates the incoming request body against the API contract.
 * Never throws — always returns a discriminated result.
 */
export function validateRequest(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null) {
    return err("INVALID_MODE", "Requisição inválida. Envie um corpo JSON válido.");
  }

  const body = raw as Record<string, unknown>;
  const mode = body.mode;

  if (mode !== "generate" && mode !== "tryon") {
    return err(
      "INVALID_MODE",
      "Modo inválido. Use \"generate\" (gerar do zero) ou \"tryon\" (ver-se tatuado)."
    );
  }

  // Prompt validation (shared by both modes).
  const prompt = body.prompt;
  if (typeof prompt !== "string") {
    return err("INVALID_PROMPT", "A descrição é obrigatória.");
  }
  const trimmed = prompt.trim();
  if (trimmed.length < PROMPT_MIN) {
    return err(
      "INVALID_PROMPT",
      `A descrição precisa ter pelo menos ${PROMPT_MIN} caracteres.`
    );
  }
  if (trimmed.length > PROMPT_MAX) {
    return err(
      "INVALID_PROMPT",
      `A descrição pode ter no máximo ${PROMPT_MAX} caracteres.`
    );
  }

  if (mode === "generate") {
    const request: GenerateRequest = { mode: "generate", prompt: trimmed };
    return { ok: true, request };
  }

  // mode === "tryon" — requires a valid image.
  const parsed = parseDataUrl(body.image);
  if (!parsed) {
    return err(
      "INVALID_IMAGE",
      "A foto é obrigatória e deve ser uma imagem válida (JPEG, PNG ou WebP)."
    );
  }

  if (!ALLOWED_IMAGE_MIME.includes(parsed.mime as (typeof ALLOWED_IMAGE_MIME)[number])) {
    return err(
      "INVALID_IMAGE",
      "Formato de imagem não suportado. Use JPEG, PNG ou WebP."
    );
  }

  const bytes = base64DecodedBytes(parsed.base64);
  if (bytes <= 0) {
    return err("INVALID_IMAGE", "A imagem enviada está vazia ou corrompida.");
  }
  if (bytes > MAX_IMAGE_BYTES) {
    return err(
      "IMAGE_TOO_LARGE",
      "A imagem é muito grande. Envie um arquivo de até 5 MB."
    );
  }

  const request: TryOnRequest = {
    mode: "tryon",
    prompt: trimmed,
    image: body.image as string,
  };
  return { ok: true, request };
}
