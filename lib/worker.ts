import { supabase, isUsingMock } from "./supabaseClient";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import ytdl from "@distube/ytdl-core";
import fs from "fs";
import path from "path";
import { OpenAI } from "openai";

// Configura o ffmpeg para usar o binário estático correto do SO
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
  console.log(`[FFMPEG] Utilizando binário estático em: ${ffmpegPath}`);
} else {
  console.warn("[FFMPEG] Não foi possível encontrar o binário estático do ffmpeg-static.");
}

import { getOpenaiApiKey } from "./settings";

// Inicializar cliente OpenAI dinamicamente com suporte a configurações em tempo de execução
function getOpenaiClient() {
  const key = getOpenaiApiKey();
  return key ? new OpenAI({ apiKey: key }) : null;
}

// Função principal de processamento de Jobs
export async function processJob(jobId: string) {
  console.log(`[WORKER] Iniciando processamento do Job ${jobId}`);
  
  let tempVideoPath = "";
  let tempAudioPath = "";
  let isYoutube = false;
  
  try {
    // 1. Obter o job do banco de dados
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();
      
    if (jobErr || !job) {
      throw new Error(`Job ${jobId} não encontrado no banco de dados.`);
    }

    isYoutube = job.source_type === "youtube";
    const sourceUrl = job.source_url;
    
    // Determinar pastas temporárias de trabalho (compatível com Serverless /tmp e ambiente local)
    const tempDir = typeof window === "undefined" && process.env.NODE_ENV === "production" 
      ? "/tmp" 
      : path.join(process.cwd(), "public", "mock-uploads");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const uniqueId = `${Date.now()}-${jobId.substring(0, 8)}`;
    
    // 2. Extração / Download de mídia
    await updateJobStatus(jobId, "processing_audio", 15);
    
    if (isYoutube) {
      console.log(`[WORKER] Baixando áudio do YouTube: ${sourceUrl}`);
      tempVideoPath = path.join(tempDir, `${uniqueId}-yt.mp4`);
      tempAudioPath = path.join(tempDir, `${uniqueId}-yt.wav`);
      
      // Baixar áudio do YouTube
      await downloadYoutubeAudio(sourceUrl, tempVideoPath);
      
      // Atualizar info sobre o vídeo do YouTube (duração aproximada)
      try {
        const info = await ytdl.getBasicInfo(sourceUrl);
        const durationSec = parseInt(info.videoDetails.lengthSeconds) || 0;
        await supabase
          .from("jobs")
          .update({ 
            name: info.videoDetails.title || job.name,
            duration: durationSec 
          })
          .eq("id", jobId);
      } catch (e) {
        console.error("Falha ao obter metadados do YouTube:", e);
      }
    } else {
      // É upload local
      console.log(`[WORKER] Processando vídeo de upload local: ${sourceUrl}`);
      
      if (isUsingMock) {
        // No mock, o arquivo está na pasta public/mock-uploads
        const filename = sourceUrl.replace("/mock-uploads/", "");
        tempVideoPath = path.join(process.cwd(), "public", "mock-uploads", filename);
        tempAudioPath = tempVideoPath.replace(/\.[^/.]+$/, ".wav");
      } else {
        // No Supabase real, precisamos baixar o vídeo do Storage para a pasta /tmp para processar
        tempVideoPath = path.join(tempDir, `${uniqueId}-upload.mp4`);
        tempAudioPath = path.join(tempDir, `${uniqueId}-upload.wav`);
        
        console.log(`[WORKER] Baixando vídeo do Supabase Storage para processamento local...`);
        const filename = sourceUrl.substring(sourceUrl.lastIndexOf("/") + 1);
        const { data: fileData, error: downloadErr } = await supabase.storage
          .from("videos")
          .download(filename);
          
        if (downloadErr || !fileData) {
          throw downloadErr || new Error("Falha ao baixar arquivo do storage");
        }
        
        const arrayBuffer = await fileData.arrayBuffer();
        fs.writeFileSync(tempVideoPath, Buffer.from(arrayBuffer));
      }
    }

    // 3. Conversão de Vídeo para Áudio via ffmpeg (normalizado para 16kHz mono)
    await updateJobStatus(jobId, "processing_audio", 45);
    console.log(`[WORKER] Convertendo vídeo para áudio (mono 16kHz): ${tempVideoPath} -> ${tempAudioPath}`);
    
    await convertVideoToAudio(tempVideoPath, tempAudioPath);
    
    // Obter a duração real do áudio caso não tenha sido obtida antes
    const actualDuration = await getAudioDuration(tempAudioPath).catch(() => 0);
    if (actualDuration > 0) {
      await supabase.from("jobs").update({ duration: actualDuration }).eq("id", jobId);
    }

    // 4. Transcrição (Whisper API ou Mock Simulado)
    await updateJobStatus(jobId, "transcribing", 70);
    
    let transcriptionResult: { text: string; segments: any[] };
    const openaiClient = getOpenaiClient();

    if (openaiClient) {
      console.log(`[WORKER] Enviando áudio para OpenAI Whisper API...`);
      transcriptionResult = await transcribeWithWhisper(tempAudioPath, openaiClient);
    } else {
      console.log(`[WORKER] OpenAI API Key não configurada. Simulando transcrição realista...`);
      const duration = actualDuration || 60; // fallback se for 0
      transcriptionResult = generateMockTranscription(job.name, duration);
      // Simular um atraso no processamento para experiência de loading realista
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }

    // 5. Pós-processamento e Salvamento
    await updateJobStatus(jobId, "post_processing", 90);
    
    // Salvar na tabela transcripts
    const { error: transErr } = await supabase
      .from("transcripts")
      .insert({
        id: jobId,
        raw_text: transcriptionResult.text,
        clean_text: transcriptionResult.text, // Inicialmente igual, melhorado na etapa IA
        summary: null,
        highlights: [],
        segments: transcriptionResult.segments
      });
      
    if (transErr) {
      throw transErr;
    }

    // 6. Concluir o Job
    await updateJobStatus(jobId, "completed", 100);
    console.log(`[WORKER] Job ${jobId} concluído com sucesso!`);

    // Disparar Webhook de conclusão
    triggerWebhook(jobId, "completed");

    // Limpar arquivos temporários que não precisamos mais (se não for mock)
    // No mock mantemos o áudio e vídeo na pasta public/mock-uploads para reprodução
    if (!isUsingMock) {
      try {
        if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
        if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
        console.log(`[WORKER] Arquivos temporários limpos.`);
      } catch (e) {
        console.error("Erro ao limpar arquivos temporários:", e);
      }
    }

  } catch (error: any) {
    console.error(`[WORKER FAILED] Erro no processamento do Job ${jobId}:`, error);
    await supabase
      .from("jobs")
      .update({
        status: "failed",
        progress: 0,
        error_message: error.message || "Erro desconhecido durante o processamento"
      })
      .eq("id", jobId);

    // Disparar Webhook de erro
    triggerWebhook(jobId, "failed", error.message || "Erro desconhecido");
  }
}

