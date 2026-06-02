import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// PATCH: Atualizar os segmentos editados e o texto consolidado
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { segments } = body;

    if (!segments || !Array.isArray(segments)) {
      return NextResponse.json({ error: "O campo segments deve ser um array." }, { status: 400 });
    }

    // Consolidar o texto a partir dos segmentos editados
    const rawText = segments.map((s: any) => s.text).join(" ");

    // Atualizar a tabela de transcrições
    const { data: updatedTranscript, error } = await supabase
      .from("transcripts")
      .update({
        segments,
        raw_text: rawText,
        // Também atualizar o clean_text se for a primeira vez ou opcional
        clean_text: rawText
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !updatedTranscript) {
      throw error || new Error("Falha ao salvar a transcrição.");
    }

    return NextResponse.json({ success: true, data: updatedTranscript });
  } catch (error: any) {
    console.error("Erro ao atualizar transcrição:", error);
    return NextResponse.json({ error: error.message || "Erro no servidor" }, { status: 500 });
  }
}
