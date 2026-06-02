import fs from "fs";
import path from "path";

const MOCK_DB_PATH = path.join(process.cwd(), "temp_db.json");

export interface SystemSettings {
  openai_api_key: string;
  deepseek_api_key: string;
  supabase_url: string;
  supabase_anon_key: string;
  model: string;
  language: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  openai_api_key: "",
  deepseek_api_key: "",
  supabase_url: "",
  supabase_anon_key: "",
  model: "whisper-1",
  language: "pt"
};

export function getSystemSettings(): SystemSettings {
  try {
    if (!fs.existsSync(MOCK_DB_PATH)) {
      return DEFAULT_SETTINGS;
    }
    const content = fs.readFileSync(MOCK_DB_PATH, "utf8");
    const db = JSON.parse(content);
    return {
      ...DEFAULT_SETTINGS,
      ...(db.settings || {})
    };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSystemSettings(settings: SystemSettings) {
  try {
    let db: any = { jobs: [], transcripts: [], comments: [] };
    if (fs.existsSync(MOCK_DB_PATH)) {
      const content = fs.readFileSync(MOCK_DB_PATH, "utf8");
      db = JSON.parse(content);
    }
    db.settings = settings;
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error("Erro ao salvar configurações do sistema:", e);
  }
}

export function getOpenaiApiKey(): string {
  const settings = getSystemSettings();
  return settings.openai_api_key || process.env.OPENAI_API_KEY || "";
}

export function getDeepseekApiKey(): string {
  const settings = getSystemSettings();
  return settings.deepseek_api_key || "";
}

export function getSupabaseUrl(): string {
  const settings = getSystemSettings();
  return settings.supabase_url || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export function getSupabaseAnonKey(): string {
  const settings = getSystemSettings();
  return settings.supabase_anon_key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}
