# Plano de Implementação - Correção do Cache de Configurações no Next.js (F5)

Este plano descreve os ajustes técnicos para desativar o cache de requisições de API `GET` no Next.js e no navegador, garantindo que as configurações de banco e IA persistam visivelmente após a atualização da tela (F5).

---

## 📅 Ações de Desenvolvimento

1. **Forçar Dinamicidade das Rotas de API (Backend):**
   * Adicionar `export const dynamic = "force-dynamic";` no topo do endpoint de configurações [app/api/settings/route.ts](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/app/api/settings/route.ts) e de listagem de jobs [app/api/jobs/route.ts](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/app/api/jobs/route.ts).

2. **Evitar Cache de Requisições no Navegador (Frontend):**
   * Modificar o carregamento de configurações em [app/settings/page.tsx](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/app/settings/page.tsx) adicionando a diretiva `{ cache: "no-store" }` no `fetch`.

3. **Verificação de Compilação:**
   * Executar `npm run build` na pasta raiz.

4. **Sincronização:**
   * Commitar as alterações e fazer push para o repositório remoto.

5. **Log de Desenvolvimento:**
   * Atualizar [LOG_DESENVOLVIMENTO.md](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/LOG_DESENVOLVIMENTO.md).

---

## 🧪 Plano de Verificação

* **Teste do F5:** Preencher chaves de banco ou IA, clicar em salvar (confirmando a mensagem verde de sucesso). Atualizar a página (F5) e certificar que as chaves salvas continuam preenchidas e ativas no painel de configurações.
