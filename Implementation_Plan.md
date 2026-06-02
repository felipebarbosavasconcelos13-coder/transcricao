# Plano de Implementação - Configuração em Etapas e Validação de Banco de Dados

Este plano de implementação visa reestruturar a interface e fluxo de **Configurações do Sistema**, transformando-a em um fluxo em duas etapas (Supabase / Banco Local -> Configurações de IA) com assistente de inicialização e script SQL automatizado para o banco remoto do usuário.

---

## 📅 Ações de Desenvolvimento

1. **Endpoint de Validação do Supabase:**
   * Criar a rota de API [app/api/settings/validate-supabase/route.ts](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/app/api/settings/validate-supabase/route.ts) que recebe as credenciais do Supabase, testa a conexão de dados, detecta se as tabelas existem (erro `42P01`) e retorna o script SQL [supabase/schema.sql](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/supabase/schema.sql) se necessário.

2. **Refatoração da Interface em Etapas (Stepper):**
   * Reescrever a UI em [app/settings/page.tsx](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/app/settings/page.tsx) com as seguintes etapas:
     * **Etapa 1: Banco de Dados:** Configuração do Supabase ou Mock local. Se a conexão com o Supabase for feita mas faltarem tabelas, o app exibe um card com o script SQL de tabelas e um botão "Copiar SQL" para que o usuário execute no editor SQL do Supabase.
     * **Etapa 2: Preferências de IA:** Seleção do motor de IA (OpenAI Whisper v3 ou DeepSeek ASR), campo condicional para a chave correspondente e idioma padrão.
   * Ao finalizar, persistir todas as informações de forma centralizada no backend.

3. **Verificação de Compilação:**
   * Executar `npm run build` para certificar que as tipagens e caminhos de importação estão totalmente conformes com o Next.js 16.

4. **Sincronização:**
   * Publicar as mudanças no repositório GitHub.

---

## 🧪 Plano de Verificação

* **Validação de Erros:** Tentar conectar no Supabase com credenciais inválidas.
* **Validação de Tabelas Ausentes:** Tentar conectar no Supabase usando um projeto novo (vazio), validando a exibição do script SQL e instruções de criação de tabelas.
* **Persistência de IA:** Selecionar o motor, salvar e confirmar que as chaves de API da OpenAI ou DeepSeek permanecem salvas localmente no `temp_db.json`.
