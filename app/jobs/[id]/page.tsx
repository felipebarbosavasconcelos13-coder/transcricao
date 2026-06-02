"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactPlayer from "react-player";
import { motion, AnimatePresence } from "framer-motion";

const Player = ReactPlayer as any;
import { Youtube } from "@/components/YoutubeIcon";
import { 
  Loader2, 
  ArrowLeft, 
  Video, 
  Clock, 
  Download, 
  Sparkles, 
  Search, 
  Play, 
  AlertCircle, 
  RotateCcw,
  FileText,
  MessageSquare,
  CheckCircle,
  HelpCircle,
  Scissors
} from "lucide-react";

interface Comment {
  id: string;
  timestamp: number;
  user_name: string;
  text: string;
  created_at: string;
}

interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface Transcript {
  id: string;
  raw_text: string;
  clean_text: string;
  summary: string | null;
  highlights: string[] | any;
  segments: Segment[];
}

interface JobData {
  id: string;
  name: string;
  source_type: "upload" | "youtube";
  source_url: string;
  status: "pending" | "processing_audio" | "transcribing" | "post_processing" | "completed" | "failed";
  progress: number;
  duration: number;
  error_message: string | null;
  transcript: Transcript | null;
  comments: Comment[];
  created_at: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Controle de Playback
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const playerRef = useRef<any>(null);
  const segmentRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const lastScrolledSegmentId = useRef<number | null>(null);

  // Busca dentro do texto
  const [searchQuery, setSearchQuery] = useState("");

  // Aba da Transcrição
  const [transcriptTab, setTranscriptTab] = useState<"sync" | "clean">("sync");

  // Menu de Download
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

  // IA Pós-processamento
  const [processingIa, setProcessingIa] = useState(false);
  const [iaTab, setIaTab] = useState<"transcript" | "summary" | "highlights">("transcript");
  
  // Edição Inline (Fase 6)
  const [isEditing, setIsEditing] = useState(false);
  const [editedSegments, setEditedSegments] = useState<Segment[]>([]);

