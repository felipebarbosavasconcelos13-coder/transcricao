export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { processJob } from "@/lib/worker";

// GET: Listar todos os jobs (com suporte a busca textual)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    let query = supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (q) {
      // 1. Buscar transcrições que contêm o termo buscado
      const { data: matchedTranscripts } = await supabase
        .from("transcripts")
        .select("id")
        .or(`raw_text.ilike.%${q}%,clean_text.ilike.%${q}%`);

      const matchedIds = (matchedTranscripts || []).map((t: any) => t.id);

      // 2. Filtrar jobs: título correspondente OU ID contido nas transcrições que bateram
      if (matchedIds.length > 0) {
        // Formato compatível com o interpretador OR do Supabase e do nosso mock
        const idsList = matchedIds.join(",");
        query = query.or(`name.ilike.%${q}%,id.in.(${idsList})`);
      } else {
        query = query.ilike("name", `%${q}%`);
      }
    }

    const { data: jobs, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data: jobs });
  } catch (error: any) {
    console.error("Erro ao buscar jobs:", error);
    return NextResponse.json({ error: error.message || "Erro no servidor" }, { status: 500 });
  }
}

// POST: Criar um novo job
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, sourceType, sourceUrl, duration, webhookUrl } = body;

    if (!name || !sourceType || !sourceUrl) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes: name, sourceType, sourceUrl" },
        { status: 400 }
      );
    }

    // Criar o registro do Job com status 'pending' e progresso 0
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        name,
        source_type: sourceType,
        source_url: sourceUrl,
        status: "pending",
        progress: 0,
        duration: duration || 0,
        error_message: null,
        webhook_url: webhookUrl || null
      })
      .select()
      .single();

    if (error || !job) {
      throw error || new Error("Falha ao criar o job");
    }

    console.log(`[JOBS API] Job criado com sucesso ID: ${job.id}. Iniciando processamento...`);

    // Iniciar o processamento assincronamente em segundo plano (sem dar await)
    // Usamos setTimeout para garantir que a resposta HTTP seja entregue imediatamente ao cliente
    setTimeout(() => {
      processJob(job.id).catch((err) => {
        console.error(`[WORKER RUNTIME ERROR] Erro ao processar Job ${job.id}:`, err);
      });
    }, 100);

    return NextResponse.json({ success: true, data: job });
  } catch (error: any) {
    console.error("Erro ao criar job:", error);
    return NextResponse.json({ error: error.message || "Erro no servidor" }, { status: 500 });
  }
}
