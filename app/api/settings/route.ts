export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSystemSettings, saveSystemSettings } from "@/lib/settings";

// GET: Retornar o estado das configurações do sistema (sem expor segredos).
export async function GET() {
  try {
    const settings = getSystemSettings();
    // Não retornamos as chaves secretas para o navegador. Apenas valores públicos
    // (URL do Supabase, modelo, idioma) e flags indicando se cada integração está ativa.
    return NextResponse.json({
      success: true,
      data: {
        supabase_url: settings.supabase_url,
        supabase_anon_key: settings.supabase_anon_key,
        model: settings.model,
        language: settings.language,
        openai_api_key: "",
        deepseek_api_key: "",
        openai_configured: !!settings.openai_api_key,
        deepseek_configured: !!settings.deepseek_api_key,
        supabase_configured: !!(settings.supabase_url && settings.supabase_anon_key)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Erro no servidor" }, { status: 500 });
  }
}

// POST: Salvar novas configurações do sistema.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentSettings = getSystemSettings();

    // Para campos de chave secreta, uma string vazia significa "manter o valor atual"
    // (o frontend só envia a chave quando o usuário realmente digita uma nova).
    const keepIfEmpty = (incoming: any, current: string) =>
      incoming !== undefined && incoming !== "" ? incoming : current;

    const saved = saveSystemSettings({
      openai_api_key: keepIfEmpty(body.openai_api_key, currentSettings.openai_api_key),
      deepseek_api_key: keepIfEmpty(body.deepseek_api_key, currentSettings.deepseek_api_key),
      // URL/Anon podem ser limpas intencionalmente (ex.: "usar banco local"), então respeitam o body.
      supabase_url: body.supabase_url !== undefined ? body.supabase_url : currentSettings.supabase_url,
      supabase_anon_key: body.supabase_anon_key !== undefined ? body.supabase_anon_key : currentSettings.supabase_anon_key,
      model: body.model !== undefined ? body.model : currentSettings.model,
      language: body.language !== undefined ? body.language : currentSettings.language
    });

    if (!saved) {
      // Disco somente-leitura (típico em deploy serverless como a Vercel).
      return NextResponse.json(
        {
          success: false,
          readonly: true,
          error:
            "Não foi possível gravar as configurações neste ambiente (disco somente-leitura). " +
            "Em produção, defina as credenciais como Variáveis de Ambiente na plataforma de deploy " +
            "(OPENAI_API_KEY, DEEPSEEK_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) e refaça o deploy."
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, message: "Configurações salvas com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Erro no servidor" }, { status: 500 });
  }
}
