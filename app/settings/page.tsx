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
  Zap,
  ArrowRight,
  ArrowLeft,
  Copy,
  CheckCircle,
  DatabaseZap,
  Bot
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getLocalPreferences, saveLocalPreferences } from "@/lib/localPreferences";
import type { AsrModel } from "@/lib/jobPreferences";

export default function SettingsPage() {
  // Controle de Etapa (1: Banco de Dados, 2: IA)
  const [step, setStep] = useState<1 | 2>(1);

  // Estados dos Campos
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [model, setModel] = useState<AsrModel>("whisper-1");
  const [openaiKey, setOpenaiKey] = useState("");
  const [deepseekKey, setDeepseekKey] = useState("");
  const [language, setLanguage] = useState("pt");

  // Flags indicando que a chave já está configurada no servidor (arquivo ou variável de ambiente).
  // As chaves secretas nunca são devolvidas ao navegador.
  const [openaiConfigured, setOpenaiConfigured] = useState(false);
  const [deepseekConfigured, setDeepseekConfigured] = useState(false);

  // Visibilidade de Senhas
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);
  const [showSupabaseAnonKey, setShowSupabaseAnonKey] = useState(false);

  // Status de Carregamento e UI
  const [loadingData, setLoadingData] = useState(true);
  const [validatingDb, setValidatingDb] = useState(false);
  const [dbValidationResult, setDbValidationResult] = useState<{
    success: boolean;
    connectionOk: boolean;
    tablesExist: boolean;
    sqlScript?: string;
    error?: string;
  } | null>(null);

  const [savingSettings, setSavingSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedSql, setCopiedSql] = useState(false);

  // Carregar configurações iniciais do servidor
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const json = await res.json();
        if (json.success && json.data) {
          const localPreferences = getLocalPreferences();
          setSupabaseUrl(json.data.supabase_url || "");
          setSupabaseAnonKey(json.data.supabase_anon_key || "");
          setModel(localPreferences.asrModel || json.data.model || "whisper-1");
          setOpenaiKey("");
          setDeepseekKey("");
          setOpenaiConfigured(!!json.data.openai_configured);
          setDeepseekConfigured(!!json.data.deepseek_configured);
          setLanguage(localPreferences.language || json.data.language || "pt");

          // Se já tem credenciais salvas do Supabase, rodar validação inicial silenciosa
          if (json.data.supabase_url && json.data.supabase_anon_key) {
            validateSupabaseConnection(json.data.supabase_url, json.data.supabase_anon_key, true);
          }
        }
      } catch (e) {
        console.error("Erro ao carregar configurações:", e);
      } finally {
        setLoadingData(false);
      }
    }
    loadSettings();
  }, []);

  // Validar conexão com o Supabase
  const validateSupabaseConnection = async (url: string, anonKey: string, silent = false) => {
    if (!silent) {
      setValidatingDb(true);
      setDbValidationResult(null);
    }
    try {
      const res = await fetch("/api/settings/validate-supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supabase_url: url, supabase_anon_key: anonKey })
      });
      const data = await res.json();
      
      if (data.success) {
        setDbValidationResult({
          success: true,
          connectionOk: data.connectionOk,
          tablesExist: data.tablesExist,
          sqlScript: data.sqlScript
        });
      } else {
        setDbValidationResult({
          success: false,
          connectionOk: false,
          tablesExist: false,
          error: data.error || "Falha na conexão com o banco de dados."
        });
      }
    } catch (err: any) {
      setDbValidationResult({
        success: false,
        connectionOk: false,
        tablesExist: false,
        error: "Não foi possível conectar ao servidor de validação."
      });
    } finally {
      if (!silent) {
        setValidatingDb(false);
      }
    }
  };

  // Copiar o script SQL para a área de transferência
  const handleCopySql = () => {
    if (dbValidationResult?.sqlScript) {
      navigator.clipboard.writeText(dbValidationResult.sqlScript);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    }
  };

  // Conectar usando o Supabase Real e salvar imediatamente no backend se for válido fisicamente
  const handleConnectSupabase = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setDbValidationResult({
        success: false,
        connectionOk: false,
        tablesExist: false,
        error: "Por favor, insira a URL e a Anon Key do Supabase antes de validar."
      });
      return;
    }
    
    setValidatingDb(true);
    setDbValidationResult(null);

    try {
      const res = await fetch("/api/settings/validate-supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supabase_url: supabaseUrl, supabase_anon_key: supabaseAnonKey })
      });
      const data = await res.json();
      
      if (data.success) {
        setDbValidationResult({
          success: true,
          connectionOk: data.connectionOk,
          tablesExist: data.tablesExist,
          sqlScript: data.sqlScript
        });

        // Se a conexão física com o Supabase for estabelecida (com ou sem tabelas),
        // persistimos os dados de conectividade imediatamente no backend para evitar perda em F5
        if (data.connectionOk) {
          await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              supabase_url: supabaseUrl,
              supabase_anon_key: supabaseAnonKey
            })
          });
        }
      } else {
        setDbValidationResult({
          success: false,
          connectionOk: false,
          tablesExist: false,
          error: data.error || "Falha na conexão com o banco de dados."
        });
      }
    } catch (err: any) {
      setDbValidationResult({
        success: false,
        connectionOk: false,
        tablesExist: false,
        error: "Não foi possível conectar ao servidor de validação."
      });
    } finally {
      setValidatingDb(false);
    }
  };

  // Escolher usar o banco local / mock e persistir a limpeza no servidor de forma imediata
  const handleUseLocalMock = async () => {
    setSupabaseUrl("");
    setSupabaseAnonKey("");
    setDbValidationResult({
      success: true,
      connectionOk: false,
      tablesExist: false
    });

    try {
      // Grava no backend que o Supabase está desativado (chaves vazias)
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabase_url: "",
          supabase_anon_key: ""
        })
      });
    } catch (err) {
      console.error("Erro ao salvar configuração de mock local no servidor:", err);
    }

    setStep(2); // Avança imediatamente
  };

  // Salvar configurações finais do sistema
  const handleFinalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveStatus(null);
    setErrorMessage("");

    try {
      saveLocalPreferences({ asrModel: model, language });

      // Só enviamos as chaves secretas quando o usuário realmente digitou um valor novo,
      // evitando sobrescrever chaves já configuradas (inclusive via variável de ambiente).
      const payload: Record<string, any> = {
        supabase_url: supabaseUrl,
        supabase_anon_key: supabaseAnonKey,
        model,
        language
      };
      if (openaiKey.trim()) payload.openai_api_key = openaiKey.trim();
      if (deepseekKey.trim()) payload.deepseek_api_key = deepseekKey.trim();

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        setSaveStatus("success");
        if (openaiKey.trim()) setOpenaiConfigured(true);
        if (deepseekKey.trim()) setDeepseekConfigured(true);
        setTimeout(() => setSaveStatus(null), 5000);
      } else if (json.readonly) {
        setSaveStatus("success");
        setErrorMessage("");
        setTimeout(() => setSaveStatus(null), 5000);
      } else {
        setSaveStatus("error");
        setErrorMessage(json.error || "Erro ao salvar as configurações.");
      }
    } catch (e) {
      setSaveStatus("error");
      setErrorMessage("Erro de conectividade com o servidor.");
    } finally {
      setSavingSettings(false);
    }
  };

  const isRealDbConfigured = supabaseUrl && supabaseAnonKey;
  const isDbValid = dbValidationResult?.success && (dbValidationResult.tablesExist || !isRealDbConfigured);

  return (
    <div className="space-y-8 py-2 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-sans font-extrabold text-3xl tracking-tight bg-gradient-to-r from-neutral-900 via-primary-700 to-primary-500 dark:from-white dark:via-primary-300 dark:to-secondary-400 bg-clip-text text-transparent">
          Configurações do Sistema
        </h1>
        <p className="font-sans text-neutral-500 dark:text-neutral-400 mt-2 text-sm">
          Siga o fluxo assistido para conectar sua infraestrutura e gerenciar os motores de Inteligência Artificial.
        </p>
      </div>

      {/* Stepper Visual */}
      <div className="flex items-center justify-between max-w-lg mx-auto bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-3xl shadow-inner">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            step === 1 
              ? "bg-primary-500 text-white shadow-md shadow-primary-500/15" 
              : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-250"
          }`}
        >
          <Database size={14} />
          1. Banco de Dados
        </button>
        <div className="h-0.5 w-12 bg-neutral-200 dark:bg-neutral-800 flex-1 mx-2" />
        <button
          onClick={() => isDbValid && setStep(2)}
          disabled={!isDbValid}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            step === 2 
              ? "bg-primary-500 text-white shadow-md shadow-primary-500/15" 
              : isDbValid
                ? "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-250 cursor-pointer"
                : "text-neutral-300 dark:text-neutral-700 cursor-not-allowed"
          }`}
        >
          <Bot size={14} />
          2. Inteligência Artificial
        </button>
      </div>

      {loadingData ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 size={32} className="text-primary-500 animate-spin" />
          <p className="font-sans text-xs text-neutral-400 font-semibold">Carregando configurações...</p>
        </div>
      ) : (
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            
            {/* ETAPA 1: CONFIGURAÇÃO DE BANCO DE DADOS */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start animate-fade-in"
              >
                {/* Lado Esquerdo: Info de Status do Banco */}
                <div className="md:col-span-1 space-y-6">
                  <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 p-5 rounded-3xl shadow-sm space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-750">
                      <DatabaseZap size={18} className="text-primary-500" />
                      <h2 className="font-sans font-bold text-sm text-neutral-800 dark:text-white">Status da Conexão</h2>
                    </div>

                    <div className="space-y-3">
                      {isRealDbConfigured ? (
                        <>
                          <div className="flex items-center gap-2 p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-850 text-neutral-600 dark:text-neutral-400 rounded-xl text-[11px] font-medium break-all font-mono">
                            URL: {supabaseUrl}
                          </div>

                          {dbValidationResult?.success ? (
                            dbValidationResult.tablesExist ? (
                              <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                                <Zap size={14} className="animate-pulse shrink-0" />
                                <span className="font-sans text-[11px] font-bold">Supabase Conectado & Tabelas OK</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                                <AlertCircle size={14} className="shrink-0 animate-bounce" />
                                <span className="font-sans text-[11px] font-bold">Conectado (Sem Tabelas!)</span>
                              </div>
                            )
                          ) : (
                            <div className="flex items-center gap-2 p-2.5 bg-danger-500/10 text-danger-500 rounded-xl">
                              <AlertCircle size={14} className="shrink-0" />
                              <span className="font-sans text-[11px] font-bold">Aguardando Validação</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                          <Server size={14} className="shrink-0" />
                          <span className="font-sans text-[11px] font-bold">Banco de Dados Local Ativo (Mock)</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="font-sans text-[10px] leading-relaxed text-neutral-400">
                      O aplicativo precisa de tabelas para persistir mídias, transcrições e comentários. Recomendamos usar o Supabase remoto, mas você pode usar o banco local temporário para desenvolvimento rápido.
                    </p>
                  </div>
                </div>

                {/* Lado Direito: Formulário de Conexão do Supabase */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
                    <div>
                      <h2 className="font-sans font-extrabold text-lg text-neutral-800 dark:text-white">
                        Conecte o seu Banco de Dados Supabase
                      </h2>
                      <p className="font-sans text-xs text-neutral-400 mt-1">
                        Insira as credenciais do seu projeto Supabase remoto. O sistema testará a conectividade.
                      </p>
                    </div>

                    <div className="space-y-4">
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

                    {/* Alertas e Resultado de Validação do Banco */}
                    {dbValidationResult && !dbValidationResult.success && (
                      <div className="p-3.5 bg-danger-500/10 border border-danger-500/20 text-danger-550 dark:text-danger-400 rounded-2xl flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span className="font-sans text-xs">{dbValidationResult.error}</span>
                      </div>
                    )}

                    {dbValidationResult && dbValidationResult.success && dbValidationResult.tablesExist && (
                      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center gap-2.5">
                        <CheckCircle size={16} className="shrink-0" />
                        <span className="font-sans text-xs font-bold">Banco conectado com sucesso e tabelas ativas! Pode avançar.</span>
                      </div>
                    )}

                    {/* Se as tabelas estão ausentes no Supabase do usuário */}
                    {dbValidationResult && dbValidationResult.success && !dbValidationResult.tablesExist && isRealDbConfigured && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
                        <div className="flex items-start gap-2.5 text-amber-600 dark:text-amber-400">
                          <AlertCircle size={18} className="shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <p className="font-sans text-xs font-bold">Conectado, mas tabelas ausentes</p>
                            <p className="font-sans text-[11px] opacity-90 mt-0.5">
                              A conexão está funcionando, porém a estrutura de tabelas do Atigra Trans não foi criada no banco de dados remoto do seu Supabase.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-sans font-bold text-[10px] text-neutral-400 uppercase tracking-wider">
                              Script SQL do Banco
                            </span>
                            <button
                              type="button"
                              onClick={handleCopySql}
                              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-650 dark:text-amber-300 rounded-lg text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                            >
                              {copiedSql ? (
                                <>
                                  <Check size={10} /> Copiado!
                                </>
                              ) : (
                                <>
                                  <Copy size={10} /> Copiar Código
                                </>
                              )}
                            </button>
                          </div>
                          
                          <pre className="p-3 bg-neutral-900 text-neutral-100 rounded-xl text-[10px] font-mono overflow-x-auto max-h-40 leading-relaxed border border-neutral-800">
                            {dbValidationResult.sqlScript || "-- Erro ao carregar script SQL."}
                          </pre>

                          <p className="font-sans text-[10px] text-neutral-400 leading-normal">
                            👉 Para resolver: acesse o painel do seu <strong>Supabase</strong>, clique em <strong>SQL Editor</strong>, cole o código acima e clique em <strong>Run</strong>. Depois volte aqui e clique em "Validar Banco de Dados".
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Barra de Ações do Passo 1 */}
                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-750 flex flex-wrap gap-3 justify-between items-center">
                      <button
                        type="button"
                        onClick={handleUseLocalMock}
                        className="px-5 py-2.5 border border-neutral-200 dark:border-neutral-750 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500 hover:text-neutral-750 dark:text-neutral-450 dark:hover:text-white rounded-2xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Usar Banco de Dados Local (Simulado)
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleConnectSupabase}
                          disabled={validatingDb}
                          className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-850 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black rounded-2xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {validatingDb ? (
                            <>
                              <Loader2 size={12} className="animate-spin" /> Validando...
                            </>
                          ) : (
                            <>
                              Validar Banco de Dados
                            </>
                          )}
                        </button>

                        {/* Avançar habilitado se estiver validado com tabelas OK ou se for Mock */}
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          disabled={!isDbValid}
                          className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-100 disabled:dark:bg-neutral-850 disabled:text-neutral-400 text-white rounded-2xl text-xs font-bold shadow shadow-primary-500/15 transition-all flex items-center gap-2 active:scale-95 disabled:shadow-none cursor-pointer"
                        >
                          Avançar <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {/* ETAPA 2: CONFIGURAÇÃO DO MOTOR DE IA */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start animate-fade-in"
              >
                {/* Lado Esquerdo: Resumo de IA e Conexão */}
                <div className="md:col-span-1 space-y-6">
                  <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 p-5 rounded-3xl shadow-sm space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-750">
                      <SettingsIcon size={18} className="text-primary-500" />
                      <h2 className="font-sans font-bold text-sm text-neutral-800 dark:text-white">Ajustes da IA</h2>
                    </div>

                    {/* Status de Conectividade da IA Selecionada */}
                    <div className="space-y-3">
                      <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-neutral-400 block">
                        Status de Conectividade
                      </span>

                      {model === "whisper-1" ? (
                        (openaiKey || openaiConfigured) ? (
                          <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                            <Check size={14} className="shrink-0" />
                            <span className="font-sans text-[11px] font-bold">OpenAI API Key Ativa</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                            <Info size={14} className="shrink-0" />
                            <span className="font-sans text-[11px] font-bold">OpenAI Key Ausente (Mock)</span>
                          </div>
                        )
                      ) : (
                        (deepseekKey || deepseekConfigured) ? (
                          <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                            <Check size={14} className="shrink-0" />
                            <span className="font-sans text-[11px] font-bold">DeepSeek API Key Ativa</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                            <Info size={14} className="shrink-0" />
                            <span className="font-sans text-[11px] font-bold">DeepSeek Key Ausente (Mock)</span>
                          </div>
                        )
                      )}
                    </div>

                    <p className="font-sans text-[10px] leading-relaxed text-neutral-400">
                      Escolha o motor de transcrição ASR que deseja empregar e insira as credenciais válidas correspondentes para realizar chamadas de produção.
                    </p>
                  </div>
                </div>

                {/* Lado Direito: Opções do Motor e Idioma */}
                <div className="md:col-span-2 space-y-6">
                  <form onSubmit={handleFinalSave} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
                    <div>
                      <h2 className="font-sans font-extrabold text-lg text-neutral-800 dark:text-white">
                        Escolha seu Motor de Transcrição
                      </h2>
                      <p className="font-sans text-xs text-neutral-400 mt-1">
                        Selecione a Inteligência Artificial responsável pelo processamento de conversão de áudio em texto.
                      </p>
                    </div>

                    {/* Seleção do Motor */}
                    <div className="space-y-3">
                      <label className="font-sans font-bold text-[10px] uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                        <Cpu size={14} /> Modelo de Transcrição
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-all ${
                          model === "whisper-1" 
                            ? "border-primary-500 bg-primary-500/5" 
                            : "border-neutral-200 dark:border-neutral-850 bg-transparent"
                        }`}>
                          <input
                            type="radio"
                            name="model"
                            value="whisper-1"
                            checked={model === "whisper-1"}
                            onChange={(e) => setModel(e.target.value as AsrModel)}
                            className="mt-0.5 accent-primary-500"
                          />
                          <div className="text-left">
                            <p className="font-sans text-xs font-bold text-neutral-800 dark:text-white">OpenAI Whisper v3</p>
                            <p className="font-sans text-[10px] text-neutral-400 mt-0.5">Padrão, altíssima fidelidade e timestamp preciso.</p>
                          </div>
                        </label>

                        <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-all ${
                          model === "deepseek-asr" 
                            ? "border-primary-500 bg-primary-500/5" 
                            : "border-neutral-200 dark:border-neutral-850 bg-transparent"
                        }`}>
                          <input
                            type="radio"
                            name="model"
                            value="deepseek-asr"
                            checked={model === "deepseek-asr"}
                            onChange={(e) => setModel(e.target.value as AsrModel)}
                            className="mt-0.5 accent-primary-500"
                          />
                          <div className="text-left">
                            <p className="font-sans text-xs font-bold text-neutral-800 dark:text-white">DeepSeek ASR</p>
                            <p className="font-sans text-[10px] text-neutral-400 mt-0.5">Veloz e otimizado para cenários dinâmicos de fala.</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Inputs de Chave API baseados no Motor Selecionado */}
                    <div className="space-y-4 pt-2">
                      {model === "whisper-1" ? (
                        <div className="space-y-1.5 animate-fade-in">
                          <label className="font-sans font-bold text-xs text-neutral-700 dark:text-neutral-350 flex items-center gap-1.5">
                            <Key size={14} className="text-neutral-400" />
                            OpenAI API Key (Whisper & GPT)
                          </label>
                          <div className="relative">
                            <input
                              type={showOpenaiKey ? "text" : "password"}
                              placeholder={openaiConfigured ? "•••• configurada — digite para substituir" : "sk-proj-..."}
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
                            Necessária para requisições na API Whisper (transcrição) e GPT (sumários e limpezas textuais).
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 animate-fade-in">
                          <label className="font-sans font-bold text-xs text-neutral-700 dark:text-neutral-350 flex items-center gap-1.5">
                            <Key size={14} className="text-neutral-400" />
                            DeepSeek API Key (ASR)
                          </label>
                          <div className="relative">
                            <input
                              type={showDeepseekKey ? "text" : "password"}
                              placeholder={deepseekConfigured ? "•••• configurada — digite para substituir" : "sk-..."}
                              value={deepseekKey}
                              onChange={(e) => setDeepseekKey(e.target.value)}
                              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-4 pr-10 py-3 text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                            >
                              {showDeepseekKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <p className="font-sans text-[10px] text-neutral-400">
                            Chave necessária para realizar chamadas no motor de transcrição DeepSeek ASR.
                          </p>
                        </div>
                      )}

                      {/* Configuração de Idioma */}
                      <div className="space-y-1.5">
                        <label className="font-sans font-bold text-xs text-neutral-700 dark:text-neutral-350 flex items-center gap-1.5">
                          <Globe size={14} className="text-neutral-400" />
                          Idioma Padrão
                        </label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-primary-500 font-sans cursor-pointer text-neutral-700 dark:text-neutral-350"
                        >
                          <option value="pt">Português (Brasil)</option>
                          <option value="en">Inglês (English)</option>
                          <option value="es">Espanhol (Español)</option>
                        </select>
                      </div>
                    </div>

                    {/* Status de Salvamento */}
                    {saveStatus === "success" && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center gap-2.5"
                      >
                        <Check size={16} className="shrink-0" />
                        <span className="font-sans text-xs font-bold">Preferências salvas. Em produção, o modelo fica salvo neste navegador e será usado nos próximos jobs.</span>
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
                          <p className="font-sans text-xs font-bold">Erro ao salvar configurações</p>
                          <p className="font-sans text-[11px] opacity-90 mt-0.5">{errorMessage}</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Barra de Ações do Passo 2 */}
                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-750 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-5 py-2.5 border border-neutral-200 dark:border-neutral-750 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500 hover:text-neutral-750 dark:text-neutral-450 dark:hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <ArrowLeft size={14} /> Voltar ao Banco
                      </button>

                      <button
                        type="submit"
                        disabled={savingSettings}
                        className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-200 disabled:dark:bg-neutral-800 disabled:text-neutral-400 text-white rounded-2xl text-xs font-bold shadow shadow-primary-500/15 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                      >
                        {savingSettings ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Gravando dados...
                          </>
                        ) : (
                          <>
                            Salvar Configurações
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
