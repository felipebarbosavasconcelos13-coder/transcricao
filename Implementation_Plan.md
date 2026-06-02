# Plano de Implementação - Atigra Trans

Este documento define as etapas detalhadas para a construção e validação do aplicativo **Atigra Trans**, conforme as especificações descritas no PRD e no Product Roadmap.

O projeto consiste em um aplicativo web de transcrição de vídeo (via upload ou link do YouTube) utilizando **Next.js** com **TypeScript** e **Tailwind CSS**, integrado ao **Supabase** (Database, Storage e Auth) para gerenciamento de dados e arquivos, processando a conversão de vídeo para áudio com **ffmpeg**, e realizando transcrição e pós-processamento utilizando APIs de Inteligência Artificial da **OpenAI (Whisper e GPT)**.

---

## 📅 Visão Geral das Etapas

O desenvolvimento foi executado de forma incremental e dividida nas seguintes etapas lógicas:

### Etapa 1: Inicialização do Projeto e Design System (Concluída)
* **Ações:** Inicialização do app Next.js, configuração do Tailwind CSS v4, definição das variáveis de cores globais baseadas no HSL (paleta premium com roxo, verde água e cinzas suaves) e layout base da página com cabeçalho e menu lateral.

### Etapa 2: Simulação de Banco de Dados / Supabase Client (Concluída)
* **Ações:** Criação do cliente Supabase e do banco de dados local simulado (mock). O mock de banco de dados e de armazenamento em memória garantirá que o aplicativo funcione perfeitamente no ambiente local de desenvolvimento, mesmo se o usuário ainda não tiver as chaves de API do Supabase configuradas no `.env`.

### Etapa 3: Upload de Vídeos e Integração com YouTube (Concluída)
* **Ações:** Componente de Drag-and-drop dinâmico de vídeo com animações de hover e upload do arquivo. Input de links do YouTube com validação sintática em tempo real. Rota de API para criação e listagem dos jobs.

### Etapa 4: Engine de Processamento e Conversão (Concluída)
* **Ações:** Integração com `ytdl-core` para download de áudios do YouTube. Configuração do `ffmpeg` (empacotado localmente no node) para extrair áudio de uploads ou vídeos baixados, normalizando-o para 16kHz mono (ideal para Whisper).

### Etapa 5: Transcrição e Visualização Completa (Concluída)
* **Ações:** Envio do áudio convertido para o serviço OpenAI Whisper (ou mock para testes) e parse dos segmentos com timestamps. Criação da tela de progresso (stepper dinâmico com glows pulsing) e do visualizador de transcrição completo (player do vídeo sincronizado com destaque automático da linha sendo reproduzida, timestamps clicáveis que controlam o player e download em TXT, VTT e SRT).

### Etapa 6: Pós-processamento de IA (Concluída)
* **Ações:** Integração com GPT (OpenAI) para realizar limpeza ortográfica, pontuação automática, sumarização estruturada e identificação de highlights do vídeo. Interface para alternar entre texto bruto, texto melhorado e resumo em formato de cards.

### Etapa 7: Histórico e Busca Full-Text (Concluída)
* **Ações:** Lista tabular e em formato de grid de jobs anteriores com filtros de status e data. Implementação de busca rápida que vasculha os textos transcritos.

### Etapa 8: Autenticação, Configurações e Editor (Concluída)
* **Ações:** Integração com login de usuário (Supabase Auth ou simulador local de sessão). Configurações de modelo de transcrição e limites de uso. Editor de texto inline que permite salvar incrementalmente correções feitas na transcrição.

### Etapa 9: Compartilhamento, Colaboração e API (Concluída)
* **Ações:** Criação de sistema de anotações e comentários vinculados a timestamps específicos do player, endpoints para integração da API pública (com chaves de API) e acionamento de webhooks automáticos de notificação na conclusão do worker.

### Etapa 10: Verificação Completa e Ajustes Finais (Concluída)
* **Ações:** 
  1. Correção pontual de importações do ícone `Youtube` em `app/jobs/[id]/page.tsx`, `app/jobs/new/page.tsx` e `app/history/page.tsx` para usar o componente personalizado [YoutubeIcon.tsx](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/components/YoutubeIcon.tsx).
  2. Ajustar os Route Handlers dinâmicos da API no diretório `app/api/` para awaitar o parâmetro `params` (Next.js 15+ / Promise type checking).
  3. Execução de build de produção (`npm run build`) para verificar integridade e ausência de erros de build.
  4. Inicialização e teste local de ponta a ponta (`npm run dev`).
  5. Atualização dos arquivos `LOG_DESENVOLVIMENTO.md` e `task.md`.

---

## 🔒 Nova Etapa: Configurações e Credenciais Dinâmicas (Concluída)

* **Objetivo:** Refatorar a aba de configurações para remover qualquer lógica comercial (planos de assinatura, faturamento, cotas) e adicionar suporte à persistência dinâmica no servidor de chaves de API da OpenAI e tokens/URL do Supabase.
* **Ações:**
  1. Criação do utilitário [lib/settings.ts](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/lib/settings.ts) para ler/escrever configurações em `temp_db.json`.
  2. Criação do endpoint [app/api/settings/route.ts](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/app/api/settings/route.ts) para permitir ler e gravar configurações.
  3. Adaptação de [lib/supabaseClient.ts](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/lib/supabaseClient.ts) para usar Proxy dinâmico das credenciais em tempo de execução.
  4. Adaptação do worker e da rota `process-ia` para carregar a `OpenAI` API Key de forma dinâmica a cada execução.
  5. Sobrescrever [app/settings/page.tsx](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/app/settings/page.tsx) com a nova UI premium para input das credenciais do usuário.
