"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Youtube } from "@/components/YoutubeIcon";
import { 
  Search, 
  Clock, 
  Trash2, 
  RotateCcw, 
  Play, 
  File, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Filter, 
  Calendar,
  AlertCircle,
  FileText
} from "lucide-react";

interface Job {
  id: string;
  name: string;
  source_type: "upload" | "youtube";
  source_url: string;
  status: "pending" | "processing_audio" | "transcribing" | "post_processing" | "completed" | "failed";
  progress: number;
  duration: number;
  error_message: string | null;
  created_at: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const fetchJobs = async () => {
    try {
      const url = searchQuery 
        ? `/api/jobs?q=${encodeURIComponent(searchQuery)}` 
        : "/api/jobs";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data);
        setError("");
      } else {
        setError(data.error || "Falha ao buscar o histórico.");
      }
    } catch (e) {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Buscar jobs no carregamento e quando a busca mudar
  useEffect(() => {
    fetchJobs();
    
    // Configurar polling leve de 5s caso haja algum job processando
    const activeJobs = jobs.some(j => 
      j.status === "pending" || 
      j.status === "processing_audio" || 
      j.status === "transcribing" || 
      j.status === "post_processing"
    );

    let interval: NodeJS.Timeout;
    if (activeJobs) {
      interval = setInterval(fetchJobs, 4000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [searchQuery, jobs.length]);

  // Excluir um job
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar clique na linha que redireciona
    if (!confirm("Tem certeza que deseja excluir esta transcrição e todos os arquivos associados?")) {
      return;
    }

    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setJobs(jobs.filter((job) => job.id !== id));
      } else {
        alert(data.error || "Falha ao deletar o trabalho.");
      }
    } catch (e) {
      alert("Erro ao enviar comando de exclusão.");
    }
  };

  // Reprocessar job (Retry)
  const handleRetry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/jobs/${id}/retry`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchJobs();
      } else {
        alert(data.error || "Erro ao reprocessar.");
      }
    } catch (e) {
      alert("Erro ao reprocessar.");
    }
  };

  // Filtragem local
  const filteredJobs = jobs.filter((job) => {
    // 1. Filtrar por status
    if (statusFilter !== "all" && job.status !== statusFilter) {
      return false;
    }

    // 2. Filtrar por data
    if (dateFilter !== "all") {
      const createdDate = new Date(job.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (dateFilter === "24h" && diffDays > 1) return false;
      if (dateFilter === "7d" && diffDays > 7) return false;
      if (dateFilter === "30d" && diffDays > 30) return false;
    }

    return true;
  });

  const getStatusBadge = (status: Job["status"]) => {
    switch (status) {
      case "completed":
        return <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full w-fit"><CheckCircle2 size={12} /> Concluído</span>;
      case "failed":
        return <span className="flex items-center gap-1 text-[11px] font-bold text-danger-500 bg-danger-500/10 px-2.5 py-1 rounded-full w-fit"><XCircle size={12} /> Falhou</span>;
      default:
        return <span className="flex items-center gap-1 text-[11px] font-bold text-primary-500 bg-primary-500/10 px-2.5 py-1 rounded-full w-fit animate-pulse"><Loader2 size={12} className="animate-spin" /> Processando</span>;
    }
  };

  const formatDuration = (sec: number) => {
    if (!sec) return "--:--";
    const minutes = Math.floor(sec / 60);
    const remainingSeconds = Math.floor(sec % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  return (
    <div className="space-y-8 py-2 max-w-5xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="font-sans font-extrabold text-3xl tracking-tight bg-gradient-to-r from-neutral-900 via-primary-700 to-primary-500 dark:from-white dark:via-primary-300 dark:to-secondary-400 bg-clip-text text-transparent">
          Histórico de Transcrições
        </h1>
        <p className="font-sans text-neutral-500 dark:text-neutral-400 mt-2 text-sm">
          Acesse e pesquise por conteúdos transcritos anteriormente em seu banco de dados.
        </p>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800/80 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Busca por texto */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Pesquisar por título ou termos dentro da transcrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all font-sans"
            />
          </div>

          {/* Filtro de Status */}
          <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-3 py-1 shrink-0">
            <Filter size={15} className="text-neutral-400 ml-1" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm border-none focus:outline-none py-2 pr-4 font-sans font-semibold text-neutral-600 dark:text-neutral-350 cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="completed">Concluídos</option>
              <option value="pending">Na fila</option>
              <option value="processing_audio">Convertendo Áudio</option>
              <option value="transcribing">Transcrevendo</option>
              <option value="post_processing">Revisando IA</option>
              <option value="failed">Falhas</option>
            </select>
          </div>

          {/* Filtro de Data */}
          <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-3 py-1 shrink-0">
            <Calendar size={15} className="text-neutral-400 ml-1" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-sm border-none focus:outline-none py-2 pr-4 font-sans font-semibold text-neutral-600 dark:text-neutral-350 cursor-pointer"
            >
              <option value="all">Qualquer data</option>
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
            </select>
          </div>
        </div>
      </div>

      {/* LISTAGEM DE TRABALHOS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 size={32} className="text-primary-500 animate-spin" />
          <p className="font-sans text-xs text-neutral-400 font-semibold">Buscando trabalhos...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-danger-500/10 border border-danger-500/20 text-danger-500 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="font-sans text-sm font-semibold">{error}</span>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800/60 p-12 text-center rounded-[32px] space-y-4">
          <FileText size={40} className="mx-auto text-neutral-300 dark:text-neutral-600" />
          <div className="space-y-1">
            <p className="font-sans font-bold text-base text-neutral-700 dark:text-neutral-350">
              Nenhum trabalho correspondente
            </p>
            <p className="font-sans text-xs text-neutral-400 max-w-sm mx-auto">
              Experimente ajustar os filtros ou realizar outra busca por palavras chave.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setDateFilter("all");
            }}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-850 rounded-[32px] overflow-hidden shadow-sm">
          
          {/* Layout Tabular Desktop */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50/50 dark:bg-neutral-900/30 font-sans select-none">
                  <th className="px-6 py-4">Nome do Vídeo</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Duração</th>
                  <th className="px-6 py-4">Criado em</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-sans">
                <AnimatePresence mode="popLayout">
                  {filteredJobs.map((job) => (
                    <motion.tr
                      key={job.id}
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-neutral-50/50 dark:hover:bg-neutral-700/20 cursor-pointer group transition-colors"
                    >
                      <td className="px-6 py-4 max-w-xs md:max-w-sm">
                        <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200 truncate group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                          {job.name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-xs text-neutral-400">
                          {job.source_type === "youtube" ? (
                            <Youtube size={14} className="text-danger-500" />
                          ) : (
                            <File size={14} className="text-primary-500" />
                          )}
                          <span className="capitalize">{job.source_type}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-neutral-400">
                        {formatDuration(job.duration)}
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-400 font-mono">
                        {new Date(job.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end items-center">
                          {job.status === "failed" && (
                            <button
                              onClick={(e) => handleRetry(job.id, e)}
                              className="p-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 rounded-lg text-neutral-600 dark:text-neutral-300 transition-colors"
                              title="Tentar novamente"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(job.id, e)}
                            className="p-1.5 bg-danger-500/10 hover:bg-danger-500 hover:text-white rounded-lg text-danger-500 transition-all cursor-pointer"
                            title="Excluir transcrição"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Layout em Mini Cards para Mobile */}
          <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => router.push(`/jobs/${job.id}`)}
                className="p-5 hover:bg-neutral-50 dark:hover:bg-neutral-850 cursor-pointer space-y-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <p className="font-sans font-bold text-sm text-neutral-850 dark:text-neutral-200 truncate flex-1">
                    {job.name}
                  </p>
                  {getStatusBadge(job.status)}
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 capitalize">
                      {job.source_type === "youtube" ? <Youtube size={13} className="text-danger-500" /> : <File size={13} className="text-primary-500" />}
                      {job.source_type}
                    </span>
                    <span>•</span>
                    <span>{formatDuration(job.duration)}</span>
                  </div>
                  <span className="font-mono">{new Date(job.created_at).toLocaleDateString("pt-BR")}</span>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  {job.status === "failed" && (
                    <button
                      onClick={(e) => handleRetry(job.id, e)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 rounded-lg text-xs font-bold text-neutral-600 dark:text-neutral-300 transition-colors"
                    >
                      Refazer
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(job.id, e)}
                    className="px-3 py-1.5 bg-danger-500/10 text-danger-500 rounded-lg text-xs font-bold transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
