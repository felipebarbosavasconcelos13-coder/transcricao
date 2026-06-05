"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Copy,
  Check,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface Transcript {
  id: string;
  raw_text: string;
  clean_text: string;
}

interface JobData {
  id: string;
  name: string;
  status: "pending" | "processing_audio" | "transcribing" | "post_processing" | "completed" | "failed";
  progress: number;
  error_message: string | null;
  transcript: Transcript | null;
  created_at: string;
}

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function statusLabel(status: JobData["status"]) {
  switch (status) {
    case "pending":
      return "Aguardando processamento";
    case "processing_audio":
      return "Extraindo áudio";
    case "transcribing":
      return "Transcrevendo";
    case "post_processing":
      return "Finalizando";
    case "completed":
      return "Concluído";
    case "failed":
      return "Falhou";
  }
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingIa, setProcessingIa] = useState(false);
  const [copiedPanel, setCopiedPanel] = useState<string | null>(null);

  const handleCopy = useCallback(async (text: string, panelId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPanel(panelId);
      setTimeout(() => setCopiedPanel(null), 2000);
    } catch {
      // Fallback para navegadores mais antigos
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedPanel(panelId);
      setTimeout(() => setCopiedPanel(null), 2000);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const pollInterval = setInterval(fetchJob, 3000);

    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Não foi possível carregar este trabalho.");

        const data = await res.json();
        if (data.success && isMounted) {
          setJob(data.data);
          setError("");

          if (data.data.status === "completed" || data.data.status === "failed") {
            clearInterval(pollInterval);
          }
        }
      } catch (e: unknown) {
        if (isMounted) setError(e instanceof Error ? e.message : "Erro de conexão com o servidor.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchJob();

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [id]);

  async function handleRetry() {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${id}/retry`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setJob(data.data);
        router.refresh();
      } else {
        setError(data.error || "Erro ao reprocessar o trabalho.");
      }
    } catch {
      setError("Erro ao enviar comando de reprocessamento.");
    } finally {
      setLoading(false);
    }
  }

  async function handleIaProcess() {
    setProcessingIa(true);
    try {
      const res = await fetch(`/api/jobs/${id}/process-ia`, { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setJob((prev) => {
          if (!prev?.transcript) return prev;
          return {
            ...prev,
            transcript: {
              ...prev.transcript,
              clean_text: data.data.clean_text,
            },
          };
        });
      } else {
        setError(data.error || "Não foi possível revisar a transcrição com IA.");
      }
    } catch {
      setError("Erro de conexão com o servidor de IA.");
    } finally {
      setProcessingIa(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 size={36} className="text-primary-500 animate-spin" />
        <p className="font-sans text-sm font-semibold text-neutral-500 dark:text-neutral-400">Carregando transcrição...</p>
      </div>
    );
  }

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
          Voltar
        </button>
      </div>
    );
  }

  const rawText = job.transcript?.raw_text || "";
  const cleanText = job.transcript?.clean_text || "";
  const hasReviewedText = cleanText && cleanText !== rawText;

  return (
    <div className="max-w-6xl mx-auto py-2 md:py-6 space-y-7">
      <button
        onClick={() => router.push("/jobs/new")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      <header className="space-y-2 border-b border-neutral-200 dark:border-white/10 pb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-sans font-black text-3xl md:text-4xl tracking-tight text-neutral-950 dark:text-white">
              {job.name}
            </h1>
            <p className="font-sans text-sm text-neutral-500 dark:text-neutral-300 mt-2">
              Criado em {new Date(job.created_at).toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            {job.status === "completed" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/20">
                <CheckCircle size={14} /> Concluído
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-300 ring-1 ring-primary-500/20">
                <Loader2 size={14} className="animate-spin" /> {statusLabel(job.status)}
              </span>
            )}
          </div>
        </div>
      </header>

      {job.status !== "completed" && job.status !== "failed" && (
        <section className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121826] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>{statusLabel(job.status)}</span>
            <span className="text-primary-500">{job.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${job.progress}%` }} />
          </div>
        </section>
      )}

      {job.status === "failed" && (
        <section className="rounded-2xl border border-danger-500/25 bg-danger-500/10 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-danger-500 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-sans font-extrabold text-lg">Falha no processamento</h2>
              <p className="font-mono text-xs text-danger-500 mt-2 whitespace-pre-wrap">
                {job.error_message || "Erro desconhecido."}
              </p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-all inline-flex items-center gap-2"
          >
            <RotateCcw size={16} /> Tentar novamente
          </button>
        </section>
      )}

      {job.status === "completed" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          <TextPanel
            title="Transcrição Bruta"
            subtitle={`${countWords(rawText)} palavras`}
            text={rawText || "Nenhuma transcrição encontrada."}
            onCopy={() => handleCopy(rawText, "raw")}
            copied={copiedPanel === "raw"}
            showCopy={!!rawText}
          />

          <section className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121826] overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3 bg-neutral-50/80 dark:bg-white/[0.03]">
              <div>
                <h2 className="font-sans font-extrabold text-lg text-neutral-950 dark:text-white">Revisada por IA</h2>
                <p className="font-sans text-xs text-neutral-500 dark:text-neutral-300 mt-1">
                  {hasReviewedText ? `${countWords(cleanText)} palavras` : "Ainda não revisada"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {hasReviewedText && (
                  <button
                    onClick={() => handleCopy(cleanText, "clean")}
                    className="p-2.5 rounded-full text-neutral-500 hover:text-primary-500 hover:bg-primary-500/10 dark:text-neutral-400 dark:hover:text-primary-300 transition-all"
                    title="Copiar texto revisado"
                  >
                    {copiedPanel === "clean" ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                )}
                <button
                  onClick={handleIaProcess}
                  disabled={processingIa || !rawText}
                  className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-300 disabled:dark:bg-neutral-700 text-white rounded-full text-xs font-bold transition-all inline-flex items-center gap-2 shadow-sm shadow-primary-500/20 disabled:shadow-none"
                >
                  {processingIa ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {hasReviewedText ? "Revisar novamente" : "Revisar com IA"}
                </button>
              </div>
            </div>

            <div className="p-5 md:p-6 min-h-[420px] max-h-[70vh] overflow-y-auto">
              {hasReviewedText ? (
                <p className="whitespace-pre-wrap font-sans text-[15px] leading-8 text-neutral-800 dark:text-neutral-100 selection:bg-primary-500/25">
                  {cleanText}
                </p>
              ) : (
                <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center text-neutral-500 dark:text-neutral-300 space-y-3">
                  <Sparkles size={28} />
                  <p className="font-sans text-sm leading-6 max-w-sm">
                    Clique em Revisar com IA para corrigir pontuação, fluidez e vícios de linguagem.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function TextPanel({ title, subtitle, text, onCopy, copied, showCopy }: { title: string; subtitle: string; text: string; onCopy?: () => void; copied?: boolean; showCopy?: boolean }) {
  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121826] overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-neutral-200 dark:border-white/10 bg-neutral-50/80 dark:bg-white/[0.03] flex items-center justify-between">
        <div>
          <h2 className="font-sans font-extrabold text-lg text-neutral-950 dark:text-white">{title}</h2>
          <p className="font-sans text-xs text-neutral-500 dark:text-neutral-300 mt-1">{subtitle}</p>
        </div>
        {showCopy && onCopy && (
          <button
            onClick={onCopy}
            className="p-2.5 rounded-full text-neutral-500 hover:text-primary-500 hover:bg-primary-500/10 dark:text-neutral-400 dark:hover:text-primary-300 transition-all"
            title="Copiar texto"
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
        )}
      </div>
      <div className="p-5 md:p-6 min-h-[420px] max-h-[70vh] overflow-y-auto">
        <p className="whitespace-pre-wrap font-sans text-[15px] leading-8 text-neutral-800 dark:text-neutral-100 selection:bg-primary-500/25">
          {text}
        </p>
      </div>
    </section>
  );
}
