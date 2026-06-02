## Visão Geral do Produto
- Descrição concisa  
  Aplicativo web que recebe upload de vídeo ou link do YouTube e devolve a transcrição completa do conteúdo, usando serviços de transcrição (por exemplo OpenAI Whisper / DeepSeek) e IA (GPT) para pós-processamento (limpeza, sumário, timestamps). Armazenamento e estado em Supabase; frontend em Next.js (deploy na Vercel). Repositório no GitHub.

- Público-alvo  
  Criadores de conteúdo, jornalistas, pesquisadores, equipes de produto que precisam de transcrições rápidas e pesquisáveis de vídeos, professores e alunos que querem material textual a partir de aulas em vídeo.

- Proposta de valor única  
  Transcrição rápida e precisa diretamente de upload ou link do YouTube com pós-processamento de IA (limpeza, timestamps, sumário) e interface fluida com feedback em tempo real e integração direta com Supabase para armazenamento e histórico.

---

## Requisitos Funcionais
- Lista de requisitos principais (alto nível)
  1. Receber upload de arquivo de vídeo (mp4, mov, mkv) via UI e API.
  2. Receber link do YouTube e baixar / extrair áudio de forma confiável.
  3. Converter vídeo → áudio (mono, 16 kHz/16-bit recomendado) antes da transcrição.
  4. Enviar áudio para motor de transcrição (Whisper API, DeepSeek API ou solução self-hosted).
  5. Armazenar transcrição bruta e pós-processada no Supabase (textos, timestamps, metadata).
  6. Fornecer interface para visualizar transcrição sincronizada com player (scrub / highlight).
  7. Mostrar progresso do job (upload, conversão, transcrição, pós-processamento).
  8. Permitir download de transcrição em TXT, SRT, VTT.
  9. Permitir resumo/autosintetização via GPT (opcional).
  10. Histórico de jobs e reprocessamento (re-transcribe, melhorar com modelos diferentes).
  11. API pública/privada para disparar jobs via backend.
  12. Notificações em tempo real de atualização de job (WebSocket/Supabase Realtime).
  13. Logs básicos de erro e retrials para jobs falhos.
  14. Interface responsiva e acessível.

- Priorização MoSCoW
  - Must have
    - Upload de vídeo por arrastar/soltar e seleção de arquivo.
    - Input de URL do YouTube com validação.
    - Extração/normalização de áudio (ffmpeg).
    - Envio para serviço de transcrição e armazenamento do texto.
    - Visualização da transcrição completa e timestamps.
    - Progresso do processamento e notificações em tempo real.
    - Download de transcrição (TXT, SRT, VTT).
    - Repositório no GitHub; deploy no Vercel; armazenamento no Supabase.
    - API/endpoint para iniciar jobs.
  - Should have
    - Pós-processamento com GPT para limpeza, pontuação e sumário.
    - Pesquisa dentro da transcrição (full-text) com indexação (Supabase/Postgres).
    - Sincronização do player com destaque de frase atual (playback sync).
    - Histórico de trabalhos com metadados.
    - Exportar segmentos selecionados.
  - Could have
    - Speaker diarization (separação de falantes).
    - Editor inline da transcrição (correção manual com salvamento incremental).
    - Compartilhamento público/privado por link.
    - Integração com YouTube captions quando existirem (mesclar).
    - Integração com serviços de armazenamento externos (S3, Google Drive).
  - Won't have (nesta versão)
    - Transcrição de streaming em tempo real (live streaming).
    - Integrações com fontes além de upload/YouTube (p.ex. Zoom direto).
    - Aplicativos nativos mobile dedicados (apenas PWA/Responsivo).

---

## Histórias de Usuário
- Como visitante, eu quero colar um link do YouTube para que eu possa obter a transcrição do vídeo sem baixar o arquivo.
- Como usuário, eu quero arrastar e soltar um arquivo de vídeo para que eu possa transcrever rapidamente.
- Como usuário, eu quero ver um indicador de progresso detalhado (upload, conversão, transcrição) para saber quanto tempo falta.
- Como usuário, eu quero visualizar a transcrição completa com timestamps para localizar rapidamente trechos.
- Como usuário, eu quero baixar a transcrição em TXT, SRT ou VTT para usar em editores ou legendadores.
- Como usuário, eu quero solicitar um resumo gerado por IA para obter insights rápidos do conteúdo.
- Como usuário, eu quero poder pesquisar por palavras dentro de uma transcrição para encontrar referências rapidamente.
- Como usuário, eu quero que o texto seja limpo (pontuação, quebras) automaticamente para ficar legível sem edição manual.
- Como administrador, eu quero logs de jobs e reprocessamento para solucionar problemas de transcrição.

