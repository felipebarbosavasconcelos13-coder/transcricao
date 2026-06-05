export const dynamic = "force-dynamic";
// Permite que o processamento em background rode por mais tempo em plataformas
// serverless (ex.: Vercel). Ajuste conforme o limite do seu plano (Hobby: 60s).
export const maxDuration = 300;

import { NextRequest, NextResponse, after } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { processJob } from "@/lib/worker";
import { buildJobInsert, getErrorMessage, isCreateJobValidationError, validateCreateJobInput } from "@/lib/jobPreferences";

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

      const matchedIds = ((matchedTranscripts || []) as Array<{ id: string }>).map((t) => t.id);

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
  } catch (error: unknown) {
    console.error("Erro ao buscar jobs:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST: Criar um novo job
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = validateCreateJobInput(body);

    // Criar o registro do Job com status 'pending' e progresso 0
    const { data: job, error } = await supabase
      .from("jobs")
      .insert(buildJobInsert(input))
      .select()
      .single();

    if (error || !job) {
      throw error || new Error("Falha ao criar o job");
    }

    console.log(`[JOBS API] Job criado com sucesso ID: ${job.id}. Iniciando processamento...`);

    // Processamento em segundo plano. Usamos `after()` do Next.js para que o trabalho
    // continue após a resposta HTTP SEM que a função serverless seja encerrada
    // prematuramente (o que ocorria com setTimeout em ambientes como a Vercel).
    after(async () => {
      try {
        await processJob(job.id);
      } catch (err) {
        console.error(`[WORKER RUNTIME ERROR] Erro ao processar Job ${job.id}:`, err);
      }
    });

    return NextResponse.json({ success: true, data: job });
  } catch (error: unknown) {
    console.error("Erro ao criar job:", error);
    const status = isCreateJobValidationError(error) ? 400 : 500;
    return NextResponse.json({ error: getErrorMessage(error) }, { status });
  }
}
