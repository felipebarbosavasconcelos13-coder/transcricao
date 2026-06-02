import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supabase_url, supabase_anon_key } = body;

    if (!supabase_url || !supabase_anon_key) {
      return NextResponse.json(
        { success: false, error: "URL do Supabase ou Anon Key ausentes." },
        { status: 400 }
      );
    }

    try {
      console.log(`[VALIDATION API] Testando conexão do Supabase: ${supabase_url}`);
      const client = createClient(supabase_url, supabase_anon_key);
      
      // Testar uma consulta simples para validar a conexão e presença das tabelas
      const { error } = await client.from("jobs").select("id").limit(1);

      if (error) {
        console.warn(`[VALIDATION API] Erro na consulta de teste do Supabase:`, error);
        
        const errorMsg = error.message || "";
        const isTableMissing = 
          errorMsg.includes("does not exist") || 
          errorMsg.includes("Could not find the table") || 
          errorMsg.includes("schema cache") ||
          error.code === "42P01" || 
          error.code === "PGRST205";

        if (isTableMissing) {
          // A conexão deu certo, mas a tabela 'jobs' (e muito provavelmente as outras) está ausente
          // Vamos carregar o script SQL local 'supabase/schema.sql' para enviar ao frontend
          const sqlPath = path.join(process.cwd(), "supabase", "schema.sql");
          let sqlScript = "";
          
          if (fs.existsSync(sqlPath)) {
            sqlScript = fs.readFileSync(sqlPath, "utf8");
          } else {
            console.error(`[VALIDATION API] Arquivo schema.sql não localizado em: ${sqlPath}`);
          }

          return NextResponse.json({
            success: true,
            connectionOk: true,
            tablesExist: false,
            sqlScript,
            message: "Conexão estabelecida, mas as tabelas do sistema não foram localizadas."
          });
        }

        // Outro erro de banco de dados (ex: credenciais incorretas)
        return NextResponse.json({
          success: false,
          error: `Erro ao consultar base de dados Supabase: ${error.message} (Código: ${error.code || "desconhecido"})`
        });
      }

      // Tudo ok: conexão ativa e tabelas criadas!
      return NextResponse.json({
        success: true,
        connectionOk: true,
        tablesExist: true,
        message: "Conectado ao Supabase com sucesso e tabelas validadas!"
      });
    } catch (dbErr: any) {
      return NextResponse.json({
        success: false,
        error: `Erro de conexão física com o host do Supabase: ${dbErr.message || "Verifique os dados inseridos."}`
      });
    }
  } catch (err: any) {
    console.error(`[VALIDATION API ERROR]`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