---

## Estrutura de Páginas/Seções
- Hierarquia de navegação (top-level)
  - Home / Landing
  - Novo Job (Upload / YouTube)
  - Job / Status (fila, progresso)
  - Visualizador de Transcrição (player + transcript)
  - Histórico de Jobs
  - Configurações (opções de export, preferências de idioma)
  - (Opcional, Fase 2) Conta / Login

- Wireframes em texto para cada página principal

  1. Home / Landing  
     - Header: logotipo (esquerda), CTA "Start transcribing" (direita).  
     - Hero: título curto, subtítulo, dois botões (Upload vídeo / Usar link do YouTube).  
     - Features: 3 cards com ícones (rápido, preciso, exportável).  
     - Footer: links de GitHub, políticas e contato.

  2. Novo Job (Upload / YouTube)  
     - Top: Breadcrumb / voltar home.  
     - Área central: large drag-and-drop box com ícone animado, texto "Arraste um vídeo ou cole um link do YouTube".  
     - Campo de URL (validar domínio youtube.com / youtu.be) com botão "Iniciar Transcrição".  
     - Botão alternativo "Upload arquivo" que abre seletor do SO.  
     - Pequena nota: formatos suportados e tamanho máximo.  
     - Abaixo: histórico rápido de jobs recentes (mini cards).

  3. Job / Status (Fila e Progresso)  
     - Left: job card com meta (nome do arquivo, duração, tamanho).  
     - Center: passo a passo visual (1. Upload → 2. Conversão → 3. Transcrição → 4. Pós-processamento) com ícones; cada etapa tem barra de progresso e status (pendente/erro/concluído).  
     - Right: ações (cancelar job, reprocessar, download).  
     - Notificações em tempo real/area de log.

  4. Visualizador de Transcrição (Player + Transcript)  
     - Top: video player (usando react-player) com controles familiares (play, scrub, volume).  
     - Middle-left: timeline/mini wave visual do áudio com thumbnails (opcional).  
     - Middle-right (ou abaixo em mobile): transcript pane — texto com timestamps clicáveis; linhas longas quebram com palavra-chave em destaque quando buscadas.  
     - Controles: botão exportar, pedir resumo IA, editar, marcar trechos.  
     - Small: contador de palavras e qualidade estimada da transcrição.

  5. Histórico de Jobs  
     - Lista/tabular com filtros (status, data, duração).  
     - Cada linha com ações rápidas (abrir, baixar, reprocessar, deletar).

  6. Configurações  
     - Preferências de idioma e modelo de transcrição (p.ex. Whisper vs DeepSeek), opções de export, limites de upload, preferências de notificação.

---

