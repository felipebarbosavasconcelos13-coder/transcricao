export const maxDuration = 300;

import { NextRequest, NextResponse, after } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { processJob } from "@/lib/worker";
import { buildJobInsert, getErrorMessage, isCreateJobValidationError, validateCreateJobInput } from "@/lib/jobPreferences";

// GET: Retornar lista de jobs públicos (para integradores)
export async function GET() {
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
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error, "Erro interno") }, { status: 500 });
  }
}

// POST: Criar job via API Pública (para integradores)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Autenticação mock básica (Chave de API pública)
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Chave de API (x-api-key) ausente nos headers." }, { status: 401 });
    }

    const input = validateCreateJobInput(body);

    // Criar o registro
    const { data: job, error } = await supabase
      .from("jobs")
      .insert(buildJobInsert(input))
      .select()
      .single();

    if (error || !job) {
      throw error || new Error("Falha ao criar o job via API.");
    }

    // Iniciar processamento assíncrono de forma compatível com serverless.
    after(async () => {
      processJob(job.id).catch((err) => {
        console.error(`[PUBLIC API WORKER ERROR] Erro no Job ${job.id}:`, err);
      });
    });

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

  } catch (error: unknown) {
    const status = isCreateJobValidationError(error) ? 400 : 500;
    return NextResponse.json({ success: false, error: getErrorMessage(error, "Erro interno") }, { status });
  }
}
