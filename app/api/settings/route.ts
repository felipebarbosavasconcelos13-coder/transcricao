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
    const { openai_api_key, supabase_url, supabase_anon_key } = body;

    saveSystemSettings({
      openai_api_key: openai_api_key || "",
      supabase_url: supabase_url || "",
      supabase_anon_key: supabase_anon_key || ""
    });

    return NextResponse.json({ success: true, message: "Configurações salvas com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Erro no servidor" }, { status: 500 });
  }
}