## Design e Interações
- Paleta de cores sugerida
  - Primária: Azul-arroxeado (#6C5CE7) — para CTAs e destaque.
  - Secundária: Verde água (#00C2A8) — para sucesso e ações confirmadas.
  - Fundo: Cinza claro (#F7F9FC) — para áreas principais.
  - Texto principal: Cinza-escuro (#111827).
  - Subtexto: Cinza médio (#6B7280).
  - Aviso/Erro: Vermelho suave (#EF4444) para erros.

- Tipografia
  - Cabeçalhos: Inter / Semi-Bold (usando variable font) — legibilidade e neutralidade.
  - Corpo: Inter / Regular.
  - Mono: JetBrains Mono ou SF Mono para visualização de timestamps ou exports.

- Animações e microinterações (detalhes técnicos)
  1. Drag-and-drop box (estado idle → hover → drop)  
     - Efeito: suave levantamento (translateY: -6px), sombra intensificada e borda tracejada animada em loop leve.  
     - Técnica: Framer Motion variants; onHover: scale(1.02), y: -6, boxShadow transition spring (damping 16). Tracejado animado: CSS background-position animado ou SVG stroke-dashoffset via CSS animation.  
     - Duração / easing: hover transition 220ms, spring stiffness 250/damping 22.

  2. Upload progress (chunked progress bar)  
     - Efeito: barra com preenchimento easing tipo spring + pulsing shimmer sobre a barra.  
     - Técnica: Framer Motion for width interpolation; use requestAnimationFrame for smooth incremental updates when receiving chunked progress. Use SVG linearGradient for shimmer overlay animado.  
     - Detail: animate width from 0→100 with useTransform on motionValue; duration 400ms, ease: easeOut.

  3. Stepper de processamento (passos: Upload → Convert → Transcribe → Post-process)  
     - Efeito: cada etapa aparece com staggered entrance (slideUp + fade), etapa ativa tem glow pulsing.  
     - Técnica: GSAP timeline ou Framer Motion staggerChildren; stage active pulsing via CSS animation (box-shadow 0 0 0 6px rgba(108,92,231,0.12) scale effect).  
     - Durations: entrance 320ms per child, stagger 80ms.

  4. Transcript playback sync (highlight de frase atual)  
     - Efeito: quando o player alcança o timestamp, a linha correspondente tem highlight com transição de background color (soft) + subtle left border indicator; rolagem automática suave para manter a linha visível.  
     - Técnica: use requestAnimationFrame loop para samplear currentTime do player (ou use player callbacks). Use Framer Motion to animate backgroundColor and translateX for smooth highlight; use element.scrollIntoView({behavior: 'smooth', block: 'center'}) com debounce para evitar jitter.  
     - Performance: virtualize o transcript (react-window) para longas transcrições e use IntersectionObserver para otimizar scroll syncing.

  5. Typewriter / Live summary generation  
     - Efeito: quando o resumo via GPT chega, exibir com typewriter suave e pequeno cursor animado.  
     - Técnica: CSS steps animation or Framer Motion staggered characters. For very long text, render in chunks to avoid layout thrash. Use Lottie for celebratory micro-animation quando a summary estiver pronta.

  6. Error / Retry microinteraction  
     - Efeito: erro card shake (subtle x-translate) + call-to-action animado para retry (pulse).  
     - Técnica: Framer Motion keyframe small x oscillations; duration 420ms.

  7. List entrance and reflow  
     - Efeito: staggered fade + upward motion for each job in history.  
     - Técnica: Framer Motion AnimatePresence for mounting/unmounting with layout prop for smooth reflow.

- Bibliotecas recomendadas (animação e UI)
  - Framer Motion — animações React declarativas, layout and shared layout transitions, gestures. (Recomendado para a maioria das microinterações.)
  - GSAP (GreenSock) — timelines complexas e sincronização de múltiplas propriedades (útil para timeline/waveform avançada).
  - Lottie + lottie-react — animações vetoriais para ilustrações e loaders de alta qualidade (hero & celebratory micro-animations).
  - react-player — para embed e controle de playback de YouTube/local video.
  - ffmpeg (binário no worker) ou ffmpeg.wasm (apenas se fizer client-side, com cautela) — para conversão de vídeo → áudio.
  - react-window / react-virtualized — virtualização para transcrições longas.
  - Tailwind CSS (com Headless UI) ou Chakra UI para componentes acessíveis e consistentes.
  - Axios / fetch para chamadas; use SWR/React-Query para caches e polling leve de estado.

---

## Considerações Técnicas
- Stack tecnológica sugerida
  - Frontend: Next.js (React) + TypeScript, Tailwind CSS, Framer Motion, react-player. Deploy na Vercel.
  - Backend/API: Vercel Serverless Functions (edge para rotas leves) + Worker/Background Job (Cloud Run / DigitalOcean droplet / serverless com suporte a long-running tasks) para tarefas pesadas (download YouTube, ffmpeg, envio para transcrição).
  - Banco/Storage: Supabase (Postgres) para metadados, Supabase Storage (S3-compatible) para arquivos de vídeo/áudio/transcrições.
  - Filas: Preferível usar uma fila (BullMQ / Redis) ou Supabase + Realtime triggers para orquestrar jobs.
  - Transcrição: OpenAI Whisper API ou DeepSeek API. Alternativa self-hosted: Whisper (local) em worker com GPU/CPU dedicado.
  - GPT: OpenAI GPT-4/3.5 para limpeza, resumo e melhoria textual.
  - Observability: Sentry / Logflare, monitorização de jobs e métricas.

- Integrações necessárias
  - YouTube extraction: ytdl-core (server-side) ou YouTube-dl/yt-dlp em worker para baixar áudio. Se optar por usar apenas um API de terceiros que aceite URL, reduzirá a infraestrutura.
  - ffmpeg: conversão de formatos (recomenda-se ffmpeg binário no worker). Convém usar flags: -ac 1 -ar 16000 -sample_fmt s16 para compatibilidade ASR.
  - OpenAI API (Whisper / GPT) ou DeepSeek API.
  - Supabase: autenticação (opcional), storage, Realtime para updates no frontend.
  - GitHub: CI/CD, PRs e deploy automático na Vercel.

- Requisitos de performance
  - Tempo objetivo para iniciar transcrição: < 30s após upload concluído (dependendo do tamanho, idealmente pipeline assíncrono com confirmação).  
  - Throughput objetivo MVP: suportar transcrições simultâneas básicas (p.ex. 3–5 jobs simultâneos em configuração pequena); planejar escalabilidade horizontal.  
  - Latência: para um vídeo de 10 minutos, alvo de entrega de transcrição: 1–5 minutos (quando usando Whisper API). Se self-hosted, variar conforme hardware.  
  - Sanitização e chunking: para arquivos grandes (>1GB), usar chunked upload e processar áudio em segmentos para evitar timeouts e para paralelização de requests de ASR.  
  - Storage retention: políticas padrão (ex.: 30 dias grátis, depois arquivamento ou exclusão) para controlar custos.

- Segurança e privacidade (essenciais)
  - Validar e sanitizar URLs do YouTube. Não executar código arbitrary.  
  - Scanner básico para tipos de arquivo e tamanho.  
  - TLS obrigatório, políticas CORS restritivas.  
  - Criptografia em repouso para arquivos sensíveis (usando Supabase storage encryption).  
  - Consentimento/terms para uso de IA e armazenamento de dados.  
  - Rate-limiting e proteção contra uploads maliciosos (p.ex. vídeo muito grande com payload).

---

## Roadmap Sugerido
- MVP (Fase 1)
  - Funcionalidades mínimas:
    - Upload por drag-and-drop e input de link do YouTube com validação básica.
    - Pipeline assíncrona: upload → ffmpeg conversão → envio para Whisper/DeepSeek → armazenamento da transcrição no Supabase.
    - Visualizador de transcrição com timestamps e player (react-player).
    - Progresso em tempo real via Supabase Realtime ou WebSocket.
    - Download de transcrição em TXT e VTT.
    - Repositório GitHub com CI básico; deploy automático na Vercel.
    - UI responsiva e animações básicas com Framer Motion (drag-drop, progress bar, stepper).
    - Logging básico e tratamento de erros com re-try simples.
  - Entregáveis técnicos:
    - Arquitetura de jobs (worker), template de infra para deploy, documentação de endpoints, conta Supabase configurada.

- Melhorias futuras (Fase 2)
  - Funcionalidades enriquecidas:
    - Pós-processamento com GPT: limpeza, pontuação automática, sumarização e geração de highlights.
    - Pesquisa full-text nas transcrições, filtros e tags.
    - Export para SRT com ajuste fino de timestamps e edição inline.
    - Reprocessamento com modelos alternativos e comparação de qualidade.
    - Autenticação/Conta de usuário (Supabase Auth) e histórico por usuário.
    - Speaker diarization e timecodes detalhados.
    - Compartilhamento via link público/privado e roles (visualizador/editor).
  - Melhorias UX:
    - Editor inline de transcrição com salvamento incremental e undo/redo.
    - Otimizações de performance (virtualization, caching de resultados).
    - Mais animações refinadas (GSAP timelines para waveform + sync).

- Visão de longo prazo (Fase 3)
  - Escala e integrações avançadas:
    - Suporte a múltiplas fontes (Zoom, Google Drive, S3 integrations).
    - SDK / API pública completa para automações e integrações de terceiros.
    - Workflow colaborativo (múltiplos editores, comentários em timestamps).
    - Análises automáticas por IA (entidades, tópicos, sentimentos, perguntas/respostas).
    - Marketplace de modelos (escolha de modelos de transcrição / customização com tuning).
    - Otimização para operações em larga escala, multi-região, SLAs comerciais.
    - Mobile apps nativos e plugin para editores de vídeo.