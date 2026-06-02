import { NextRequest, NextResponse } from "next/server";
import { supabase, isUsingMock } from "@/lib/supabaseClient";
import fs from "fs";
import path from "path";

// GET: Buscar detalhes de um job e sua transcrição (se existir)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar o Job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });
    }

    // Se o job estiver concluído, buscar também a transcrição
    let transcript = null;
    if (job.status === "completed") {
      const { data: transData } = await supabase
        .from("transcripts")
        .select("*")
        .eq("id", id)
        .single();
      transcript = transData;
    }

    // Buscar comentários associados
    const { data: comments } = await supabase
      .from("comments")
      .select("*")
      .eq("job_id", id)
      .order("created_at", { ascending: true });

    return NextResponse.json({ 
      success: true, 
      data: { 
        ...job, 
        transcript,
        comments: comments || []
      } 
    });
  } catch (error: any) {
    console.error("Erro ao buscar detalhes do job:", error);
    return NextResponse.json({ error: error.message || "Erro no servidor" }, { status: 500 });
  }
}

// DELETE: Excluir um job, seus arquivos e registros
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Buscar o job para obter o source_url e limpar arquivos
    const { data: job } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (!job) {
      return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });
    }

    // 2. Excluir o job do banco (as chaves estrangeiras com ON DELETE CASCADE vão limpar transcripts e comments)
    const { error: deleteError } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    // 3. Excluir arquivos locais ou do storage se for o caso
    if (job.source_type === "upload") {
      const url = job.source_url;
      
      if (isUsingMock) {
        // Mock: remover arquivo local da pasta public/mock-uploads
        const filename = url.replace("/mock-uploads/", "");
        const filePath = path.join(process.cwd(), "public", "mock-uploads", filename);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[MOCK STORAGE] Arquivo de vídeo deletado localmente: ${filePath}`);
          }
          // Deletar também arquivo de áudio temporário se existir
          const audioPath = filePath.replace(/\.[^/.]+$/, ".wav");
          if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
            console.log(`[MOCK STORAGE] Arquivo de áudio deletado localmente: ${audioPath}`);
          }
        } catch (e) {
          console.error("Erro ao deletar arquivos locais:", e);
        }
      } else {
        // Supabase: remover do bucket
        const filename = url.substring(url.lastIndexOf("/") + 1);
        await supabase.storage.from("videos").remove([filename]);
        await supabase.storage.from("audios").remove([filename.replace(/\.[^/.]+$/, ".wav")]);
      }
    }

    return NextResponse.json({ success: true, message: "Job excluído com sucesso" });
  } catch (error: any) {
    console.error("Erro ao excluir job:", error);
    return NextResponse.json({ error: error.message || "Erro no servidor" }, { status: 500 });
  }
}
