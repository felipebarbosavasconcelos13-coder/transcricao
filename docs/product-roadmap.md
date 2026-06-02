# Roadmap do Produto

## Produto

Aplicativo web para transcrição de vídeos a partir de upload de arquivos ou links do YouTube, com processamento por IA, armazenamento no Supabase, frontend em Next.js e deploy na Vercel.

---

## Fase 1: MVP

### Objetivo

Lançar a primeira versão funcional do produto, permitindo que o usuário envie um vídeo ou link do YouTube, acompanhe o processamento e receba a transcrição com timestamps para visualização e download.

### Funcionalidades

* Upload de vídeo por drag-and-drop.
* Seleção manual de arquivo pelo sistema.
* Campo para inserir link do YouTube.
* Validação básica de URL do YouTube.
* Extração e normalização de áudio com ffmpeg.
* Envio do áudio para serviço de transcrição.
* Armazenamento da transcrição no Supabase.
* Visualização da transcrição completa com timestamps.
* Player de vídeo integrado.
* Tela de status do processamento.
* Progresso em tempo real do job.
* Download da transcrição em TXT.
* Download da transcrição em VTT.
* Tratamento básico de erros.
* Retry simples para jobs com falha.
* Deploy inicial na Vercel.
* Repositório organizado no GitHub.

### Entregáveis técnicos

* Projeto Next.js com TypeScript.
* UI inicial responsiva.
* Integração com Supabase Database.
* Integração com Supabase Storage.
* Worker para processamento de jobs.
* Pipeline de processamento:

  * Upload
  * Conversão de vídeo para áudio
  * Transcrição
  * Salvamento da transcrição
  * Atualização de status
* Endpoint para criação de jobs.
* Endpoint para consulta de status.
* Endpoint para download da transcrição.
* Configuração inicial de CI/CD.
* Documentação básica do projeto.

### Critérios de aceite

* O usuário consegue fazer upload de um vídeo.
* O usuário consegue inserir um link válido do YouTube.
* O sistema cria um job de transcrição.
* O usuário consegue acompanhar o status do processamento.
* A transcrição é salva no banco de dados.
* A transcrição aparece na tela com timestamps.
* O usuário consegue baixar a transcrição em TXT e VTT.
* Erros básicos são exibidos de forma clara na interface.

---

## Fase 2: Pós-processamento com IA

### Objetivo

Melhorar a qualidade da transcrição usando IA para limpeza textual, pontuação, organização do conteúdo e geração de resumo.

### Funcionalidades

* Limpeza automática da transcrição.
* Correção de pontuação e quebras de linha.
* Geração de resumo com IA.
* Geração de highlights do conteúdo.
* Botão para solicitar pós-processamento.
* Salvamento da versão bruta e da versão processada.
* Exibição comparativa entre transcrição bruta e melhorada.

### Entregáveis técnicos

* Integração com GPT para pós-processamento.
* Tabela ou campos adicionais no Supabase para salvar versões da transcrição.
* Endpoint para gerar resumo.
* Endpoint para melhorar transcrição.
* Interface para exibir resumo e highlights.
* Controle de status do pós-processamento.

### Critérios de aceite

* O usuário consegue gerar uma versão limpa da transcrição.
* O usuário consegue gerar um resumo do conteúdo.
* A versão original e a versão processada ficam salvas.
* O sistema exibe feedback durante o processamento da IA.
* O usuário consegue copiar ou exportar o resumo.

---

## Fase 3: Histórico e pesquisa

### Objetivo

Permitir que o usuário organize, acesse e pesquise transcrições anteriores com mais facilidade.

### Funcionalidades

* Histórico de jobs.
* Filtros por status, data e duração.
* Busca por palavra dentro da transcrição.
* Visualização de metadados do vídeo.
* Reprocessamento de jobs antigos.
* Exclusão de jobs.
* Download direto pelo histórico.

### Entregáveis técnicos

* Página de histórico.
* Tabela/listagem de jobs.
* Busca full-text usando Postgres/Supabase.
* Filtros por status e data.
* Endpoint para deletar job.
* Endpoint para reprocessar job.
* Melhorias de indexação no banco.

### Critérios de aceite

* O usuário consegue ver todos os jobs anteriores.
* O usuário consegue abrir uma transcrição antiga.
* O usuário consegue buscar palavras dentro da transcrição.
* O usuário consegue reprocessar um job.
* O usuário consegue deletar um job.
* A listagem continua rápida mesmo com vários registros.

---

## Fase 4: Visualizador avançado de transcrição

### Objetivo

