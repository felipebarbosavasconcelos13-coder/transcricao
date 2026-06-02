"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Globe, 
  Key, 
  Database, 
  Check, 
  Loader2, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Info,
  Server,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  // Ajustes de IA
  const [model, setModel] = useState("whisper-1");
  const [language, setLanguage] = useState("pt");

  // Ajustes de API / Credenciais
  const [openaiKey, setOpenaiKey] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");

  // Visibilidade de Senhas
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showSupabaseAnonKey, setShowSupabaseAnonKey] = useState(false);

  // Status de UI
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Carregar configurações do backend
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const json = await res.json();
        if (json.success && json.data) {
          setOpenaiKey(json.data.openai_api_key || "");
          setSupabaseUrl(json.data.supabase_url || "");
          setSupabaseAnonKey(json.data.supabase_anon_key || "");
        }
      } catch (e) {
        console.error("Erro ao carregar configurações:", e);
      } finally {
        setLoadingData(false);
      }
    }
    loadSettings();
  }, []);

  // Salvar configurações no backend
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);
    setErrorMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openai_api_key: openaiKey,
          supabase_url: supabaseUrl,
          supabase_anon_key: supabaseAnonKey
        })
      });

      const json = await res.json();
      if (json.success) {
        setSaveStatus("success");
        // Forçar reload das variáveis de ambiente na aba atual
        setTimeout(() => setSaveStatus(null), 4000);
      } else {
        setSaveStatus("error");
        setErrorMessage(json.error || "Erro ao salvar configurações.");
      }
    } catch (e) {
      setSaveStatus("error");
      setErrorMessage("Erro de conexão com o servidor.");
    } finally {
      setSaving(false);
    }
  };

  const isRealSupabaseActive = supabaseUrl && supabaseAnonKey && 
    !supabaseUrl.includes("seu_supabase_url") && 
    !supabaseAnonKey.includes("sua_supabase_key");

  return (
    <div className="space-y-8 py-2 max-w-4xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="font-sans font-extrabold text-3xl tracking-tight bg-gradient-to-r from-neutral-900 via-primary-700 to-primary-500 dark:from-white dark:via-primary-300 dark:to-secondary-400 bg-clip-text text-transparent">
          Configurações do Sistema
        </h1>
        <p className="font-sans text-neutral-500 dark:text-neutral-400 mt-2 text-sm">
          Gerencie as credenciais da API da OpenAI, chaves do banco de dados Supabase e as preferências do motor de inteligência artificial.
        </p>
      </div>

      {loadingData ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 size={32} className="text-primary-500 animate-spin" />
          <p className="font-sans text-xs text-neutral-400 font-semibold">Carregando configurações...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Lado Esquerdo: Ajustes do Modelo e Idioma */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 p-5 rounded-3xl shadow-sm space-y-6">
              
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-750">
                <SettingsIcon size={18} className="text-primary-500" />
                <h2 className="font-sans font-bold text-sm text-neutral-800 dark:text-white">Ajustes da IA</h2>
              </div>

              {/* Seção Modelo de Transcrição */}
              <div className="space-y-3">
                <label className="font-sans font-bold text-[10px] uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Cpu size={14} /> Modelo de Transcrição
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-100 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30 cursor-pointer hover:bg-neutral-100/50 transition-colors">
                    <input
                      type="radio"
                      name="model"
                      value="whisper-1"
                      checked={model === "whisper-1"}
                      onChange={(e) => setModel(e.target.value)}
                      className="accent-primary-500"
                    />
                    <div className="text-left">
                      <p className="font-sans text-xs font-bold">OpenAI Whisper v3</p>
                      <p className="font-sans text-[10px] text-neutral-400">Padrão, alta precisão temporal</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-100 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30 cursor-pointer hover:bg-neutral-100/50 transition-colors">
                    <input
                      type="radio"
                      name="model"
                      value="deepseek-asr"
                      checked={model === "deepseek-asr"}
                      onChange={(e) => setModel(e.target.value)}
                      className="accent-primary-500"
                    />
                    <div className="text-left">
                      <p className="font-sans text-xs font-bold">DeepSeek ASR</p>
                      <p className="font-sans text-[10px] text-neutral-400">Otimizado para falas dinâmicas</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Seção Idioma Padrão */}
              <div className="space-y-3 pt-2">
                <label className="font-sans font-bold text-[10px] uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Globe size={14} /> Idioma Padrão
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary-500 font-sans cursor-pointer text-neutral-700 dark:text-neutral-350"
                >
                  <option value="pt">Português (Brasil)</option>
                  <option value="en">Inglês (English)</option>
                  <option value="es">Espanhol (Español)</option>
                </select>
              </div>

              {/* Status de Armazenamento Atual */}
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-750 space-y-3">
                <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-neutral-400 block">
                  Status de Conectividade
                </span>
                
                {isRealSupabaseActive ? (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <Zap size={14} className="animate-pulse shrink-0" />
                    <span className="font-sans text-[11px] font-bold">Supabase Conectado (Real)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                    <Server size={14} className="shrink-0" />
                    <span className="font-sans text-[11px] font-bold">Banco Local Ativo (Mock)</span>
                  </div>
                )}
                
                {openaiKey ? (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <Check size={14} className="shrink-0" />
                    <span className="font-sans text-[11px] font-bold">OpenAI API Key Configurada</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                    <Info size={14} className="shrink-0" />
                    <span className="font-sans text-[11px] font-bold">Chave OpenAI Ausente (Simulação)</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Lado Direito: Credenciais e Conexões */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
              
              <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-750">
                <div className="p-2.5 bg-primary-500/10 text-primary-500 rounded-2xl">
                  <Database size={22} />
                </div>
                <div>
                  <h2 className="font-sans font-extrabold text-lg text-neutral-800 dark:text-white">
                    Credenciais e Conectividade
                  </h2>
                  <p className="font-sans text-xs text-neutral-400">
                    Insira suas chaves privadas para conectar o aplicativo diretamente aos seus serviços pessoais.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* OpenAI API Key */}
                <div className="space-y-1.5">
                  <label className="font-sans font-bold text-xs text-neutral-700 dark:text-neutral-350 flex items-center gap-1.5">
                    <Key size={14} className="text-neutral-400" />
                    OpenAI API Key (Whisper & GPT)
                  </label>
                  <div className="relative">
                    <input
                      type={showOpenaiKey ? "text" : "password"}
                      placeholder="sk-proj-..."
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-4 pr-10 py-3 text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      {showOpenaiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="font-sans text-[10px] text-neutral-400">
                    Chave necessária para realizar transcrições via Whisper e summarizações com o GPT-4o-mini.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Supabase URL */}
                  <div className="space-y-1.5">
                    <label className="font-sans font-bold text-xs text-neutral-700 dark:text-neutral-350 flex items-center gap-1.5">
                      <Server size={14} className="text-neutral-400" />
                      Supabase Project URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://xxxx.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all font-mono"
                    />
                  </div>

                  {/* Supabase Anon Key */}
                  <div className="space-y-1.5">
                    <label className="font-sans font-bold text-xs text-neutral-700 dark:text-neutral-350 flex items-center gap-1.5">
                      <Key size={14} className="text-neutral-400" />
                      Supabase Anon Key
                    </label>
                    <div className="relative">
                      <input
                        type={showSupabaseAnonKey ? "text" : "password"}
                        placeholder="eyJhbGciOi..."
                        value={supabaseAnonKey}
                        onChange={(e) => setSupabaseAnonKey(e.target.value)}
                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-4 pr-10 py-3 text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSupabaseAnonKey(!showSupabaseAnonKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                      >
                        {showSupabaseAnonKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="font-sans text-[10px] text-neutral-400">
                  O aplicativo usará estas credenciais para persistir dados de jobs, transcrições e mídias de forma segura em seu próprio banco. Se deixadas vazias, o app usará o Mock de armazenamento local (`temp_db.json`).
                </p>
              </div>

              {/* Status de Salvamento */}
              {saveStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center gap-2.5"
                >
                  <Check size={16} className="shrink-0" />
                  <span className="font-sans text-xs font-bold">Configurações salvas e aplicadas com sucesso!</span>
                </motion.div>
              )}

              {saveStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-danger-500/10 border border-danger-500/20 text-danger-550 dark:text-danger-400 rounded-2xl flex items-start gap-2.5"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-sans text-xs font-bold">Erro ao salvar</p>
                    <p className="font-sans text-[11px] opacity-90 mt-0.5">{errorMessage}</p>
                  </div>
                </motion.div>
              )}

              {/* Botão de Enviar */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-200 disabled:dark:bg-neutral-800 disabled:text-neutral-400 text-white rounded-2xl text-xs font-bold shadow shadow-primary-500/15 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      Salvar Configurações
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

        </form>
      )}

    </div>
  );
}
