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

// Lê as configurações persistidas em arquivo (somente as que o usuário gravou via UI).
function getFileSettings(): Partial<SystemSettings> {
  try {
    if (!fs.existsSync(MOCK_DB_PATH)) {
      return {};
    }
    const content = fs.readFileSync(MOCK_DB_PATH, "utf8");
    const db = JSON.parse(content);
    return db.settings || {};
  } catch (e) {
    return {};
  }
}

// Configurações efetivas: arquivo tem prioridade; se ausente, usa variáveis de ambiente.
// Isso garante funcionamento em ambientes serverless (Vercel) onde o disco é somente-leitura.
export function getSystemSettings(): SystemSettings {
  const file = getFileSettings();
  return {
    openai_api_key: file.openai_api_key || process.env.OPENAI_API_KEY || "",
    deepseek_api_key: file.deepseek_api_key || process.env.DEEPSEEK_API_KEY || "",
    supabase_url: file.supabase_url || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabase_anon_key: file.supabase_anon_key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    model: file.model || process.env.DEFAULT_ASR_MODEL || DEFAULT_SETTINGS.model,
    language: file.language || process.env.DEFAULT_LANGUAGE || DEFAULT_SETTINGS.language
  };
}

// Salva as configurações em arquivo. Retorna `true` em caso de sucesso e `false`
// quando o disco é somente-leitura (ex.: Vercel/serverless), permitindo que a API
// informe o usuário corretamente em vez de fingir que salvou.
export function saveSystemSettings(settings: SystemSettings): boolean {
  try {
    let db: any = { jobs: [], transcripts: [], comments: [] };
    if (fs.existsSync(MOCK_DB_PATH)) {
      const content = fs.readFileSync(MOCK_DB_PATH, "utf8");
      db = JSON.parse(content);
    }
    db.settings = settings;
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(db, null, 2));
    return true;
  } catch (e) {
    console.error("Erro ao salvar configurações do sistema:", e);
    return false;
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

export function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}
