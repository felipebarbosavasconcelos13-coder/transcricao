import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Caminho do banco de dados local simulado (JSON)
const MOCK_DB_PATH = path.join(process.cwd(), "temp_db.json");

// Função auxiliar para inicializar o banco de dados temporário local
function getMockDb() {
  if (typeof window !== "undefined") {
    // No lado do cliente, se necessário, manter em memória ou local storage
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem("atigra_mock_db");
        return data ? JSON.parse(data) : { jobs: [], transcripts: [], comments: [] };
      } catch (e) {
        return { jobs: [], transcripts: [], comments: [] };
      }
    }
  }
  
  // No lado do servidor, usar arquivo JSON persistente
  try {
    if (!fs.existsSync(MOCK_DB_PATH)) {
      const initialDb = { jobs: [], transcripts: [], comments: [] };
      fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    const content = fs.readFileSync(MOCK_DB_PATH, "utf8");
    return JSON.parse(content);
  } catch (e) {
    console.error("Erro ao ler banco de dados mock:", e);
    return { jobs: [], transcripts: [], comments: [] };
  }
}

// Função auxiliar para salvar no banco de dados temporário local
function saveMockDb(db: any) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("atigra_mock_db", JSON.stringify(db));
    } catch (e) {
      console.error("Erro ao salvar LocalStorage mock:", e);
    }
    return;
  }
  
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error("Erro ao salvar banco de dados mock:", e);
  }
}

import { getSupabaseUrl, getSupabaseAnonKey } from "./settings";

// Variável mutável para live binding do status do mock
export let isUsingMock = true;

// Cache para o cliente real
let cachedRealClient: any = null;
let cachedRealUrl = "";
let cachedRealKey = "";

// Função para retornar o cliente ativo do Supabase (Real ou Mock)
export function getActiveSupabaseClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  
  const isConfigured = url && key && 
    !url.includes("seu_supabase_url") && 
    !key.includes("sua_supabase_key");

  isUsingMock = !isConfigured;

  if (!isConfigured) {
    return createMockSupabaseClient();
  }

  if (!cachedRealClient || cachedRealUrl !== url || cachedRealKey !== key) {
    cachedRealClient = createClient(url, key);
    cachedRealUrl = url;
    cachedRealKey = key;
    console.log("⚡ Supabase Real Client instanciado dinamicamente com sucesso!");
  }

  return cachedRealClient;
}

// Proxy dinâmico do Supabase
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    const client = getActiveSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  }
});

// Criador de cliente mock com a mesma assinatura básica do Supabase
function createMockSupabaseClient() {
  console.log("⚠️ Supabase não configurado. Utilizando Modo de Banco de Dados Mock.");

  return {
    from(tableName: string) {
      return new MockQueryBuilder(tableName);
    },
    storage: {
      from(bucketName: string) {
        return {
          async upload(filePath: string, fileBody: any, options?: any) {
            console.log(`[MOCK STORAGE] Upload do arquivo ${filePath} para o bucket ${bucketName}`);
            // No mock, retornamos um caminho simulado público
            return { data: { path: filePath }, error: null };
          },
          getPublicUrl(filePath: string) {
            console.log(`[MOCK STORAGE] Obtendo URL pública para ${filePath}`);
            // Retornamos um caminho local ou simulado
            return { data: { publicUrl: `/api/mock-media?path=${encodeURIComponent(filePath)}` } };
          },
          async remove(paths: string[]) {
            console.log(`[MOCK STORAGE] Removendo arquivos do bucket ${bucketName}:`, paths);
            return { data: paths, error: null };
          }
        };
      }
    },
    auth: {
      async getUser() {
        // Simula usuário logado de testes no mock
        return { data: { user: { id: "mock-user-id", email: "usuario@teste.com" } }, error: null };
      },
      async getSession() {
        return { data: { session: { user: { id: "mock-user-id", email: "usuario@teste.com" } } }, error: null };
      },
      onAuthStateChange(callback: any) {
        // No-op
        return { data: { subscription: { unsubscribe() {} } } };
      }
    }
  };
}

