import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: Obter status e transcrição de job específico (para integradores)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const apiKey = req.headers.get("x-api-key");
    
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Chave de API (x-api-key) ausente nos headers." }, { status: 401 });
    }

    // Buscar o Job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ success: false, error: "Job não localizado." }, { status: 404 });
    }

    // Buscar transcrição se estiver completo
    let transcript = null;
    if (job.status === "completed") {
      const { data: transData } = await supabase
        .from("transcripts")
        .select("raw_text, clean_text, summary, highlights, segments")
        .eq("id", id)
        .single();
      transcript = transData;
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        name: job.name,
        source_type: job.source_type,
        status: job.status,
        progress: job.progress,
        duration: job.duration,
        error_message: job.error_message,
        created_at: job.created_at,
        transcript: transcript
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Erro interno" }, { status: 500 });
  }
}
