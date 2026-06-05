import { supabase, isUsingMock } from "./supabaseClient";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import ytdl from "@distube/ytdl-core";
import fs from "fs";
import path from "path";
import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";
import { getOpenaiApiKey, getDeepseekApiKey, getSystemSettings, getSupabaseServiceRoleKey, getSupabaseUrl } from "./settings";
import { getErrorMessage } from "./jobPreferences";

interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface WorkerJob {
  id: string;
  name: string;
  source_type: "upload" | "youtube";
  source_url: string;
  asr_model?: string;
  webhook_url?: string | null;
  duration?: number;
}

type TranscriptionResult = { text: string; segments: TranscriptSegment[] };

interface PreparedMedia {
  tempVideoPath: string;
  tempAudioPath: string;
  sourceStoragePath: string;
  isYoutube: boolean;
}

function resolveFfmpegPath() {
  const executable = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const candidates = [
    process.env.FFMPEG_BIN,
    path.join(process.cwd(), "node_modules", "ffmpeg-static", executable),
    ffmpegPath,
  ].filter(Boolean) as string[];

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function getVideoStoragePath(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl);
    const marker = "/videos/";
    const markerIndex = url.pathname.indexOf(marker);
    const storagePath = markerIndex >= 0
      ? url.pathname.slice(markerIndex + marker.length)
      : url.pathname.slice(url.pathname.lastIndexOf("/") + 1);

    return decodeURIComponent(storagePath);
  } catch {
    return decodeURIComponent(sourceUrl.split("?")[0].replace(/^\/+/, ""));
  }
}

function getYoutubeRequestOptions() {
  const cookiesJson = process.env.YOUTUBE_COOKIES_JSON;
  if (!cookiesJson) return {};

  try {
    return { agent: ytdl.createAgent(JSON.parse(cookiesJson)) };
  } catch {
    console.warn("[YTDL] YOUTUBE_COOKIES_JSON inválido. Continuando sem cookies.");
    return {};
  }
}

function getYoutubeErrorMessage(message: string) {
  const lowerMessage = message.toLowerCase();
  if (
    lowerMessage.includes("sign in to confirm") ||
    lowerMessage.includes("not a bot") ||
    lowerMessage.includes("429") ||
    lowerMessage.includes("too many requests")
  ) {
    return "O YouTube bloqueou o download automático deste vídeo por verificação anti-bot. Use upload de arquivo ou configure YOUTUBE_COOKIES_JSON na Vercel para autenticar as requisições do YouTube.";
  }

  return `Erro no download do YouTube: ${message}`;
}

function getTempDir() {
  const tempDir = typeof window === "undefined" && process.env.NODE_ENV === "production"
    ? "/tmp"
    : path.join(process.cwd(), "public", "mock-uploads");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  return tempDir;
}

async function deleteStoredVideo(storagePath: string) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  const storageClient = supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : supabase;

  const { error } = await storageClient.storage.from("videos").remove([storagePath]);
  if (error) {
    console.warn(`[WORKER] Falha ao excluir vídeo do Storage (${storagePath}): ${error.message}`);
    return;
  }

  console.log(`[WORKER] Vídeo removido do Storage após extração do áudio: ${storagePath}`);
}

// Configura o ffmpeg para usar o binário estático correto do SO
const resolvedFfmpegPath = resolveFfmpegPath();
if (resolvedFfmpegPath) {
  ffmpeg.setFfmpegPath(resolvedFfmpegPath);
  console.log(`[FFMPEG] Utilizando binário estático em: ${resolvedFfmpegPath}`);
} else {
  console.warn(`[FFMPEG] Binário do ffmpeg-static não encontrado em: ${ffmpegPath || "caminho indisponível"}`);
}

// Inicializar cliente OpenAI dinamicamente com suporte a configurações em tempo de execução
function getOpenaiClient() {
  const key = getOpenaiApiKey();
  return key ? new OpenAI({ apiKey: key }) : null;
}

async function getJob(jobId: string) {
  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    throw new Error(`Job ${jobId} não encontrado no banco de dados.`);
  }

  return job as WorkerJob;
}