Melhorar a experiência de consumo da transcrição, conectando o texto ao player de vídeo de forma mais fluida.

### Funcionalidades

* Sincronização entre player e transcrição.
* Destaque automático da frase atual.
* Timestamps clicáveis.
* Scroll automático da transcrição.
* Busca com destaque de palavras encontradas.
* Contador de palavras.
* Estimativa de qualidade da transcrição.
* Exportação de trechos selecionados.

### Entregáveis técnicos

* Integração avançada com react-player.
* Controle de tempo atual do vídeo.
* Mapeamento entre timestamps e linhas da transcrição.
* Virtualização da transcrição para vídeos longos.
* UI otimizada para desktop e mobile.
* Componentes de busca e destaque.

### Critérios de aceite

* Ao clicar em um timestamp, o vídeo pula para o trecho correto.
* Durante a reprodução, a linha atual da transcrição é destacada.
* A rolagem automática não trava a interface.
* A busca destaca corretamente os termos encontrados.
* Transcrições longas continuam performando bem.

---

## Fase 5: Autenticação e conta de usuário

### Objetivo

Permitir que cada usuário tenha sua própria área, histórico privado e configurações personalizadas.

### Funcionalidades

* Cadastro de usuário.
* Login e logout.
* Histórico vinculado ao usuário.
* Configurações de idioma.
* Preferência de modelo de transcrição.
* Preferências de exportação.
* Controle de limite de upload por usuário.
* Proteção de rotas privadas.

### Entregáveis técnicos

* Integração com Supabase Auth.
* Regras de segurança no banco.
* Políticas de acesso por usuário.
* Página de configurações.
* Middleware de autenticação.
* Ajustes nas tabelas para relacionar jobs ao usuário.

### Critérios de aceite

* O usuário consegue criar uma conta.
* O usuário consegue fazer login.
* Cada usuário vê apenas seus próprios jobs.
* Jobs e arquivos ficam protegidos por regras de acesso.
* As preferências do usuário são salvas corretamente.

---

## Fase 6: Editor de transcrição

### Objetivo

Permitir que o usuário corrija manualmente a transcrição dentro da própria plataforma.

### Funcionalidades

* Edição inline da transcrição.
* Salvamento automático.
* Histórico de alterações.
* Undo e redo.
* Correção de timestamps.
* Exportação da versão editada.
* Marcação de trechos importantes.

### Entregáveis técnicos

* Editor inline para segmentos da transcrição.
* Salvamento incremental no Supabase.
* Controle de versões.
* Interface de edição por linha ou bloco.
* Sistema de marcação de trechos.
* Exportação usando a versão editada.

### Critérios de aceite

* O usuário consegue editar trechos da transcrição.
* As alterações são salvas automaticamente.
* O usuário consegue desfazer alterações recentes.
* A versão editada pode ser exportada.
* A experiência de edição funciona bem em transcrições longas.

---

## Fase 7: Compartilhamento e colaboração

### Objetivo

Permitir que usuários compartilhem transcrições com outras pessoas e trabalhem de forma colaborativa.

### Funcionalidades

* Compartilhamento por link.
* Link público ou privado.
* Controle de permissões.
* Papel de visualizador.
* Papel de editor.
* Comentários em timestamps.
* Colaboração em transcrições.

### Entregáveis técnicos

* Sistema de permissões.
* Página pública de visualização.
* Controle de acesso por token ou usuário.
* Comentários vinculados a timestamps.
* Notificações básicas de colaboração.
* Logs de alterações por usuário.

### Critérios de aceite

* O usuário consegue gerar um link de compartilhamento.
* O usuário consegue definir se o link é público ou privado.
* Usuários com permissão conseguem visualizar a transcrição.
* Usuários com permissão de edição conseguem alterar o texto.
* Comentários aparecem no timestamp correto.

---

## Fase 8: Recursos avançados de IA

### Objetivo

Transformar a plataforma em uma ferramenta inteligente de análise de conteúdo em vídeo.

### Funcionalidades

* Separação de falantes.
* Identificação de tópicos.
* Extração de perguntas e respostas.
* Detecção de entidades.
* Análise de sentimento.
* Geração de capítulos.
* Geração de títulos e descrições.
* Geração de posts a partir da transcrição.
* Geração de cortes sugeridos para redes sociais.

### Entregáveis técnicos

* Integração com modelos de diarização.
* Pipeline de análise semântica.
* Estrutura para salvar tópicos, entidades e capítulos.
* Interface para exibir insights.
* Endpoint para geração de conteúdos derivados.
* Sistema de filas para análises mais pesadas.

