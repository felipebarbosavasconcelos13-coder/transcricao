import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/AppLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atigra Trans - Transcrição Profissional de Vídeo e Áudio por IA",
  description: "Transcreva vídeos locais ou links do YouTube instantaneamente. Limpeza com IA, geração de resumos, timestamps sincronizados e exportação profissional.",
  keywords: ["transcrição", "vídeo para áudio", "converter áudio", "legenda", "SRT", "VTT", "Whisper", "resumo IA"],
  authors: [{ name: "Atigra Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-neutral-50 dark:bg-neutral-900 font-sans">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