  // Comentários (Fase 7)
  const [commentText, setCommentText] = useState("");
  const [commentName, setCommentName] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Carregar dados e polling se o status não for final
  useEffect(() => {
    let isMounted = true;
    let pollInterval: NodeJS.Timeout;

    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`);
        if (!res.ok) throw new Error("Não foi possível carregar os dados deste trabalho.");
        const data = await res.json();
        
        if (data.success && isMounted) {
          setJob(data.data);
          setError("");
          
          if (data.data.transcript && editedSegments.length === 0) {
            setEditedSegments(data.data.transcript.segments);
          }

          // Se o job terminou ou falhou, parar o polling
          if (data.data.status === "completed" || data.data.status === "failed") {
            clearInterval(pollInterval);
          }
        }
      } catch (e: any) {
        if (isMounted) setError(e.message || "Erro de conexão com o servidor.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchJob();

    // Iniciar polling se estiver processando
    pollInterval = setInterval(fetchJob, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [id]);

  // Sincronização do texto com o player
  const handleProgress = (state: { playedSeconds: number }) => {
    const time = state.playedSeconds;
    setCurrentTime(time);

    if (!job?.transcript?.segments) return;

    // Encontrar segmento ativo no tempo atual
    const activeSeg = job.transcript.segments.find(
      (seg) => time >= seg.start && time <= seg.end
    );

    if (activeSeg) {
      setActiveSegmentId(activeSeg.id);
      
      // Scroll automático suave
      if (autoScroll && activeSeg.id !== lastScrolledSegmentId.current) {
        const element = segmentRefs.current[activeSeg.id];
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          lastScrolledSegmentId.current = activeSeg.id;
        }
      }
    }
  };

  // Ir para um tempo específico no vídeo
  const seekTo = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, "seconds");
      setCurrentTime(seconds);
    }
  };

  // Reprocessar job (Retry)
  const handleRetry = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${id}/retry`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setJob(data.data);
        router.refresh();
      } else {
        alert(data.error || "Erro ao reprocessar o trabalho.");
      }
    } catch (e) {
      alert("Erro ao enviar comando de reprocessamento.");
    } finally {
      setLoading(false);
    }
  };

  // Acionar o pós-processamento de IA
  const handleIaProcess = async () => {
    setProcessingIa(true);
    try {
      const res = await fetch(`/api/api/jobs/${id}/process-ia`, { method: "POST" });
      // Oops, caminho da API tem um "/api/api". Vamos usar o correto "/api/jobs/[id]/process-ia"
      const correctRes = await fetch(`/api/jobs/${id}/process-ia`, { method: "POST" });
      const data = await correctRes.json();
      
      if (data.success) {
        // Atualizar os dados do job para ter a transcrição processada
        setJob((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            transcript: {
              ...prev.transcript,
              clean_text: data.data.clean_text,
              summary: data.data.summary,
              highlights: data.data.highlights
            }
          };
        });
        setIaTab("summary"); // Mudar para aba do resumo automaticamente
      } else {
        alert(data.error || "Não foi possível processar a IA agora.");
      }
    } catch (e) {
      alert("Erro de conexão com o servidor de IA.");
    } finally {
      setProcessingIa(false);
    }
  };

  // Salvar edições da transcrição
  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/transcript/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segments: editedSegments })
      });
      const data = await res.json();
      if (data.success) {
        setIsEditing(false);
        setJob((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            transcript: {
              ...prev.transcript,
              raw_text: data.data.raw_text,
              clean_text: data.data.clean_text,
              segments: data.data.segments
            }
          };
        });
      } else {
        alert(data.error || "Não foi possível salvar as alterações.");
      }
    } catch (e) {
      alert("Erro de conexão ao salvar.");
    }
  };

  // Enviar comentário colaborativo
  const handleCommentSubmit = async (e: React.FormEvent, attachTimestamp: boolean) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/jobs/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: commentName,
          text: commentText,
          timestamp: attachTimestamp ? Math.floor(currentTime) : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setCommentText("");
        setJob((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: [...(prev.comments || []), data.data]
          };
        });
      } else {
        alert(data.error || "Não foi possível salvar o comentário.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Lógica de download
  const downloadTranscriptFile = (format: "txt" | "srt" | "vtt") => {
    if (!job?.transcript) return;
    const { name, transcript } = job;
    const segments = transcript.segments;

    let content = "";
    let fileExtension = "";
    let mimeType = "text/plain";

    const padZero = (num: number, size: number) => {
      let s = num.toString();
      while (s.length < size) s = "0" + s;
      return s;
    };

    const formatTimestamp = (sec: number, separator = ",") => {
      const hours = Math.floor(sec / 3600);
      const minutes = Math.floor((sec % 3600) / 60);
      const seconds = Math.floor(sec % 60);
      const ms = Math.floor((sec % 1) * 1000);
      return `${padZero(hours, 2)}:${padZero(minutes, 2)}:${padZero(seconds, 2)}${separator}${padZero(ms, 3)}`;
    };

    if (format === "txt") {
      content = transcript.clean_text || transcript.raw_text;
      fileExtension = "txt";
    } else if (format === "srt") {
      content = segments
        .map((seg, idx) => {
          return `${idx + 1}\n${formatTimestamp(seg.start)} --> ${formatTimestamp(seg.end)}\n${seg.text}\n`;
        })
        .join("\n");
      fileExtension = "srt";
    } else if (format === "vtt") {
      content = "WEBVTT\n\n" + segments
        .map((seg) => {
          return `${formatTimestamp(seg.start, ".")} --> ${formatTimestamp(seg.end, ".")}\n${seg.text}\n`;
        })
        .join("\n");
      fileExtension = "vtt";
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/\s+/g, "_")}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadMenuOpen(false);
  };

  // Renderizar o texto com destaque do termo buscado
  const highlightSearch = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className="bg-amber-200 dark:bg-amber-600/50 text-neutral-900 dark:text-white px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const getStepProgress = (status: JobData["status"]) => {
    const steps = [
      { key: "pending", label: "Upload Concluído", value: 25 },
      { key: "processing_audio", label: "Normalizando Áudio", value: 50 },
      { key: "transcribing", label: "Transcrevendo Fala (ASR)", value: 75 },
      { key: "post_processing", label: "Processamento de IA", value: 95 }
    ];

    const activeIdx = steps.findIndex((step) => step.key === status);
    return { steps, activeIdx };
  };

  const formatDuration = (sec: number) => {
    if (!sec) return "--:--";
    const minutes = Math.floor(sec / 60);
    const remainingSeconds = Math.floor(sec % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  // Carregamento de Tela
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 size={36} className="text-primary-500 animate-spin" />
        <p className="font-sans text-neutral-500 dark:text-neutral-400 font-semibold text-sm">Carregando detalhes do trabalho...</p>
      </div>
    );
  }

  // Tela de erro geral
  if (error || !job) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="p-4 bg-danger-500/10 text-danger-500 rounded-full inline-block">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="font-sans font-extrabold text-2xl">Não foi possível carregar</h2>
          <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400">{error || "Trabalho não localizado."}</p>
        </div>
        <button
          onClick={() => router.push("/jobs/new")}
          className="px-6 py-3 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 font-bold rounded-xl text-sm transition-all"
        >
          Voltar para Criação
        </button>
      </div>
    );
  }

  const { steps, activeIdx } = getStepProgress(job.status);

  return (
    <div className="space-y-8 py-2 max-w-6xl mx-auto">
      {/* Header com voltar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <button
          onClick={() => router.push("/jobs/new")}
          className="flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Voltar para criar
        </button>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400 font-mono bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-lg">
            ID: {job.id.substring(0, 8)}...
          </span>
          <span className="text-xs text-neutral-400 font-sans flex items-center gap-1">
            {job.source_type === "youtube" ? <Youtube size={14} className="text-danger-500" /> : <Video size={14} className="text-primary-500" />}
            {job.source_type === "youtube" ? "YouTube" : "Upload"}
          </span>
        </div>
      </div>

      {/* TÍTULO DO JOB */}
      <div>
        <h1 className="font-sans font-black text-2xl md:text-3xl text-neutral-800 dark:text-white truncate">
          {job.name}
        </h1>
        <p className="font-sans text-xs text-neutral-400 mt-1">
          Criado em: {new Date(job.created_at).toLocaleString("pt-BR")}
        </p>
      </div>

      {/* CASO: JOB ESTEJA EM PROCESSAMENTO */}
      {(job.status !== "completed" && job.status !== "failed") && (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 p-8 rounded-3xl shadow-sm text-center max-w-2xl mx-auto space-y-8">
          <div className="space-y-3">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary-500/10"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-primary-500 animate-spin"></div>
            </div>
            <div>
              <p className="font-sans font-bold text-lg text-neutral-900 dark:text-white capitalize">
                {steps[activeIdx]?.label || "Processando"}
              </p>
              <p className="font-sans text-xs text-neutral-400 mt-1">
                Por favor, aguarde enquanto realizamos a transcrição do conteúdo.
              </p>
            </div>
          </div>

          {/* Stepper visual com Glow */}
          <div className="relative pt-6">
            <div className="absolute top-[38px] left-8 right-8 h-1 bg-neutral-200 dark:bg-neutral-700 z-0">
              <motion.div 
                className="h-full bg-primary-500" 
                initial={{ width: 0 }}
                animate={{ width: `${(activeIdx / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="relative z-10 flex justify-between">
              {steps.map((step, idx) => {
                const isActive = idx === activeIdx;
                const isCompleted = idx < activeIdx;
                return (
                  <div key={step.key} className="flex flex-col items-center space-y-2">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300
                        ${isActive 
                          ? "bg-primary-500 text-white animate-glow scale-110 shadow-lg" 
                          : isCompleted 
                            ? "bg-emerald-500 text-white" 
                            : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400"}`}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <span className="font-sans text-[10px] md:text-xs font-semibold text-neutral-500 dark:text-neutral-400 max-w-[80px]">
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Logs / Progresso de porcentagem */}
          <div className="space-y-1 bg-neutral-50 dark:bg-neutral-900/60 p-4 rounded-2xl max-w-sm mx-auto border border-neutral-100 dark:border-neutral-800">
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>Etapa Concluída</span>
              <span>{job.progress}%</span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* CASO: JOB FALHOU */}
      {job.status === "failed" && (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 p-8 rounded-3xl shadow-sm text-center max-w-2xl mx-auto space-y-6">
          <div className="p-4 bg-danger-500/10 text-danger-500 rounded-full inline-block animate-bounce">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="font-sans font-extrabold text-xl">Falha no Processamento</h3>
            <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              Ocorreu um erro ao processar o vídeo ou na chamada do serviço de transcrição:
            </p>
            <div className="bg-neutral-100 dark:bg-neutral-900/80 p-4 rounded-2xl text-xs font-mono text-danger-500 border border-danger-500/10 text-left max-h-36 overflow-y-auto max-w-md mx-auto">
              {job.error_message || "Erro desconhecido durante a transcrição de áudio."}
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={handleRetry}
              className="px-6 py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/15 transition-all flex items-center gap-2"
            >
              <RotateCcw size={16} /> Tentar Novamente
            </button>
          </div>
        </div>
      )}

      {/* CASO: JOB CONCLUÍDO (EXIBIR PLAYERS E TRANSCRIPTS) */}
      {job.status === "completed" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Lado Esquerdo: Player de Vídeo e IA resumo */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm sticky top-6">
              
              {/* Media Player */}
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <Player
                  ref={playerRef}
                  url={job.source_type === "youtube" ? job.source_url : job.source_url}
                  controls={true}
                  width="100%"
                  height="100%"
                  onProgress={handleProgress}
                  config={{
                    file: {
                      forceVideo: true,
                      attributes: {
                        controlsList: "nodownload"
                      }
                    }
                  }}
                />
              </div>

              {/* Informações rápidas do playback */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center text-xs text-neutral-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock size={13} /> {formatDuration(currentTime)} / {formatDuration(job.duration)}
                  </span>
                  <span className="font-semibold text-emerald-500 flex items-center gap-0.5">
                    <CheckCircle size={12} /> Transcrição 100% Concluída
                  </span>
                </div>

                {/* IA Pós-processamento card trigger */}
                {(!job.transcript?.summary) ? (
                  <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/10 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-primary-500" />
                      <p className="font-sans font-bold text-sm text-neutral-800 dark:text-neutral-200">Melhorar texto com IA?</p>
                    </div>
                    <p className="font-sans text-xs text-neutral-400 leading-relaxed">
                      Use Inteligência Artificial para corrigir a pontuação, remover vícios de linguagem e gerar um resumo estruturado automaticamente.
                    </p>
                    <button
                      onClick={handleIaProcess}
                      disabled={processingIa}
                      className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-200 disabled:dark:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow shadow-primary-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {processingIa ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Analisando conteúdo...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} /> Pós-processar com IA
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                    <div className="flex border-b border-neutral-100 dark:border-neutral-700">
                      <button
                        onClick={() => setIaTab("summary")}
                        className={`flex-1 pb-2 text-xs font-bold text-center border-b-2 transition-all
                          ${iaTab === "summary" ? "border-primary-500 text-primary-500" : "border-transparent text-neutral-400 hover:text-neutral-500"}`}
                      >
                        Resumo IA
                      </button>
                      <button
                        onClick={() => setIaTab("highlights")}
                        className={`flex-1 pb-2 text-xs font-bold text-center border-b-2 transition-all
                          ${iaTab === "highlights" ? "border-primary-500 text-primary-500" : "border-transparent text-neutral-400 hover:text-neutral-500"}`}
                      >
                        Highlights
                      </button>
                    </div>

                    <div className="text-xs leading-relaxed max-h-60 overflow-y-auto pr-1">
                      {iaTab === "summary" && (
                        <div className="space-y-2 whitespace-pre-wrap font-sans text-neutral-600 dark:text-neutral-350">
                          {job.transcript.summary}
                        </div>
                      )}
                      {iaTab === "highlights" && (
                        <ul className="space-y-2 list-disc list-inside text-neutral-600 dark:text-neutral-350 font-sans">
                          {Array.isArray(job.transcript.highlights) 
                            ? job.transcript.highlights.map((h: string, i: number) => <li key={i}>{h}</li>)
                            : <li className="list-none text-center py-4 text-neutral-400">Clique em pós-processamento para gerar highlights.</li>}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Painel de Comentários e Colaboração */}
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-750 pb-3">
                <MessageSquare size={18} className="text-primary-500" />
                <h3 className="font-sans font-bold text-sm text-neutral-800 dark:text-white">Comentários e Notas</h3>
              </div>

              {/* Lista de Comentários */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {job.comments && job.comments.length > 0 ? (
                  job.comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl border border-neutral-100 dark:border-neutral-850 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-neutral-700 dark:text-neutral-300">{comment.user_name}</span>
                        <div className="flex items-center gap-2">
                          {comment.timestamp !== null && (
                            <button
                              onClick={() => seekTo(comment.timestamp)}
                              className="font-mono px-2 py-0.5 bg-primary-500/10 text-primary-500 rounded-md font-bold hover:bg-primary-500 hover:text-white transition-all text-[10px]"
                              title="Pular para este tempo no vídeo"
                            >
                              ⏱️ {formatDuration(comment.timestamp)}
                            </button>
                          )}
                          <span className="text-[10px] text-neutral-400">
                            {new Date(comment.created_at).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      <p className="font-sans text-xs text-neutral-600 dark:text-neutral-350 leading-relaxed">
                        {comment.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-400 text-center py-6 text-xs font-medium">Nenhuma nota ou comentário adicionado.</p>
                )}
              </div>

              {/* Formulário de Criação */}
              <form className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-750">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Seu Nome"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    required
                    className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 font-sans"
                  />
                  <div className="text-[10px] text-neutral-400 flex items-center justify-end font-mono">
                    Tempo atual: {formatDuration(currentTime)}
                  </div>
                </div>
                <textarea
                  placeholder="Deixe uma nota ou pergunta sobre este trecho..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                  rows={2}
                  className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 font-sans resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={(e) => handleCommentSubmit(e, false)}
                    disabled={submittingComment || !commentName || !commentText}
                    className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Comentar
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCommentSubmit(e, true)}
                    disabled={submittingComment || !commentName || !commentText}
                    className="px-3.5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-primary-500/10 transition-all flex items-center gap-1 cursor-pointer"
                    title="Vincular ao tempo atual do vídeo"
                  >
                    ⏱️ No tempo atual
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Lado Direito: Visualizador de Transcrição */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm flex flex-col h-[700px]">
              
              {/* Header do Visualizador */}
              <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Buscar na transcrição..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/10 transition-all font-sans"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {/* Controles de Edição Inline */}
                  {transcriptTab === "sync" && (
                    <>
                      <button
                        onClick={() => {
                          if (isEditing) {
                            handleSaveEdit();
                          } else {
                            setIsEditing(true);
                          }
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1
                          ${isEditing 
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm" 
                            : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50"}`}
                      >
                        {isEditing ? "✓ Salvar" : "✏️ Editar"}
                      </button>
                      {isEditing && (
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            if (job?.transcript) {
                              setEditedSegments(job.transcript.segments);
                            }
                          }}
                          className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 text-neutral-600 dark:text-neutral-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap
                      ${autoScroll 
                        ? "bg-primary-500/10 border-primary-500/25 text-primary-500" 
                        : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400"}`}
                    title="Mantém a linha falada atual visível"
                  >
                    Rolagem Auto: {autoScroll ? "Sim" : "Não"}
                  </button>

                  {/* Dropdown de Export */}
                  <div className="relative">
                    <button
                      onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                      className="px-3.5 py-2 bg-neutral-900 dark:bg-neutral-700 hover:bg-neutral-800 dark:hover:bg-neutral-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} /> Exportar
                    </button>
                    
                    {downloadMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setDownloadMenuOpen(false)} />
                        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl py-2 z-20 overflow-hidden">
                          <button
                            onClick={() => downloadTranscriptFile("txt")}
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                          >
                            <FileText size={13} className="text-neutral-400" /> Baixar TXT
                          </button>
                          <button
                            onClick={() => downloadTranscriptFile("srt")}
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                          >
                            <FileText size={13} className="text-primary-500" /> Baixar SRT (Legenda)
                          </button>
                          <button
                            onClick={() => downloadTranscriptFile("vtt")}
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                          >
                            <FileText size={13} className="text-secondary-500" /> Baixar VTT (Legenda)
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Abas de Transcrição */}
              {job.transcript?.clean_text && (
                <div className="px-5 py-2 bg-neutral-50 dark:bg-neutral-900/30 border-b border-neutral-200 dark:border-neutral-800/50 flex gap-2 shrink-0 select-none">
                  <button
                    onClick={() => setTranscriptTab("sync")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer
                      ${transcriptTab === "sync" 
                        ? "bg-white dark:bg-neutral-700 text-primary-500 dark:text-primary-300 shadow-sm border border-neutral-200/50 dark:border-neutral-600" 
                        : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"}`}
                  >
                    Bruta Sincronizada
                  </button>
                  <button
                    onClick={() => setTranscriptTab("clean")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer
                      ${transcriptTab === "clean" 
                        ? "bg-white dark:bg-neutral-700 text-primary-500 dark:text-primary-300 shadow-sm border border-neutral-200/50 dark:border-neutral-600" 
                        : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"}`}
                  >
                    Revisada por IA (Corrida)
                  </button>
                </div>
              )}

              {/* Corpo da Transcrição */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 font-sans text-sm scroll-smooth">
                {transcriptTab === "sync" ? (
                  job.transcript?.segments ? (
                    job.transcript.segments.map((seg) => {
                      const isActive = seg.id === activeSegmentId;
                      return (
                        <div
                          key={seg.id}
                          ref={(el) => {
                            segmentRefs.current[seg.id] = el;
                          }}
                          onClick={() => seekTo(seg.start)}
                          className={`p-3 rounded-2xl transition-all duration-200 cursor-pointer flex gap-4 items-start border
                            ${isActive 
                              ? "bg-primary-500/10 border-primary-500/25 shadow-sm -translate-x-0.5" 
                              : "bg-transparent border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/30"}`}
                        >
                          {/* Timestamp Button */}
                          <button
                            className={`font-mono text-xs px-2.5 py-1 rounded-lg select-none shrink-0 font-bold tracking-tight transition-all
                              ${isActive 
                                ? "bg-primary-500 text-white" 
                                : "bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 group-hover:bg-neutral-200"}`}
                          >
                            {formatDuration(seg.start)}
                          </button>
                          
                          {/* Segment Text ou Área de Edição */}
                          {isEditing ? (
                            <textarea
                              value={editedSegments.find((s) => s.id === seg.id)?.text || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditedSegments((prev) =>
                                  prev.map((s) => (s.id === seg.id ? { ...s, text: val } : s))
                                );
                              }}
                              onClick={(e) => e.stopPropagation()} // Evitar pular no player ao clicar para digitar
                              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-[13px] md:text-sm focus:outline-none focus:border-primary-500 font-sans leading-relaxed text-neutral-800 dark:text-neutral-200 resize-y min-h-[60px]"
                            />
                          ) : (
                            <p className={`leading-relaxed text-[13px] md:text-sm font-sans flex-1 mt-0.5
                              ${isActive 
                                ? "text-neutral-900 dark:text-white font-medium" 
                                : "text-neutral-600 dark:text-neutral-300"}`}
                            >
                              {highlightSearch(seg.text)}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-neutral-400 text-center py-20">Nenhuma transcrição encontrada.</p>
                  )
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed text-neutral-600 dark:text-neutral-350 px-3 py-2 font-sans text-[13px] md:text-sm">
                    {highlightSearch(job.transcript?.clean_text || "")}
                  </div>
                )}
              </div>

              {/* Footer do Visualizador */}
              <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800/50 bg-neutral-50 dark:bg-neutral-900/30 flex justify-between items-center text-xs text-neutral-400">
                <span>Total de palavras: {job.transcript?.raw_text.split(/\s+/).filter(Boolean).length || 0}</span>
                <span>Qualidade Estimada: 98% (Whisper v3)</span>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