// Construtor de consultas encadeadas fictício
class MockQueryBuilder {
  private tableName: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderByColumn: string | null = null;
  private orderDescending: boolean = false;
  private limitCount: number | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = "*") {
    // Apenas retorna o builder para manter a sintaxe fluent
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item: any) => item[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((item: any) => item[column] !== value);
    return this;
  }

  like(column: string, pattern: string) {
    const regex = new RegExp(pattern.replace(/%/g, ".*"), "i");
    this.filters.push((item: any) => regex.test(item[column] || ""));
    return this;
  }

  ilike(column: string, pattern: string) {
    return this.like(column, pattern);
  }

  textSearch(column: string, query: string, options?: any) {
    if (!query) return this;
    const words = query.toLowerCase().split(/\s+/);
    this.filters.push((item: any) => {
      const text = (item[column] || "").toLowerCase();
      return words.every((word: string) => text.includes(word));
    });
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderByColumn = column;
    this.orderDescending = !ascending;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  // Executa filtros na lista
  private executeQuery(data: any[]): any[] {
    let result = [...data];
    
    // Aplicar filtros
    for (const filter of this.filters) {
      result = result.filter(filter);
    }

    // Ordenação
    if (this.orderByColumn) {
      const col = this.orderByColumn;
      result.sort((a, b) => {
        const valA = a[col];
        const valB = b[col];
        if (valA < valB) return this.orderDescending ? 1 : -1;
        if (valA > valB) return this.orderDescending ? -1 : 1;
        return 0;
      });
    }

    // Limite
    if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }

    return result;
  }

  async execute() {
    const db = getMockDb();
    const tableData = db[this.tableName] || [];
    const data = this.executeQuery(tableData);
    return { data, error: null };
  }

  // Equivalente ao resolvedor do Supabase (thenable)
  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async single() {
    const { data } = await this.execute();
    return { data: data[0] || null, error: data[0] ? null : { message: "Registro não encontrado" } };
  }

  async insert(newData: any) {
    const db = getMockDb();
    if (!db[this.tableName]) {
      db[this.tableName] = [];
    }

    const records = Array.isArray(newData) ? newData : [newData];
    const insertedRecords = records.map((rec) => {
      const completeRecord = {
        id: rec.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...rec,
      };
      db[this.tableName].push(completeRecord);
      return completeRecord;
    });

    saveMockDb(db);
    return {
      data: Array.isArray(newData) ? insertedRecords : insertedRecords[0],
      error: null,
      select: () => ({
        single: async () => ({ data: insertedRecords[0], error: null }),
        then: (fn: any) => fn({ data: Array.isArray(newData) ? insertedRecords : insertedRecords[0], error: null })
      })
    };
  }

  async update(updates: any) {
    const db = getMockDb();
    const tableData = db[this.tableName] || [];
    const matchedItems = this.executeQuery(tableData);

    const updatedItems = matchedItems.map((item) => {
      const idx = tableData.findIndex((x: any) => x.id === item.id);
      if (idx !== -1) {
        tableData[idx] = {
          ...tableData[idx],
          ...updates,
          updated_at: new Date().toISOString()
        };
        return tableData[idx];
      }
      return item;
    });

    db[this.tableName] = tableData;
    saveMockDb(db);

    return { 
      data: updatedItems, 
      error: null,
      select: () => ({
        single: async () => ({ data: updatedItems[0], error: null }),
        then: (fn: any) => fn({ data: updatedItems, error: null })
      })
    };
  }

  async delete() {
    const db = getMockDb();
    const tableData = db[this.tableName] || [];
    const matchedItems = this.executeQuery(tableData);

    db[this.tableName] = tableData.filter(
      (item: any) => !matchedItems.some((m) => m.id === item.id)
    );

    saveMockDb(db);
    return { data: matchedItems, error: null };
  }
}