// Disparar Webhook POST de notificação
async function triggerWebhook(jobId: string, status: string, errorMsg: string | null = null) {
  try {
    const { data: job } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (job && job.webhook_url) {
      console.log(`[WEBHOOK] Disparando notificação para: ${job.webhook_url}`);
      fetch(job.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          name: job.name,
          status: status,
          progress: status === "completed" ? 100 : 0,
          duration: job.duration,
          error_message: errorMsg
        })
      }).catch((e: any) => {
        console.error(`[WEBHOOK ERROR] Falha no POST do Webhook:`, e.message);
      });
    }
  } catch (e: any) {
    console.error(`[WEBHOOK ERROR] Falha ao disparar webhook:`, e.message);
  }
}

// Função auxiliar para atualizar o status e progresso do job
async function updateJobStatus(id: string, status: string, progress: number) {
  await supabase
    .from("jobs")
    .update({ status, progress })
    .eq("id", id);
}

// Download do áudio do YouTube usando ytdl-core/distube
function downloadYoutubeAudio(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`[YTDL] Baixando streaming de áudio de: ${url}`);
      // Usar a melhor qualidade de áudio
      const stream = ytdl(url, { 
        filter: "audioonly",
        quality: "highestaudio"
      });
      
      const fileStream = fs.createWriteStream(outputPath);
      stream.pipe(fileStream);
      
      fileStream.on("finish", () => {
        console.log(`[YTDL] Download do áudio concluído em: ${outputPath}`);
        resolve();
      });
      
      stream.on("error", (err) => {
        reject(new Error(`Erro no download do YouTube: ${err.message}`));
      });
      
      fileStream.on("error", (err) => {
        reject(new Error(`Erro de escrita do arquivo de áudio: ${err.message}`));
      });
    } catch (e: any) {
      reject(e);
    }
  });
}

