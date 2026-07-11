import "server-only";

// OpenAI Images API integration. This is the ONLY module that reads the API key
// (besides the initial guard in the route). It must never run on the client.
//
// Two flows, both returning gpt-image-1 base64 PNG:
//   - "generate" → POST /v1/images/generations  (JSON body)
//   - "tryon"    → POST /v1/images/edits         (multipart/form-data)

import type { ApiRequest, ErrorCode } from "@/app/lib/types";
import {
  BLACKWORK_SYSTEM_PROMPT,
  generatePrompt,
  tryonPrompt,
} from "@/app/lib/prompts";

const OPENAI_GENERATIONS_URL = "https://api.openai.com/v1/images/generations";
const OPENAI_EDITS_URL = "https://api.openai.com/v1/images/edits";
const MODEL = "gpt-image-1";
const IMAGE_SIZE = "1024x1024";
const IMAGE_QUALITY = "medium";
const TIMEOUT_MS = 60_000;

/**
 * Typed error that carries a contract error code. The route maps it to the
 * proper HTTP status + PT-BR message. Never carries stack/key details to client.
 */
export class OpenAIError extends Error {
  constructor(public readonly code: ErrorCode, message?: string) {
    super(message ?? code);
    this.name = "OpenAIError";
  }
}

export interface GenerationResult {
  /** Base64 data URL of the generated image. */
  image: string;
  /** Optional text the model returned alongside the image. Always null for the Images API. */
  textNote: string | null;
}

// --- Minimal shapes for defensive parsing of the OpenAI response. ---

interface OpenAIImageData {
  b64_json?: string;
}
interface OpenAIImageResponse {
  data?: OpenAIImageData[];
}
interface OpenAIErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

/**
 * The Images API has no system role, so we fold the blackwork system prompt into
 * a single prompt string alongside the mode-specific instructions.
 */
function composePrompt(request: ApiRequest): string {
  const modePrompt =
    request.mode === "tryon"
      ? tryonPrompt(request.prompt)
      : generatePrompt(request.prompt);
  return `${BLACKWORK_SYSTEM_PROMPT}\n\n${modePrompt}`;
}

/**
 * Calls OpenAI to generate/edit a blackwork tattoo image.
 * Throws OpenAIError with a contract code on any failure.
 */
export async function generateTattoo(
  request: ApiRequest,
  apiKey: string
): Promise<GenerationResult> {
  const prompt = composePrompt(request);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response =
      request.mode === "tryon"
        ? await callEdits(request.image, prompt, apiKey, controller.signal)
        : await callGenerations(prompt, apiKey, controller.signal);
  } catch (error) {
    // Already-typed contract errors (e.g. malformed image) pass through unchanged.
    if (error instanceof OpenAIError) {
      throw error;
    }
    // Abort → timeout; anything else → generic upstream/network error.
    if (error instanceof Error && error.name === "AbortError") {
      throw new OpenAIError("TIMEOUT", "upstream timeout");
    }
    throw new OpenAIError(
      "UPSTREAM_ERROR",
      "network failure contacting OpenAI"
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    // Drain the body so we can classify + log server-side without leaking to the client.
    const detail = await safeReadText(response);
    throw classifyUpstreamError(response.status, detail);
  }

  let json: OpenAIImageResponse;
  try {
    json = (await response.json()) as OpenAIImageResponse;
  } catch {
    throw new OpenAIError("UPSTREAM_ERROR", "invalid JSON from OpenAI");
  }

  const b64 = json.data?.[0]?.b64_json;
  if (!b64) {
    throw new OpenAIError("NO_IMAGE_RETURNED", "model returned no image");
  }

  // OpenAI returns raw base64 PNG (no data: prefix) — wrap it into a data URL.
  return { image: `data:image/png;base64,${b64}`, textNote: null };
}

/** MODE "generate" → JSON body to /v1/images/generations. */
function callGenerations(
  prompt: string,
  apiKey: string,
  signal: AbortSignal
): Promise<Response> {
  const body = {
    model: MODEL,
    prompt,
    n: 1,
    size: IMAGE_SIZE,
    quality: IMAGE_QUALITY,
  };

  return fetch(OPENAI_GENERATIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
}

/**
 * MODE "tryon" → multipart/form-data to /v1/images/edits.
 * The user's photo arrives as a base64 data URL; decode it to bytes and attach
 * it as a Blob. Do NOT set Content-Type manually — let FormData set the boundary.
 */
function callEdits(
  imageDataUrl: string,
  prompt: string,
  apiKey: string,
  signal: AbortSignal
): Promise<Response> {
  const base64 = imageDataUrl.split("base64,")[1];
  if (!base64) {
    // Validation already guaranteed a data URL, but stay defensive.
    return Promise.reject(new OpenAIError("INVALID_IMAGE", "malformed image data URL"));
  }

  const bytes = Buffer.from(base64, "base64");
  const blob = new Blob([bytes], { type: "image/png" });

  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", prompt);
  form.append("size", IMAGE_SIZE);
  form.append("quality", IMAGE_QUALITY);
  form.append("image", blob, "photo.png");

  return fetch(OPENAI_EDITS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      // No Content-Type — FormData sets the multipart boundary automatically.
    },
    body: form,
    signal,
  });
}

/**
 * Maps a non-2xx OpenAI response to a contract error. Distinguishes an
 * out-of-credits account (insufficient_quota) from a plain rate limit, and an
 * invalid key (401) from everything else.
 */
function classifyUpstreamError(status: number, detail: string): OpenAIError {
  if (status === 401) {
    return new OpenAIError("INVALID_API_KEY", `unauthorized: ${detail}`);
  }

  if (status === 429) {
    // Parse the error body to tell "no credits" apart from "too many requests".
    const parsed = parseErrorBody(detail);
    const type = parsed?.error?.type;
    const code = parsed?.error?.code;
    if (type === "insufficient_quota" || code === "insufficient_quota") {
      return new OpenAIError("INSUFFICIENT_CREDITS", `insufficient quota: ${detail}`);
    }
    return new OpenAIError("RATE_LIMITED", `rate limited: ${detail}`);
  }

  return new OpenAIError("UPSTREAM_ERROR", `upstream status ${status}: ${detail}`);
}

/** Parse an OpenAI error body without throwing. */
function parseErrorBody(detail: string): OpenAIErrorBody | null {
  try {
    return JSON.parse(detail) as OpenAIErrorBody;
  } catch {
    return null;
  }
}

/** Reads a response body as text without throwing. */
async function safeReadText(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 500);
  } catch {
    return "<unreadable>";
  }
}
