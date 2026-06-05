# Plano de Implementação - Simplificação e Botões de Copiar no Atigra Trans

Este plano descreve as modificações necessárias para tornar o app Atigra Trans mais direto e ágil para uso pessoal, eliminando telas desnecessárias e facilitando a cópia de transcrições brutas e corrigidas.

---

## 📅 Ações de Desenvolvimento

1. **Remover a Landing Page (Marketing):**
   * [x] Substituir o conteúdo de [app/page.tsx](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/app/page.tsx) por um redirecionamento direto `redirect("/jobs/new")`.
   * [x] Modificar os links do logo em [components/AppLayout.tsx](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/components/AppLayout.tsx) de `href="/"` para `href="/jobs/new"`.

2. **Adicionar Botões de Copiar nas Transcrições:**
   * [x] Importar ícones `Copy` e `Check` do `lucide-react` em [app/jobs/[id]/page.tsx](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/app/jobs/[id]/page.tsx).
   * [x] Implementar a função `handleCopy` com fallback para navegadores antigos e controle de estado de cópia.
   * [x] Integrar botão de cópia na transcrição bruta (`TextPanel`).
   * [x] Integrar botão de cópia na transcrição revisada por IA com verificação de conteúdo (`hasReviewedText`).

3. **Verificação de Compilação:**
   * [x] Executar `npm run build` na pasta raiz para atestar a ausência de erros de build e tipagem.

4. **Log de Desenvolvimento:**
   * [x] Atualizar o arquivo [LOG_DESENVOLVIMENTO.md](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/LOG_DESENVOLVIMENTO.md) registrando as alterações do botão de copiar.

---

## 🧪 Plano de Verificação

* **Verificação do Build:** Executar `npm run build` e confirmar que o Next.js compilou todo o projeto sem erros.
* **Teste de Redirecionamento:** Acessar a rota raiz `/` e certificar que o redirecionamento acontece direto para `/jobs/new`.
* **Teste dos Botões de Copiar:** Acessar a tela de detalhes de um trabalho completo (`/jobs/[id]`) e clicar nos botões de cópia rápida das abas "Transcrição Bruta" e "Revisada por IA". Validar se o texto correspondente foi enviado para o clipboard com feedback visual (ícone de check por 2 segundos).