// Conversão do vídeo em áudio mono 16kHz
function convertVideoToAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-vn",               // Sem vídeo
        "-ac 1",             // 1 canal (mono)
        "-ar 16000",         // Taxa de amostragem de 16kHz
        "-codec:a pcm_s16le" // Codec de áudio PCM 16-bit
      ])
      .save(outputPath)
      .on("end", () => {
        console.log("[FFMPEG] Conversão de áudio concluída com sucesso.");
        resolve();
      })
      .on("error", (err) => {
        reject(new Error(`Erro no ffmpeg durante conversão de áudio: ${err.message}`));
      });
  });
}

// Obter a duração do áudio usando ffmpeg ffprobe ou metadata do fluent-ffmpeg
function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(err);
      }
      const duration = metadata.format.duration;
      resolve(duration ? parseFloat(duration.toString()) : 0);
    });
  });
}

// Realiza a transcrição real na API do Whisper
async function transcribeWithWhisper(audioPath: string, openaiClient: OpenAI): Promise<{ text: string; segments: any[] }> {
  if (!openaiClient) {
    throw new Error("Cliente OpenAI não inicializado");
  }

  const fileStream = fs.createReadStream(audioPath);
  
  // Chamada da API de transcrição Whisper com suporte a segmentos detalhados
  const response = await openaiClient.audio.transcriptions.create({
    file: fileStream,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["word", "segment"]
  });

  const rawResponse = response as any;
  const segments = (rawResponse.segments || []).map((seg: any) => ({
    id: seg.id,
    start: seg.start,
    end: seg.end,
    text: seg.text.trim()
  }));

  return {
    text: rawResponse.text,
    segments
  };
}

// Simulação de transcrição realista (Mock)
function generateMockTranscription(title: string, durationSec: number): { text: string; segments: any[] } {
  const words = [
    "Olá a todos!", "Sejam muito bem-vindos a mais um vídeo explicativo.",
    "Hoje nós vamos falar sobre um assunto muito importante e interessante:",
    "a automação de processos utilizando inteligência artificial.",
    "A tecnologia vem avançando a passos largos, permitindo que tarefas repetitivas",
    "sejam executadas por agentes inteligentes de forma rápida e precisa.",
    "Isso economiza tempo precioso de equipes inteiras e permite focar na estratégia.",
    "Além disso, a qualidade dos modelos de linguagem como GPT e Claude",
    "abriu caminhos incríveis para análises textuais, limpeza de dados e muito mais.",
    "Neste aplicativo, o Atigra Trans, nós combinamos a facilidade do Supabase",
    "com a precisão de transcrição do OpenAI Whisper.",
    "Com apenas alguns cliques, você insere um link ou faz upload do seu vídeo,",
    "e a nossa pipeline se encarrega de extrair o áudio e converter para texto.",
    "Você pode baixar em formatos como TXT, VTT e SRT, o que facilita muito",
    "a criação de legendas e indexação do conteúdo.",
    "Esperamos que esta ferramenta facilite a sua vida e aumente a sua produtividade.",
    "Se você gostou deste projeto, não hesite em compartilhar com os seus colegas.",
    "Muito obrigado pela atenção e nos vemos no próximo tutorial. Até mais!"
  ];

  const segments: any[] = [];
  let currentStart = 0.5;
  const timePerSegment = durationSec / words.length;

  words.forEach((phrase, idx) => {
    const end = Math.min(currentStart + timePerSegment - 0.5 + Math.random(), durationSec);
    segments.push({
      id: idx,
      start: parseFloat(currentStart.toFixed(2)),
      end: parseFloat(end.toFixed(2)),
      text: phrase
    });
    currentStart = end + 0.3;
  });

  const fullText = words.join(" ");

  return {
    text: fullText,
    segments
  };
}
