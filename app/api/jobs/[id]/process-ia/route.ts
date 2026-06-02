import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { OpenAI } from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY || "";
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Buscar a transcrição bruta do Job
    const { data: transcript, error: transError } = await supabase
      .from("transcripts")
      .select("*")
      .eq("id", id)
      .single();

    if (transError || !transcript) {
      return NextResponse.json({ error: "Transcrição não localizada para este job." }, { status: 404 });
    }

    const { data: job } = await supabase
      .from("jobs")
      .select("name")
      .eq("id", id)
      .single();

    const jobName = job?.name || "Vídeo";

    let cleanText = "";
    let summary = "";
    let highlights: string[] = [];

    if (openai) {
      console.log(`[IA API] Iniciando processamento do GPT para o Job ${id}...`);
      
      // Chamada 1: Limpeza e melhoria textual
      const cleanResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é um revisor profissional de transcrições de vídeo. Sua tarefa é receber o texto de uma transcrição bruta, corrigir a pontuação, estruturar quebras de linha/parágrafo para melhor legibilidade, e remover vícios de linguagem (como 'né', 'tipo', 'eh', 'ta', gagueiras), sem jamais alterar o sentido, omitir falas importantes ou resumir o texto."
          },
          {
            role: "user",
            content: `Aqui está o texto bruto da transcrição:\n\n${transcript.raw_text}`
          }
        ],
        temperature: 0.3
      });
      cleanText = cleanResponse.choices[0].message.content || transcript.raw_text;

      // Chamada 2: Resumo e Highlights
      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é um assistente especialista em analisar vídeos. Com base na transcrição fornecida, gere um resumo executivo bem estruturado em parágrafos e uma lista em formato JSON dos 5 principais tópicos ou insights (highlights) comentados. A resposta deve ser estritamente em português do Brasil no formato JSON: { \"summary\": \"resumo aqui\", \"highlights\": [\"tópico 1\", \"tópico 2\", ...] }"
          },
          {
            role: "user",
            content: `Nome do vídeo: ${jobName}\n\nTranscrição:\n\n${cleanText}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5
      });

      try {
        const iaOutput = JSON.parse(summaryResponse.choices[0].message.content || "{}");
        summary = iaOutput.summary || "Resumo não gerado.";
        highlights = iaOutput.highlights || [];
      } catch (parseErr) {
        console.error("Erro ao fazer parse do JSON da IA:", parseErr);
        summary = summaryResponse.choices[0].message.content || "Resumo gerado.";
        highlights = ["Análise de conteúdo concluída."];
      }

    } else {
      console.log(`[IA API] OpenAI não configurada. Gerando resposta mock para o Job "${jobName}"`);
      // Simular delay de processamento
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      cleanText = transcript.raw_text
        .replace(/Olá a todos!/g, "Olá a todos. \n\n")
        .replace(/automação de processos/g, "**automação de processos**")
        .replace(/Atigra Trans/g, "**Atigra Trans**")
        .replace(/legenda/g, "legenda")
        .replace(/\. /g, ".\n\n");

      summary = `Este vídeo aborda a criação e o funcionamento do **Atigra Trans**, um aplicativo inovador voltado para a transcrição automatizada de conteúdos em áudio e vídeo utilizando inteligência artificial. 

O apresentador detalha como a plataforma resolve o problema de tempo associado à decodificação manual de discursos, permitindo o upload de arquivos de vídeo locais e links diretos do YouTube. A pipeline do sistema extrai o áudio no formato ideal (mono 16kHz) e executa a conversão por meio da rede neural Whisper.

Por fim, destaca-se a utilidade da ferramenta na exportação de legendas nos formatos mais demandados do mercado (TXT, SRT e VTT), proporcionando grande aumento de produtividade e melhor indexação de conteúdos digitais.`;

      highlights = [
        "Apresentação da proposta de valor única do Atigra Trans.",
        "Integração do motor de inteligência artificial Whisper para transcrição precisa.",
        "Facilidade no upload de arquivos locais e extração direta de vídeos do YouTube.",
        "Normalização automática do áudio (mono 16kHz) para aumento de compatibilidade com ASR.",
        "Geração rápida de legendas e exportação flexível (TXT, SRT e VTT) para produtores de conteúdo."
      ];
    }

    // 4. Atualizar a tabela transcripts no banco de dados
    const { data: updatedTranscript, error: updateError } = await supabase
      .from("transcripts")
      .update({
        clean_text: cleanText,
        summary,
        highlights
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // 5. Atualizar o job para refletir o status de finalizado e pós-processado
    await supabase
      .from("jobs")
      .update({
        status: "completed",
        progress: 100
      })
      .eq("id", id);

    return NextResponse.json({ 
      success: true, 
      data: updatedTranscript 
    });
  } catch (error: any) {
    console.error("Erro no pós-processamento de IA:", error);
    return NextResponse.json({ error: error.message || "Erro interno no processamento de IA." }, { status: 500 });
  }
}
