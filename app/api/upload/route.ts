export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { NextRequest, NextResponse } from "next/server";
import { supabase, isUsingMock } from "@/lib/supabaseClient";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (isUsingMock) {
      // MOCK STORAGE: Salva na pasta public/mock-uploads local
      const uploadDir = path.join(process.cwd(), "public", "mock-uploads");
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);

      console.log(`[MOCK STORAGE] Arquivo salvo localmente em: ${filePath}`);
      
      // Retorna a URL simulada do arquivo local
      const publicUrl = `/mock-uploads/${filename}`;
      return NextResponse.json({ 
        success: true, 
        path: publicUrl,
        publicUrl: publicUrl,
        filename: file.name
      });
    } else {
      // SUPABASE REAL: Faz upload para o bucket 'videos'
      const { data, error } = await supabase.storage
        .from("videos")
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: true
        });

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from("videos")
        .getPublicUrl(filename);

      return NextResponse.json({ 
        success: true, 
        path: data.path,
        publicUrl: urlData.publicUrl,
        filename: file.name
      });
    }
  } catch (error: any) {
    console.error("Erro no endpoint de upload:", error);
    return NextResponse.json({ error: error.message || "Erro no processamento do arquivo" }, { status: 500 });
  }
}
