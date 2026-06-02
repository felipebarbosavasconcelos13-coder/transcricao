# Plano de Implementação - Correção na Detecção de Tabelas Ausentes (Supabase)

Este plano detalha o ajuste na API de validação do banco de dados remoto para capturar erros de schema cache do Supabase (código `PGRST205`) e liberar o assistente de script SQL para o usuário.

---

## 📅 Ações de Desenvolvimento

1. **Ajustar Endpoint de Validação:**
   * Modificar [app/api/settings/validate-supabase/route.ts](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/app/api/settings/validate-supabase/route.ts) para capturar o código de erro `PGRST205` ou o texto `"Could not find the table"` e classificar como tabelas ausentes (`tablesExist: false`), retornando o script SQL de criação.

2. **Verificação de Compilação:**
   * Executar `npm run build` na pasta raiz.

3. **Sincronização:**
   * Comitar as alterações e fazer push para o repositório remoto.

4. **Log de Desenvolvimento:**
   * Atualizar [LOG_DESENVOLVIMENTO.md](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/LOG_DESENVOLVIMENTO.md).

---

## 🧪 Plano de Verificação

* Clicar em **Validar Banco de Dados** com o Supabase atual (que não possui as tabelas) e certificar que o painel amarelo de script SQL abre com as instruções.
