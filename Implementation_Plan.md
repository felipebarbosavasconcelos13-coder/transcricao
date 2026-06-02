# Plano de Implementação - Suporte Completo ao DeepSeek ASR

Este documento detalha o planejamento para integrar o suporte ao modelo **DeepSeek ASR** no backend (worker de processamento) e garantir que o usuário veja e configure a API Key do DeepSeek na interface.

---

## 📅 Ações de Desenvolvimento

1. **Ajustar o Worker de Transcrição:**
   * Modificar [lib/worker.ts](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/lib/worker.ts) para ler a preferência de modelo (`model`) do sistema a partir de `getSystemSettings()`.
   * Se o modelo configurado for `"deepseek-asr"`, executar a transcrição sob a chave da API do DeepSeek (usando o helper `getDeepseekApiKey()`), logando a operação no backend ou simulando a resposta em caso de chave ausente.

2. **Compilação e Verificação:**
   * Executar `npm run build` na pasta raiz para testar integridade de tipos e evitar problemas de deploy ou execução local.

3. **Publicação no GitHub:**
   * Adicionar todos os arquivos modificados ao Git.
   * Commitar as alterações e fazer o push para o repositório remoto: `https://github.com/felipebarbosavasconcelos13-coder/transcricao.git`.

4. **Registro no Log de Desenvolvimento:**
   * Adicionar detalhes da alteração no arquivo [LOG_DESENVOLVIMENTO.md](file:///c:/Users/felip/Desktop/N8N/Atigra/trans/LOG_DESENVOLVIMENTO.md).

---

## 🧪 Plano de Verificação

* **Interface Visual:** Acessar [http://localhost:3000/settings](http://localhost:3000/settings) e realizar um recarregamento forçado (F5) para validar a exibição do input **DeepSeek API Key (ASR)** e o status correspondente.
* **Execução do Job:** Criar um trabalho de transcrição com o modelo DeepSeek ativo, validar no console do backend o log indicando o uso do DeepSeek ASR.
