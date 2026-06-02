"use client";

import React, { useState } from "react";
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Globe, 
  CreditCard, 
  Sparkles, 
  Check, 
  HelpCircle, 
  Loader2, 
  ShieldAlert
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [model, setModel] = useState("whisper-1");
  const [language, setLanguage] = useState("pt");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState("free");

  const plans = [
    {
      id: "free",
      name: "Plano Gratuito",
      price: "R$ 0",
      period: "/mês",
      features: [
        "Até 30 minutos de vídeo por mês",
        "Upload de arquivos de até 100MB",
        "Transcrição básica via Whisper API",
        "Download em formato TXT e SRT",
        "Histórico por 7 dias"
      ],
      cta: "Plano Ativo",
      color: "border-neutral-200 dark:border-neutral-800"
    },
    {
      id: "pro",
      name: "Atigra Pro",
      price: "R$ 49",
      period: "/mês",
      features: [
        "Minutos ilimitados de vídeo",
        "Upload de arquivos de até 1GB",
        "Processamento acelerado (Fila Pro)",
        "Pós-processamento ilimitado por IA (GPT)",
        "Editor de legendas avançado",
        "Histórico eterno e busca textual",
        "Downloads TXT, SRT e VTT"
      ],
      cta: "Assinar Pro",
      recommended: true,
      color: "border-primary-500 ring-2 ring-primary-500/20"
    },
    {
      id: "enterprise",
      name: "Corporate",
      price: "Sob Consulta",
      period: "",
      features: [
        "Acesso via API pública e SDK",
        "Integração com Zoom, Drive e S3",
        "Speaker Diarization avançado",
        "Destaque e segurança corporativa RLS",
        "Suporte dedicado 24/7 e SLA",
        "Servidor/Worker dedicado"
      ],
      cta: "Fale Conosco",
      color: "border-neutral-200 dark:border-neutral-800"
    }
  ];

  const handleSubscribe = async (planId: string) => {
    if (planId === activePlan) return;
    
    setLoadingPlan(planId);
    // Simular chamada ao Stripe (delay)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setActivePlan(planId);
    setLoadingPlan(null);
    alert(`Plano alterado com sucesso para ${planId === "pro" ? "Atigra Pro" : "Corporate"} (Simulação de Billing)!`);
  };

  return (
    <div className="space-y-10 py-2 max-w-4xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="font-sans font-extrabold text-3xl tracking-tight bg-gradient-to-r from-neutral-900 via-primary-700 to-primary-500 dark:from-white dark:via-primary-300 dark:to-secondary-400 bg-clip-text text-transparent">
          Configurações da Plataforma
        </h1>
        <p className="font-sans text-neutral-500 dark:text-neutral-400 mt-2 text-sm">
          Ajuste as preferências de inteligência artificial, idioma e gerencie sua assinatura de faturamento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Lado Esquerdo: Ajustes Técnicos */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 p-5 rounded-3xl shadow-sm space-y-6">
            
            {/* Seção Modelo de Transcrição */}
            <div className="space-y-3">
              <label className="font-sans font-bold text-xs uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
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
                    <p className="font-sans text-[10px] text-neutral-400">Padrão da indústria, alta precisão</p>
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
                    <p className="font-sans text-[10px] text-neutral-400">Rápido e otimizado para múltiplos idiomas</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Seção Idioma Padrão */}
            <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-750">
              <label className="font-sans font-bold text-xs uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
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

            {/* Quota de Uso do Plano */}
            <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-750">
              <div className="flex justify-between items-center">
                <label className="font-sans font-bold text-xs uppercase tracking-wider text-neutral-400">
                  Uso Mensal (Minutos)
                </label>
                <span className="font-sans text-xs font-bold text-neutral-500 dark:text-neutral-400">
                  {activePlan === "free" ? "12 / 30 min" : "ILIMITADO"}
                </span>
              </div>
              {activePlan === "free" && (
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: "40%" }} />
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Lado Direito: Planos e Faturamento */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 rounded-3xl shadow-sm space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary-500/10 text-primary-500 rounded-2xl">
                <CreditCard size={22} />
              </div>
              <div>
                <h2 className="font-sans font-extrabold text-lg text-neutral-800 dark:text-white">
                  Planos e Faturamento
                </h2>
                <p className="font-sans text-xs text-neutral-400">
                  Altere sua assinatura para desbloquear limites maiores de upload e recursos de IA avançados.
                </p>
              </div>
            </div>

            {/* Cards de Planos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`border rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300
                    ${plan.id === activePlan 
                      ? "bg-primary-500/5 border-primary-500 dark:bg-primary-500/5 shadow-md" 
                      : "bg-white dark:bg-neutral-850 hover:shadow-md border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"}`}
                >
                  {/* Badge Recomendado */}
                  {plan.recommended && (
                    <span className="absolute top-0 right-6 transform -translate-y-1/2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm shadow-primary-500/20">
                      Recomendado
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <p className="font-sans font-extrabold text-sm text-neutral-800 dark:text-white">{plan.name}</p>
                      <div className="flex items-baseline mt-1">
                        <span className="font-sans font-black text-xl md:text-2xl tracking-tight">{plan.price}</span>
                        <span className="font-sans text-xs text-neutral-400 ml-0.5">{plan.period}</span>
                      </div>
                    </div>

                    <ul className="space-y-2 text-[11px] font-sans text-neutral-500 dark:text-neutral-400">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={plan.id === activePlan || loadingPlan !== null}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all mt-6 cursor-pointer flex items-center justify-center gap-1.5
                      ${plan.id === activePlan 
                        ? "bg-emerald-500 text-white border border-emerald-500 cursor-default" 
                        : plan.recommended 
                          ? "bg-primary-500 hover:bg-primary-600 text-white shadow shadow-primary-500/10" 
                          : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-250"}`}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 size={12} className="animate-spin" /> Conectando...
                      </>
                    ) : (
                      plan.cta
                    )}
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
