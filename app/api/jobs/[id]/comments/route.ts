import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: Criar um comentário associado a um job e a um timestamp
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { userName, text, timestamp } = body;

    if (!userName || !text) {
      return NextResponse.json({ error: "Os campos userName e text são obrigatórios." }, { status: 400 });
    }

    // Inserir comentário no banco
    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        job_id: id,
        user_name: userName,
        text,
        timestamp: timestamp || null
      })
      .select()
      .single();

    if (error || !comment) {
      throw error || new Error("Falha ao criar o comentário.");
    }

    return NextResponse.json({ success: true, data: comment });
  } catch (error: any) {
    console.error("Erro ao criar comentário:", error);
    return NextResponse.json({ error: error.message || "Erro no servidor" }, { status: 500 });
  }
}
