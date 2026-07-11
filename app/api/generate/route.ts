import type { ApiErrorShape } from "@/app/lib/types";
import { ERROR_STATUS } from "@/app/lib/types";
import { validateRequest } from "@/app/lib/validation";
import { generateTattoo, OpenAIError } from "@/app/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Contract-shaped error message table (PT-BR). Never leaks internals. */
const ERROR_MESSAGES: Record<ApiErrorShape["code"], string> = {
  MISSING_API_KEY:
    "A chave da IA não está configurada. Adicione OPENAI_API_KEY ao arquivo .env.local e reinicie o servidor.",
  INVALID_API_KEY: "Chave da IA inválida. Verifique OPENAI_API_KEY.",
  INSUFFICIENT_CREDITS:
    "Sua conta de IA está sem créditos. Adicione créditos em platform.openai.com/settings/organization/billing e tente novamente.",
  INVALID_MODE: "Modo inválido.",
  INVALID_PROMPT: "Descrição inválida.",
  INVALID_IMAGE: "Imagem inválida.",
  IMAGE_TOO_LARGE: "A imagem é muito grande. Envie um arquivo de até 5 MB.",
  RATE_LIMITED:
    "Muitas solicitações em pouco tempo. Aguarde alguns instantes e tente novamente.",
  NO_IMAGE_RETURNED:
    "A IA não retornou nenhuma imagem. Tente ajustar a descrição e gerar novamente.",
  UPSTREAM_ERROR:
    "Ocorreu um erro ao contatar o serviço de IA. Tente novamente em instantes.",
  TIMEOUT:
    "A geração demorou demais e foi cancelada. Tente novamente com uma descrição mais simples.",
};

/** Builds a JSON error Response that conforms to the API contract. */
function errorResponse(
  code: ApiErrorShape["code"],
  overrideMessage?: string
): Response {
  const status = ERROR_STATUS[code];
  const message = overrideMessage ?? ERROR_MESSAGES[code];
  return Response.json(
    { ok: false, error: { code, message, status } },
    { status }
  );
}

export async function POST(request: Request): Promise<Response> {
  // 1) API key guard — FIRST check, before anything else.
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return errorResponse("MISSING_API_KEY");
  }

  // 2) Parse the JSON body.
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse("INVALID_MODE", "Corpo da requisição inválido (JSON malformado).");
  }

  // 3) Validate against the contract.
  const validation = validateRequest(raw);
  if (!validation.ok) {
    return errorResponse(validation.error.code, validation.error.message);
  }

  const req = validation.request;

  // 4) Call OpenAI, mapping every failure to a contract error.
  try {
    const result = await generateTattoo(req, key);
    return Response.json(
      {
        ok: true,
        mode: req.mode,
        image: result.image,
        textNote: result.textNote,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof OpenAIError) {
      // Log the internal detail server-side only; send the safe PT-BR message.
      console.error(`[generate] OpenAIError ${error.code}: ${error.message}`);
      return errorResponse(error.code);
    }
    // Unknown failure — never leak the stack; map to a generic upstream error.
    console.error("[generate] Unexpected error:", error);
    return errorResponse("UPSTREAM_ERROR");
  }
}