### Critérios de aceite

* O sistema consegue separar falantes com precisão aceitável.
* O sistema consegue gerar capítulos automáticos.
* O usuário consegue visualizar tópicos principais.
* O usuário consegue gerar conteúdos derivados da transcrição.
* As análises ficam salvas e podem ser acessadas depois.

---

## Fase 9: API pública e integrações

### Objetivo

Permitir que terceiros integrem a plataforma em seus próprios fluxos de trabalho.

### Funcionalidades

* API pública para criar jobs.
* API para consultar status.
* API para recuperar transcrições.
* Webhooks de atualização de status.
* Chaves de API por usuário.
* Documentação pública.
* Integrações com Google Drive, S3 e Zoom.
* SDK básico para desenvolvedores.

### Entregáveis técnicos

* Sistema de API keys.
* Rate limiting por usuário.
* Documentação com exemplos.
* Webhooks configuráveis.
* Logs de chamadas da API.
* Página de gerenciamento de integrações.
* SDK inicial em JavaScript ou TypeScript.

### Critérios de aceite

* Um usuário consegue gerar uma chave de API.
* Um sistema externo consegue criar um job via API.
* O status do job pode ser consultado via API.
* A transcrição pode ser recuperada via API.
* Webhooks são disparados nos eventos corretos.
* A documentação permite integração sem suporte manual.

---

## Fase 10: Escala, monetização e operação

### Objetivo

Preparar o produto para uso comercial, com planos pagos, controle de custos e infraestrutura escalável.

### Funcionalidades

* Planos de assinatura.
* Limites por plano.
* Controle de minutos transcritos.
* Billing.
* Dashboard de uso.
* Monitoramento de custos.
* Fila escalável de jobs.
* Multi-região.
* SLA comercial.
* Painel administrativo.

### Entregáveis técnicos

* Integração com Stripe ou outro gateway.
* Sistema de planos e limites.
* Monitoramento de minutos processados.
* Escalabilidade horizontal dos workers.
* Observabilidade com Sentry, Logflare ou equivalente.
* Dashboard administrativo.
* Alertas operacionais.
* Políticas de retenção de arquivos.

### Critérios de aceite

* Usuários conseguem assinar um plano.
* O sistema controla limites de uso por usuário.
* O processamento escala conforme a demanda.
* O administrador consegue visualizar uso, erros e custos.
* Arquivos antigos seguem política de retenção.
* O produto está pronto para operação comercial.

---

## Priorização geral

### Prioridade alta

* Upload de vídeo.
* Link do YouTube.
* Pipeline de transcrição.
* Supabase para armazenamento.
* Progresso do job.
* Visualização com timestamps.
* Download TXT e VTT.
* Deploy funcional.

### Prioridade média

* Pós-processamento com IA.
* Resumo automático.
* Histórico de jobs.
* Busca na transcrição.
* Sincronização com player.
* Login e conta de usuário.

### Prioridade baixa

* Editor inline.
* Colaboração.
* Separação de falantes.
* API pública.
* Integrações externas.
* Recursos avançados de análise.

---

## Riscos e dependências

### Riscos técnicos

* Limitações de tempo em funções serverless.
* Processamento pesado de vídeos grandes.
* Custos altos com transcrição e IA.
* Bloqueios ou instabilidade na extração de áudio do YouTube.
* Dificuldade de sincronização precisa entre player e transcrição.
* Performance ruim em transcrições muito longas.

### Mitigações

* Usar worker separado para tarefas longas.
* Processar arquivos em chunks.
* Definir limite de tamanho no MVP.
* Implementar fila de jobs.
* Monitorar custos por job.
* Salvar logs detalhados de erro.
* Usar virtualização para transcrições longas.
* Criar política clara de retenção de arquivos.

---

## Ordem sugerida de desenvolvimento

1. Configurar repositório, stack e estrutura base.
2. Criar layout inicial e componentes principais.
3. Configurar Supabase Database e Storage.
4. Implementar upload de vídeo.
5. Implementar criação de job.
6. Implementar worker de processamento.
7. Implementar conversão de vídeo para áudio.
8. Integrar serviço de transcrição.
9. Salvar transcrição no Supabase.
10. Criar tela de status.
11. Criar visualizador de transcrição.
12. Implementar download em TXT.
13. Implementar download em VTT.
14. Adicionar tratamento de erros.
15. Adicionar retry simples.
16. Fazer deploy na Vercel.
17. Testar fluxo completo.
18. Melhorar UI e responsividade.
19. Implementar pós-processamento com IA.
20. Implementar histórico e busca.
