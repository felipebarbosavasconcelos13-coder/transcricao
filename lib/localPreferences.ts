import { normalizeAsrModel, type AsrModel } from "./jobPreferences";

const LOCAL_ASR_MODEL_KEY = "atigra_asr_model";
const LOCAL_LANGUAGE_KEY = "atigra_language";

export interface LocalPreferences {
  asrModel: AsrModel;
  language: string;
}

export function getLocalPreferences(): LocalPreferences {
  if (typeof window === "undefined") {
    return { asrModel: "whisper-1", language: "pt" };
  }

  return {
    asrModel: normalizeAsrModel(localStorage.getItem(LOCAL_ASR_MODEL_KEY)),
    language: localStorage.getItem(LOCAL_LANGUAGE_KEY) || "pt",
  };
}

export function saveLocalPreferences(preferences: LocalPreferences) {
  if (typeof window === "undefined") return;

  localStorage.setItem(LOCAL_ASR_MODEL_KEY, normalizeAsrModel(preferences.asrModel));
  localStorage.setItem(LOCAL_LANGUAGE_KEY, preferences.language || "pt");
}
