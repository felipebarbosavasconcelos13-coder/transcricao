export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSystemSettings, saveSystemSettings } from "@/lib/settings";

// GET: Retornar as configurações do sistema
export async function GET() {
  try {
    const settings = getSystemSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Erro no servidor" }, { status: 500 });
  }
}

// POST: Salvar novas configurações do sistema
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentSettings = getSystemSettings();

    // Mesclar chaves enviadas, mantendo as antigas se o campo não estiver no body da requisição
    saveSystemSettings({
      openai_api_key: body.openai_api_key !== undefined ? body.openai_api_key : currentSettings.openai_api_key,
      deepseek_api_key: body.deepseek_api_key !== undefined ? body.deepseek_api_key : currentSettings.deepseek_api_key,
      supabase_url: body.supabase_url !== undefined ? body.supabase_url : currentSettings.supabase_url,
      supabase_anon_key: body.supabase_anon_key !== undefined ? body.supabase_anon_key : currentSettings.supabase_anon_key,
      model: body.model !== undefined ? body.model : currentSettings.model,
      language: body.language !== undefined ? body.language : currentSettings.language
    });

    return NextResponse.json({ success: true, message: "Configurações salvas com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Erro no servidor" }, { status: 500 });
  }
}