async function prepareMedia(job: WorkerJob, jobId: string): Promise<PreparedMedia> {
  const isYoutube = job.source_type === "youtube";
  const sourceUrl = job.source_url;
  const tempDir = getTempDir();
  const uniqueId = `${Date.now()}-${jobId.substring(0, 8)}`;

  if (isYoutube) {
    const tempVideoPath = path.join(tempDir, `${uniqueId}-yt.mp4`);
    const tempAudioPath = path.join(tempDir, `${uniqueId}-yt.mp3`);

    console.log(`[WORKER] Baixando áudio do YouTube: ${sourceUrl}`);
    await downloadYoutubeAudio(sourceUrl, tempVideoPath);
    await updateYoutubeMetadata(jobId, sourceUrl, job.name);

    return { tempVideoPath, tempAudioPath, sourceStoragePath: "", isYoutube };
  }

  console.log(`[WORKER] Processando mídia de upload: ${sourceUrl}`);

  if (isUsingMock) {
    const filename = sourceUrl.replace("/mock-uploads/", "");
    const tempVideoPath = path.join(process.cwd(), "public", "mock-uploads", filename);
    return {
      tempVideoPath,
      tempAudioPath: tempVideoPath.replace(/\.[^/.]+$/, ".mp3"),
      sourceStoragePath: "",
      isYoutube,
    };
  }

  const tempVideoPath = path.join(tempDir, `${uniqueId}-upload.mp4`);
  const tempAudioPath = path.join(tempDir, `${uniqueId}-upload.mp3`);
  const sourceStoragePath = getVideoStoragePath(sourceUrl);

  console.log("[WORKER] Baixando mídia do Supabase Storage para processamento local...");
  const { data: fileData, error: downloadErr } = await supabase.storage
    .from("videos")
    .download(sourceStoragePath);

  if (downloadErr || !fileData) {
    throw downloadErr || new Error("Falha ao baixar arquivo do storage");
  }

  const arrayBuffer = await fileData.arrayBuffer();
  fs.writeFileSync(tempVideoPath, Buffer.from(arrayBuffer));

  return { tempVideoPath, tempAudioPath, sourceStoragePath, isYoutube };
}

async function updateYoutubeMetadata(jobId: string, sourceUrl: string, fallbackName: string) {
  try {
    const info = await ytdl.getBasicInfo(sourceUrl, getYoutubeRequestOptions());
    const durationSec = parseInt(info.videoDetails.lengthSeconds) || 0;
    await supabase
      .from("jobs")
      .update({
        name: info.videoDetails.title || fallbackName,
        duration: durationSec,
      })
      .eq("id", jobId);
  } catch (e) {
    console.error("Falha ao obter metadados do YouTube:", e);
  }
}

async function transcribeAudio(job: WorkerJob, audioPath: string, duration: number): Promise<TranscriptionResult> {
  const settings = getSystemSettings();
  const selectedModel = job.asr_model || settings.model;

  if (selectedModel === "deepseek-asr") {
    const deepseekKey = getDeepseekApiKey();
    console.log(
      deepseekKey
        ? "[WORKER] DeepSeek API Key ativa. Usando transcrição simulada compatível com DeepSeek ASR."
        : "[WORKER] DeepSeek API Key não configurada. Simulando transcrição realista..."
    );
    await new Promise((resolve) => setTimeout(resolve, deepseekKey ? 3000 : 4000));
    return generateMockTranscription(job.name, duration || 60);
  }

  const openaiClient = getOpenaiClient();
  if (!openaiClient) {
    console.log("[WORKER] OpenAI API Key não configurada. Simulando transcrição realista...");
    await new Promise((resolve) => setTimeout(resolve, 4000));
    return generateMockTranscription(job.name, duration || 60);
  }

  console.log("[WORKER] Enviando áudio para OpenAI Whisper API...");
  return transcribeWithWhisper(audioPath, openaiClient);
}

async function saveTranscript(jobId: string, transcriptionResult: TranscriptionResult) {
  const { error } = await supabase
    .from("transcripts")
    .insert({
      id: jobId,
      raw_text: transcriptionResult.text,
      clean_text: transcriptionResult.text,
      summary: null,
      highlights: [],
      segments: transcriptionResult.segments,
    });

  if (error) throw error;
}

