import fs from "fs";
import path from "path";

const MOCK_DB_PATH = path.join(process.cwd(), "temp_db.json");

export interface SystemSettings {
  openai_api_key: string;
  supabase_url: string;
  supabase_anon_key: string;
}

export function getSystemSettings(): SystemSettings {
  try {
    if (!fs.existsSync(MOCK_DB_PATH)) {
      return { openai_api_key: "", supabase_url: "", supabase_anon_key: "" };
    }
    const content = fs.readFileSync(MOCK_DB_PATH, "utf8");
    const db = JSON.parse(content);
    return db.settings || { openai_api_key: "", supabase_url: "", supabase_anon_key: "" };
  } catch (e) {
    return { openai_api_key: "", supabase_url: "", supabase_anon_key: "" };
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

export function getSupabaseUrl(): string {
  const settings = getSystemSettings();
  return settings.supabase_url || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export function getSupabaseAnonKey(): string {
  const settings = getSystemSettings();
  return settings.supabase_anon_key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}
