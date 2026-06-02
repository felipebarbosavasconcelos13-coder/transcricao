# Plano de Implementação - Persistência Imediata de Credenciais e Correção do F5

Este plano detalha as alterações necessárias no backend e no frontend de configurações para garantir que os dados de banco de dados e inteligência artificial sejam persistidos no backend de forma imediata ao longo do fluxo, eliminando perdas de dados em recarregamento de tela (F5).

---

## 📅 Ações de Desenvolvimento

1. **Merge de Configurações no Backend:**
   * Modificar [app/api/settings/route.ts](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/app/api/settings/route.ts) para realizar merge parcial de dados no `POST`. Apenas campos enviados no corpo da requisição substituirão as configurações salvas no `temp_db.json`.

2. **Persistência Imediata no Frontend:**
   * Modificar [app/settings/page.tsx](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/app/settings/page.tsx):
     * Salvar credenciais do Supabase no backend imediatamente ao validar com sucesso no Passo 1 ou quando o usuário clica em "Usar Banco de Dados Local".
     * Atualizar a validação silenciosa no `useEffect` de carregamento para salvar o status de conexão no estado React (habilitando o botão "Avançar" automaticamente no carregamento inicial se o banco já estiver validado).

3. **Verificação de Compilação:**
   * Executar `npm run build` na pasta raiz.

4. **Sincronização:**
   * Commitar as alterações e fazer push para o repositório remoto.

5. **Log de Desenvolvimento:**
   * Atualizar [LOG_DESENVOLVIMENTO.md](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/LOG_DESENVOLVIMENTO.md).

---

## 🧪 Plano de Verificação

* **Teste do F5:** Digitar credenciais válidas do Supabase no Passo 1, clicar em validar. Recarregar a página (F5) e verificar que as credenciais persistem no formulário e o status do banco está correto.
* **Salvamento de IA:** Avançar para o Passo 2, configurar a IA, clicar em salvar. Recarregar a página e confirmar que as chaves de banco de dados e IA persistem juntas.
