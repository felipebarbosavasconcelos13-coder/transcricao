"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { getLocalPreferences } from "@/lib/localPreferences";
import { getErrorMessage } from "@/lib/jobPreferences";
import { Youtube } from "@/components/YoutubeIcon";
import { 
  Upload, 
  ArrowRight, 
  File as FileIcon, 
  AlertCircle, 
  Loader2,
  Clock,
  Play,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface RecentJob {
  id: string;
  name: string;
  source_type: "upload" | "youtube";
  status: "pending" | "processing_audio" | "transcribing" | "post_processing" | "completed" | "failed";
  progress: number;
  duration: number;
  created_at: string;
}

export default function NewJobPage() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<"upload" | "youtube">("upload");
  const [ytUrl, setYtUrl] = useState("");
  const [ytUrlError, setYtUrlError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [uploadStage, setUploadStage] = useState("");

  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  async function fetchRecentJobs() {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (data.success) {
        setRecentJobs(data.data.slice(0, 4)); // Pegar apenas os 4 últimos
      }
    } catch (e) {
      console.error("Erro ao buscar trabalhos recentes:", e);
    } finally {
      setLoadingRecent(false);
    }
  }

  // Buscar trabalhos recentes
  useEffect(() => {
    const refresh = () => {
      void fetchRecentJobs();
    };
    const initialLoad = setTimeout(refresh, 0);
    const interval = setInterval(refresh, 5000); // Polling leve para ver progresso dos recentes
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, []);

  const extractAudioFile = (videoFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const objectUrl = URL.createObjectURL(videoFile);
      const chunks: BlobPart[] = [];
      let recorder: MediaRecorder | null = null;
      let audioContext: AudioContext | null = null;

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
        video.pause();
        video.src = "";
        audioContext?.close().catch(() => undefined);
      };

      video.preload = "auto";
      video.playsInline = true;
      video.src = objectUrl;

      video.ontimeupdate = () => {
        if (Number.isFinite(video.duration) && video.duration > 0) {
          setUploadProgress(Math.min(70, Math.max(5, Math.round((video.currentTime / video.duration) * 70))));
        }
      };

      video.onerror = () => {
        cleanup();
        reject(new Error("Não foi possível ler o vídeo no navegador."));
      };

      video.onloadedmetadata = async () => {
        try {
          const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (!AudioContextConstructor) {
            throw new Error("Seu navegador não suporta extração local de áudio. Tente Chrome/Edge ou use link do YouTube.");
          }

          audioContext = new AudioContextConstructor();
          await audioContext.resume();

          const source = audioContext.createMediaElementSource(video);
          const destination = audioContext.createMediaStreamDestination();
          source.connect(destination);

          const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm";

          recorder = new MediaRecorder(destination.stream, {
            mimeType,
            audioBitsPerSecond: 32000
          });

          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) chunks.push(event.data);
          };

          recorder.onerror = () => {
            cleanup();
            reject(new Error("Falha ao gravar o áudio extraído."));
          };

          recorder.onstop = () => {
            cleanup();
            const audioBlob = new Blob(chunks, { type: "audio/webm" });
            const baseName = videoFile.name.replace(/\.[^/.]+$/, "");
            resolve(new File([audioBlob], `${baseName}.webm`, { type: "audio/webm" }));
          };

          video.onended = () => {
            if (recorder?.state === "recording") recorder.stop();
          };

          recorder.start(1000);
          await video.play();
        } catch (error) {
          cleanup();
          reject(error);
        }
      };
    });
  };

  // Validar URL do YouTube
  const validateYoutubeUrl = (url: string) => {
    if (!url) {
      setYtUrlError("");
      return false;
    }
    // Verificação simples de domínios youtube ou youtu.be
    const hasDomain = url.includes("youtube.com") || url.includes("youtu.be");
    
    if (hasDomain) {
      setYtUrlError("");
      return true;
    } else {
      setYtUrlError("Insira um link válido do YouTube (ex: youtube.com/watch?v=...)");
      return false;
    }
  };

  const handleYtUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setYtUrl(val);
    if (val) validateYoutubeUrl(val);
    else setYtUrlError("");
  };

  // Eventos de Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Validar tipo de arquivo (vídeo)
      if (file.type.startsWith("video/")) {
        setSelectedFile(file);
        setUploadError("");
      } else {
        setUploadError("Por favor, selecione apenas arquivos de vídeo (mp4, mov, mkv, etc.)");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("video/")) {
        setSelectedFile(file);
        setUploadError("");
      } else {
        setUploadError("Por favor, selecione apenas arquivos de vídeo.");
      }
    }
  };

  // Enviar link do YouTube para transcrever
  const handleYtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateYoutubeUrl(ytUrl)) return;

    setUploading(true);
    setUploadError("");

    try {
      const preferences = getLocalPreferences();
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Vídeo do YouTube",
          sourceType: "youtube",
          sourceUrl: ytUrl,
          asrModel: preferences.asrModel,
          language: preferences.language,
          duration: 0
        })
      });

      const data = await res.json();
      if (data.success) {
        // Redirecionar para a tela de progresso do Job
        router.push(`/jobs/${data.data.id}`);
      } else {
        setUploadError(data.error || "Ocorreu um erro ao criar o job.");
        setUploading(false);
      }
    } catch {
      setUploadError("Erro de conexão com o servidor.");
      setUploading(false);
    }
  };

  // Enviar arquivo local para upload e transcrever
  const handleFileUploadSubmit = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError("");
    setUploadStage("Extraindo áudio no navegador...");
    setUploadProgress(5);

    try {
      const preferences = getLocalPreferences();
      // 1. Extrair e comprimir o áudio no navegador. O vídeo original nunca é enviado.
      const audioFile = await extractAudioFile(selectedFile);
      const maxUploadSizeMb = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB || "50");
      const maxUploadSizeBytes = maxUploadSizeMb * 1024 * 1024;
      if (audioFile.size > maxUploadSizeBytes) {
        throw new Error(`Áudio extraído ainda ficou grande demais (${(audioFile.size / (1024 * 1024)).toFixed(2)} MB). O limite atual é ${maxUploadSizeMb} MB.`);
      }

      setUploadStage("Enviando áudio extraído...");
      setUploadProgress(75);

      // 2. Preparar URL assinada no backend e enviar apenas o áudio direto ao Supabase.
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: audioFile.name, contentType: audioFile.type, fileSize: audioFile.size })
      });
      const uploadResult = await signRes.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Erro ao preparar upload do arquivo.");
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase não configurado no frontend.");
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .uploadToSignedUrl(uploadResult.storagePath, uploadResult.token, audioFile);

      if (uploadError) {
        throw uploadError;
      }

      setUploadStage("Criando transcrição...");
      setUploadProgress(95);

      // 3. Criar o job no banco de dados apontando para o áudio extraído.
      const jobRes = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedFile.name,
          sourceType: "upload",
          sourceUrl: uploadResult.storagePath,
          asrModel: preferences.asrModel,
          language: preferences.language,
          duration: 0
        })
      });

      const jobData = await jobRes.json();
      if (jobData.success) {
        setUploadProgress(100);
        router.push(`/jobs/${jobData.data.id}`);
      } else {
        throw new Error(jobData.error || "Erro ao iniciar o job.");
      }

    } catch (e: unknown) {
      console.error(e);
      setUploadError(getErrorMessage(e, "Erro no processamento do upload."));
      setUploading(false);
      setUploadStage("");
      setUploadProgress(0);
    }
  };

  const getStatusBadge = (status: RecentJob["status"]) => {
    switch (status) {
      case "completed":
        return <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full"><CheckCircle2 size={12} /> Concluído</span>;
      case "failed":
        return <span className="flex items-center gap-1 text-[11px] font-bold text-danger-500 bg-danger-500/10 px-2.5 py-1 rounded-full"><XCircle size={12} /> Falhou</span>;
      case "pending":
      case "processing_audio":
      case "transcribing":
      case "post_processing":
        return <span className="flex items-center gap-1 text-[11px] font-bold text-primary-500 bg-primary-500/10 px-2.5 py-1 rounded-full animate-pulse"><Loader2 size={12} className="animate-spin" /> Processando</span>;
    }
  };

  const formatDuration = (sec: number) => {
    if (!sec) return "--:--";
    const minutes = Math.floor(sec / 60);
    const remainingSeconds = Math.floor(sec % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Title Header */}
      <div>
        <h1 className="font-sans font-extrabold text-3xl md:text-4xl tracking-tight bg-gradient-to-r from-neutral-900 via-primary-700 to-primary-500 dark:from-white dark:via-primary-300 dark:to-secondary-400 bg-clip-text text-transparent">
          Iniciar Nova Transcrição
        </h1>
        <p className="font-sans text-neutral-500 dark:text-neutral-400 mt-2 text-sm md:text-base">
          Envie um arquivo de vídeo ou cole um link do YouTube para transcrever e obter insights por inteligência artificial.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-neutral-200/50 dark:bg-neutral-800/40 p-1.5 rounded-2xl w-full max-w-sm">
        <button
          onClick={() => { if (!uploading) setSourceType("upload"); }}
          disabled={uploading}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
            ${sourceType === "upload" 
              ? "bg-white dark:bg-neutral-700 shadow text-neutral-950 dark:text-white" 
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"}`}
        >
          <Upload size={16} />
          Upload de Arquivo
        </button>
        <button
          onClick={() => { if (!uploading) setSourceType("youtube"); }}
          disabled={uploading}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
            ${sourceType === "youtube" 
              ? "bg-white dark:bg-neutral-700 shadow text-neutral-950 dark:text-white" 
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"}`}
        >
          <Youtube size={16} />
          Link do YouTube
        </button>
      </div>

      {/* Main Form Area */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {sourceType === "upload" ? (
            <motion.div
              key="upload-pane"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => !uploading && document.getElementById("file-input")?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 md:p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group
                  ${dragActive 
                    ? "border-primary-500 bg-primary-500/5 -translate-y-1.5 shadow-lg shadow-primary-500/10" 
                    : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/40 hover:border-primary-400 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/80 hover:-translate-y-1 hover:shadow-md"}`}
              >
                <input
                  type="file"
                  id="file-input"
                  className="hidden"
                  accept="video/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />

                {uploading ? (
                  <div className="space-y-6 w-full max-w-md mx-auto">
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 rounded-full border-4 border-primary-500/20"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-t-primary-500 animate-spin"></div>
                    </div>
                    <div className="space-y-2">
                      <p className="font-sans font-bold text-lg">{uploadStage || "Processando arquivo..."}</p>
                      <p className="font-sans text-xs text-neutral-400 truncate">{selectedFile?.name}</p>
                    </div>
                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-neutral-400 px-1 font-mono">
                        <span>Progresso</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-primary-500 to-secondary-400 rounded-full animate-shimmer shimmer-bg"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary-500/10 text-primary-500 rounded-2xl inline-block">
                      <FileIcon size={36} />
                    </div>
                    <div>
                      <p className="font-sans font-bold text-lg text-neutral-900 dark:text-white max-w-md truncate mx-auto">
                        {selectedFile.name}
                      </p>
                      <p className="font-sans text-xs text-neutral-400 mt-1 font-mono">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex gap-3 justify-center pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-xl text-sm font-semibold transition-colors"
                      >
                        Remover
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileUploadSubmit();
                        }}
                        className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold shadow shadow-primary-500/20 transition-all flex items-center gap-1.5"
                      >
                        Enviar Vídeo <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-2xl text-neutral-400 dark:text-neutral-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors mb-4">
                      <Upload size={32} className="group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <p className="font-sans font-bold text-base md:text-lg text-neutral-700 dark:text-neutral-300">
                      Arraste e solte o arquivo de vídeo aqui
                    </p>
                    <p className="font-sans text-xs text-neutral-400 mt-2 max-w-xs mx-auto">
                      ou clique para procurar em seu dispositivo. Suporta MP4, MOV, MKV de até 100MB no MVP.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="yt-pane"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <form onSubmit={handleYtSubmit} className="space-y-4">
                <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="p-3 bg-danger-500/10 text-danger-500 rounded-2xl shrink-0">
                    <Youtube size={26} />
                  </div>
                  <div className="flex-1 w-full space-y-1">
                    <label className="font-sans font-bold text-sm text-neutral-700 dark:text-neutral-300">
                      Link do Vídeo do YouTube
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={ytUrl}
                      onChange={handleYtUrlChange}
                      disabled={uploading}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all font-sans"
                    />
                    {ytUrlError && (
                      <p className="text-xs text-danger-500 font-sans flex items-center gap-1 mt-1">
                        <AlertCircle size={12} /> {ytUrlError}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={uploading || !ytUrl || !!ytUrlError}
                    className="w-full md:w-auto px-6 py-3.5 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-200 disabled:dark:bg-neutral-800 disabled:text-neutral-400 text-white rounded-xl text-sm font-bold shadow shadow-primary-500/15 transition-all shrink-0 flex items-center justify-center gap-2 active:scale-95 cursor-pointer mt-1 md:mt-6"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Processando...
                      </>
                    ) : (
                      <>
                        Iniciar Transcrição <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Error Pane */}
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-danger-500/10 border border-danger-500/20 text-danger-500 rounded-2xl flex items-start gap-3"
          >
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-sans font-bold text-sm">Ocorreu um problema</p>
              <p className="font-sans text-xs opacity-90 mt-0.5">{uploadError}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Recent Jobs History list */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-800 dark:text-neutral-200">
            Trabalhos Recentes
          </h2>
          <button 
            onClick={() => router.push("/history")}
            className="font-sans text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors"
          >
            Ver tudo
          </button>
        </div>

        {loadingRecent ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="text-neutral-400 animate-spin" />
          </div>
        ) : recentJobs.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-800/80 p-8 text-center rounded-3xl">
            <Clock size={28} className="mx-auto text-neutral-400 mb-2" />
            <p className="font-sans text-sm text-neutral-400 font-medium">Nenhum trabalho criado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentJobs.map((job) => (
              <div 
                key={job.id}
                onClick={() => router.push(`/jobs/${job.id}`)}
                className="bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-800/80 p-5 rounded-2xl hover:shadow-md hover:border-primary-300 dark:hover:border-neutral-700 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-3">
                    <p className="font-sans font-bold text-sm text-neutral-800 dark:text-neutral-200 truncate flex-1 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                      {job.name}
                    </p>
                    {getStatusBadge(job.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-neutral-400 font-sans">
                    <span className="flex items-center gap-1 capitalize">
                      {job.source_type === "youtube" ? (
                        <Youtube size={14} className="text-danger-500" />
                      ) : (
                        <FileIcon size={14} className="text-primary-500" />
                      )}
                      {job.source_type}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {formatDuration(job.duration)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
                  <span className="font-mono">
                    {new Date(job.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                  <span className="font-semibold text-primary-500 group-hover:translate-x-1.5 transition-transform flex items-center gap-0.5">
                    Abrir <Play size={10} className="fill-current" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
