export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/settings";

export async function POST(req: NextRequest) {
  try {
    const { fileName, contentType, fileSize } = await req.json();

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json({ error: "Nome do arquivo ausente." }, { status: 400 });
    }

    const maxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB || "50");
    const maxUploadSizeBytes = maxUploadSizeMb * 1024 * 1024;
    if (typeof fileSize === "number" && fileSize > maxUploadSizeBytes) {
      return NextResponse.json(
        { error: `Arquivo muito grande. O limite atual de upload é ${maxUploadSizeMb} MB.` },
        { status: 413 }
      );
    }

    const supabaseUrl = getSupabaseUrl();
    const serviceRoleKey = getSupabaseServiceRoleKey();

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Supabase Service Role Key não configurada no servidor." },
        { status: 500 }
      );
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await admin.storage
      .from("videos")
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      throw error || new Error("Falha ao gerar URL assinada de upload.");
    }

    const { data: publicData } = admin.storage.from("videos").getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      path: publicData.publicUrl,
      publicUrl: publicData.publicUrl,
      storagePath,
      token: data.token,
      signedUrl: data.signedUrl,
      contentType: contentType || "application/octet-stream"
    });
  } catch (error: any) {
    console.error("Erro ao assinar upload:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao preparar upload." },
      { status: 500 }
    );
  }
}
