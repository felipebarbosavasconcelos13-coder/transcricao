export type AsrModel = "whisper-1" | "deepseek-asr";

export interface CreateJobInput {
  name: string;
  sourceType: "upload" | "youtube";
  sourceUrl: string;
  duration?: number;
  webhookUrl?: string | null;
  asrModel?: string;
  language?: string;
}

export function normalizeAsrModel(value: unknown): AsrModel {
  return value === "deepseek-asr" ? "deepseek-asr" : "whisper-1";
}

export function normalizeLanguage(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "pt";
}

export function validateCreateJobInput(body: unknown): CreateJobInput {
  if (!body || typeof body !== "object") {
    throw new Error("Payload inválido para criação de job.");
  }

  const input = body as Partial<CreateJobInput>;
  const { name, sourceType, sourceUrl } = input;

  if (!name || !sourceType || !sourceUrl) {
    throw new Error("Campos obrigatórios ausentes: name, sourceType, sourceUrl");
  }

  if (sourceType !== "upload" && sourceType !== "youtube") {
    throw new Error("sourceType inválido. Use upload ou youtube.");
  }

  return input as CreateJobInput;
}

export function buildJobInsert(input: CreateJobInput) {
  return {
    name: input.name,
    source_type: input.sourceType,
    source_url: input.sourceUrl,
    status: "pending",
    progress: 0,
    duration: input.duration || 0,
    asr_model: normalizeAsrModel(input.asrModel),
    language: normalizeLanguage(input.language),
    error_message: null,
    webhook_url: input.webhookUrl || null,
  };
}

export function getErrorMessage(error: unknown, fallback = "Erro no servidor") {
  return error instanceof Error ? error.message : fallback;
}

export function isCreateJobValidationError(error: unknown) {
  const message = getErrorMessage(error, "");
  return message.includes("Campos obrigatórios") || message.includes("sourceType inválido") || message.includes("Payload inválido");
}
