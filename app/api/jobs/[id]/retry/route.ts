export const maxDuration = 300;

import { NextRequest, NextResponse, after } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { processJob } from "@/lib/worker";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Buscar o job para garantir que existe
    const { data: job, error: getError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (getError || !job) {
      return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });
    }

    // 2. Limpar transcrições antigas associadas
    await supabase
      .from("transcripts")
      .delete()
      .eq("id", id);

    // 3. Atualizar o job de volta para pending
    const { data: updatedJob, error: updateError } = await supabase
      .from("jobs")
      .update({
        status: "pending",
        progress: 0,
        error_message: null
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updatedJob) {
      throw updateError || new Error("Falha ao atualizar o status do job");
    }

    console.log(`[JOBS RETRY] Reprocessamento iniciado para o Job ${id}`);

    // 4. Disparar o processamento de novo em segundo plano (resiliente a serverless)
    after(async () => {
      try {
        await processJob(id);
      } catch (err) {
        console.error(`[WORKER RUNTIME ERROR ON RETRY] Erro ao reprocessar Job ${id}:`, err);
      }
    });

    return NextResponse.json({ success: true, data: updatedJob });
  } catch (error: any) {
    console.error("Erro no retry do job:", error);
    return NextResponse.json({ error: error.message || "Erro no servidor" }, { status: 500 });
  }
}
