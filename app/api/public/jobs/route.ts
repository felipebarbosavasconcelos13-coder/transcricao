import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { processJob } from "@/lib/worker";

// GET: Retornar lista de jobs públicos (para integradores)
export async function GET(req: NextRequest) {
  try {
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, name, source_type, status, progress, duration, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "API Pública Atigra Trans - Lista de Jobs",
      jobs: jobs || []
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Erro interno" }, { status: 500 });
  }
}

// POST: Criar job via API Pública (para integradores)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, sourceType, sourceUrl, webhookUrl } = body;

    // Autenticação mock básica (Chave de API pública)
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Chave de API (x-api-key) ausente nos headers." }, { status: 401 });
    }

    if (!name || !sourceType || !sourceUrl) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios ausentes: name, sourceType, sourceUrl" },
        { status: 400 }
      );
    }

    // Criar o registro
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        name,
        source_type: sourceType,
        source_url: sourceUrl,
        status: "pending",
        progress: 0,
        error_message: null,
        webhook_url: webhookUrl || null
      })
      .select()
      .single();

    if (error || !job) {
      throw error || new Error("Falha ao criar o job via API.");
    }

    // Iniciar processamento assíncrono
    setTimeout(() => {
      processJob(job.id).catch((err) => {
        console.error(`[PUBLIC API WORKER ERROR] Erro no Job ${job.id}:`, err);
      });
    }, 100);

    return NextResponse.json({
      success: true,
      message: "Job criado com sucesso. Processamento assíncrono iniciado.",
      job: {
        id: job.id,
        name: job.name,
        status: job.status,
        progress: job.progress,
        created_at: job.created_at
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Erro interno" }, { status: 500 });
  }
}
