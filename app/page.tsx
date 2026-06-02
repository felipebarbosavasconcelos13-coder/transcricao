"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Video, 
  Sparkles, 
  Download, 
  FileText, 
  Clock, 
  Shield, 
  ArrowRight,
  TrendingUp
} from "lucide-react";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
  };

  const features = [
    {
      icon: Clock,
      title: "Velocidade Extrema",
      desc: "Extração de áudio e transcrição Whisper otimizada em menos de 1/3 da duração do próprio vídeo.",
      color: "from-primary-500 to-primary-600"
    },
    {
      icon: Sparkles,
      title: "Pós-processamento de IA",
      desc: "Limpeza automática de ruídos textuais, repetições, pontuação correta e resumo estruturado com GPT.",
      color: "from-secondary-400 to-secondary-500"
    },
    {
      icon: Download,
      title: "Múltiplos Formatos",
      desc: "Exporte suas transcrições prontas para legendas ou leitura direta em arquivos TXT, SRT e VTT.",
      color: "from-primary-400 to-secondary-400"
    }
  ];

  return (
    <div className="py-6 md:py-12 space-y-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-white to-neutral-100 dark:from-neutral-800/20 dark:to-neutral-900/60 border border-neutral-200/50 dark:border-neutral-800/40 p-8 md:p-16">
        
        {/* Decorative background shapes */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-500/10 text-primary-500 dark:text-primary-300 rounded-full text-xs font-bold font-sans uppercase tracking-wider"
          >
            <Sparkles size={12} className="animate-pulse" /> Transcrição Instantânea por IA
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-sans font-black text-4xl md:text-6xl tracking-tight leading-none text-neutral-900 dark:text-white"
          >
            Transforme seus <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">vídeos</span> em <span className="bg-gradient-to-r from-secondary-400 to-primary-500 bg-clip-text text-transparent">conteúdo textual</span> pesquisável
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-sans text-neutral-500 dark:text-neutral-400 text-base md:text-lg max-w-2xl"
          >
            Cole links do YouTube ou envie arquivos de vídeo locais. Obtenha transcrições completas com timestamps, resumos formatados por IA e legendas prontas em minutos.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <Link 
              href="/jobs/new"
              className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl text-base font-bold shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all hover:-translate-y-0.5 text-center flex items-center justify-center gap-2 cursor-pointer group"
            >
              Começar Agora <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/history"
              className="px-8 py-4 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-base font-bold shadow-sm transition-all hover:-translate-y-0.5 text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              Ver Histórico
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="font-sans font-extrabold text-2xl md:text-3xl text-neutral-900 dark:text-white tracking-tight">
            Tudo o que você precisa para transcrever
          </h2>
          <p className="font-sans text-neutral-500 dark:text-neutral-400 text-sm">
            Uma pipeline robusta alimentada pelas tecnologias de IA mais avançadas do mercado.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((feat, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="bg-white dark:bg-neutral-850 border border-neutral-200/60 dark:border-neutral-800/80 p-8 rounded-3xl hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:border-primary-300 dark:hover:border-neutral-700 hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className={`p-3 bg-gradient-to-tr ${feat.color} text-white rounded-2xl inline-block shadow-md group-hover:scale-110 transition-transform`}>
                  <feat.icon size={22} />
                </div>
                <h3 className="font-sans font-bold text-lg text-neutral-800 dark:text-neutral-200">
                  {feat.title}
                </h3>
                <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Trust & Stats Section */}
      <section className="bg-neutral-100/50 dark:bg-neutral-900/40 border border-neutral-200/30 dark:border-neutral-800/30 p-8 md:p-12 rounded-[32px] grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div className="space-y-1">
          <p className="font-sans font-black text-3xl md:text-4xl bg-gradient-to-br from-primary-500 to-secondary-500 bg-clip-text text-transparent">+15.000</p>
          <p className="font-sans text-xs text-neutral-400 font-bold uppercase tracking-wider">Minutos Transcritos</p>
        </div>
        <div className="space-y-1">
          <p className="font-sans font-black text-3xl md:text-4xl bg-gradient-to-br from-primary-500 to-secondary-500 bg-clip-text text-transparent">99.2%</p>
          <p className="font-sans text-xs text-neutral-400 font-bold uppercase tracking-wider">Acurácia do Whisper</p>
        </div>
        <div className="space-y-1">
          <p className="font-sans font-black text-3xl md:text-4xl bg-gradient-to-br from-primary-500 to-secondary-500 bg-clip-text text-transparent">&lt; 3 min</p>
          <p className="font-sans text-xs text-neutral-400 font-bold uppercase tracking-wider">Tempo Médio de Entrega</p>
        </div>
        <div className="space-y-1">
          <p className="font-sans font-black text-3xl md:text-4xl bg-gradient-to-br from-primary-500 to-secondary-500 bg-clip-text text-transparent">100%</p>
          <p className="font-sans text-xs text-neutral-400 font-bold uppercase tracking-wider">Seguro e Confidencial</p>
        </div>
      </section>

    </div>
  );
}