function cleanupTempFiles(tempVideoPath: string, tempAudioPath: string) {
  if (isUsingMock) return;

  try {
    if (tempVideoPath && fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
    if (tempAudioPath && fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
    console.log("[WORKER] Arquivos temporários limpos.");
  } catch (e) {
    console.error("Erro ao limpar arquivos temporários:", e);
  }
}

async function failJob(jobId: string, error: unknown) {
  const message = getErrorMessage(error, "Erro desconhecido durante o processamento");
  await supabase
    .from("jobs")
    .update({
      status: "failed",
      progress: 0,
      error_message: message,
    })
    .eq("id", jobId);

  triggerWebhook(jobId, "failed", message);
}

// Função principal de processamento de Jobs
export async function processJob(jobId: string) {
  console.log(`[WORKER] Iniciando processamento do Job ${jobId}`);

  let tempVideoPath = "";
  let tempAudioPath = "";

  try {
    const job = await getJob(jobId);

    await updateJobStatus(jobId, "processing_audio", 15);
    const media = await prepareMedia(job, jobId);
    tempVideoPath = media.tempVideoPath;
    tempAudioPath = media.tempAudioPath;

    await updateJobStatus(jobId, "processing_audio", 45);
    console.log(`[WORKER] Convertendo vídeo para áudio MP3 compacto (mono 16kHz): ${tempVideoPath} -> ${tempAudioPath}`);
    await convertVideoToAudio(tempVideoPath, tempAudioPath);

    if (!media.isYoutube && !isUsingMock && media.sourceStoragePath) {
      await deleteStoredVideo(media.sourceStoragePath);
    }

    const actualDuration = await getAudioDuration(tempAudioPath).catch(() => 0);
    if (actualDuration > 0) {
      await supabase.from("jobs").update({ duration: actualDuration }).eq("id", jobId);
    }

    await updateJobStatus(jobId, "transcribing", 70);
    const transcriptionResult = await transcribeAudio(job, tempAudioPath, actualDuration);

    await updateJobStatus(jobId, "post_processing", 90);
    await saveTranscript(jobId, transcriptionResult);

    await updateJobStatus(jobId, "completed", 100);
    console.log(`[WORKER] Job ${jobId} concluído com sucesso!`);
    triggerWebhook(jobId, "completed");
  } catch (error: unknown) {
    console.error(`[WORKER FAILED] Erro no processamento do Job ${jobId}:`, error);
    await failJob(jobId, error);
  } finally {
    cleanupTempFiles(tempVideoPath, tempAudioPath);
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
      }).catch((e: unknown) => {
        console.error(`[WEBHOOK ERROR] Falha no POST do Webhook:`, getErrorMessage(e));
      });
    }
  } catch (e: unknown) {
    console.error(`[WEBHOOK ERROR] Falha ao disparar webhook:`, getErrorMessage(e));
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
        quality: "highestaudio",
        ...getYoutubeRequestOptions()
      });
      
      const fileStream = fs.createWriteStream(outputPath);
      stream.pipe(fileStream);
      
      fileStream.on("finish", () => {
        console.log(`[YTDL] Download do áudio concluído em: ${outputPath}`);
        resolve();
      });
      
      stream.on("error", (err) => {
        reject(new Error(getYoutubeErrorMessage(err.message)));
      });
      
      fileStream.on("error", (err) => {
        reject(new Error(`Erro de escrita do arquivo de áudio: ${err.message}`));
      });
    } catch (e: unknown) {
      reject(e);
    }
  });
}

// Conversão do vídeo em áudio MP3 mono 16kHz, mantendo o arquivo pequeno para APIs de transcrição.
function convertVideoToAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-vn",              // Sem vídeo
        "-ac 1",            // 1 canal (mono)
        "-ar 16000",        // Taxa de amostragem de 16kHz
        "-codec:a libmp3lame",
        "-b:a 32k"
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
async function transcribeWithWhisper(audioPath: string, openaiClient: OpenAI): Promise<TranscriptionResult> {
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

  const rawResponse = response as { text: string; segments?: Array<Partial<TranscriptSegment> & { text?: string }> };
  const segments = (rawResponse.segments || []).map((seg, index) => ({
    id: typeof seg.id === "number" ? seg.id : index,
    start: typeof seg.start === "number" ? seg.start : 0,
    end: typeof seg.end === "number" ? seg.end : 0,
    text: (seg.text || "").trim()
  }));

  return {
    text: rawResponse.text,
    segments
  };
}

// Simulação de transcrição realista (Mock)
function generateMockTranscription(title: string, durationSec: number): TranscriptionResult {
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

  const segments: TranscriptSegment[] = [];
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
