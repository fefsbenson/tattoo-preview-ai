// Shared types for the Blackwork Tattoo MVP.
// These types define the API contract between client and server.

export type Mode = "generate" | "tryon";

/** Discriminated union of accepted request bodies. */
export type GenerateRequest = {
  mode: "generate";
  prompt: string;
};

export type TryOnRequest = {
  mode: "tryon";
  prompt: string;
  /** Base64 data URL: "data:image/jpeg;base64,..." */
  image: string;
};

export type ApiRequest = GenerateRequest | TryOnRequest;

/** Canonical error codes → HTTP status mapping. */
export type ErrorCode =
  | "MISSING_API_KEY" // 503
  | "INVALID_API_KEY" // 503
  | "INSUFFICIENT_CREDITS" // 402
  | "INVALID_MODE" // 400
  | "INVALID_PROMPT" // 400
  | "INVALID_IMAGE" // 400
  | "IMAGE_TOO_LARGE" // 413
  | "RATE_LIMITED" // 429
  | "NO_IMAGE_RETURNED" // 502
  | "UPSTREAM_ERROR" // 502
  | "TIMEOUT"; // 504

export interface ApiErrorShape {
  code: ErrorCode;
  message: string; // PT-BR, safe to show to the user
  status: number;
}

export interface ApiSuccessResponse {
  ok: true;
  mode: Mode;
  /** Base64 data URL: "data:image/png;base64,..." */
  image: string;
  textNote: string | null;
}

export interface ApiErrorResponse {
  ok: false;
  error: ApiErrorShape;
}

export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

/** Maps each error code to its HTTP status. Single source of truth. */
export const ERROR_STATUS: Record<ErrorCode, number> = {
  MISSING_API_KEY: 503,
  INVALID_API_KEY: 503,
  INSUFFICIENT_CREDITS: 402,
  INVALID_MODE: 400,
  INVALID_PROMPT: 400,
  INVALID_IMAGE: 400,
  IMAGE_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  NO_IMAGE_RETURNED: 502,
  UPSTREAM_ERROR: 502,
  TIMEOUT: 504,
};
