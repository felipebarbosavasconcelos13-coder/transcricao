-- Criação do esquema inicial para Atigra Trans

-- Habilitar a extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABELA: jobs
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('upload', 'youtube')),
    source_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing_audio', 'transcribing', 'post_processing', 'completed', 'failed')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    error_message TEXT,
    webhook_url TEXT,
    duration NUMERIC DEFAULT 0,
    asr_model TEXT NOT NULL DEFAULT 'whisper-1' CHECK (asr_model IN ('whisper-1', 'deepseek-asr')),
    language TEXT NOT NULL DEFAULT 'pt',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABELA: transcripts
CREATE TABLE IF NOT EXISTS public.transcripts (
    id UUID PRIMARY KEY REFERENCES public.jobs(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    clean_text TEXT,
    summary TEXT,
    highlights JSONB DEFAULT '[]'::jsonb,
    segments JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABELA: comments
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    timestamp NUMERIC,
    user_name TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar buscas full-text Postgres nas transcrições
CREATE INDEX IF NOT EXISTS transcripts_raw_text_idx ON public.transcripts USING gin(to_tsvector('portuguese', raw_text));
CREATE INDEX IF NOT EXISTS transcripts_clean_text_idx ON public.transcripts USING gin(to_tsvector('portuguese', coalesce(clean_text, '')));

-- Atualizar automaticamente updated_at na tabela de jobs
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Habilitar RLS (Row Level Security) nas tabelas
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para fins de MVP (ajustadas posteriormente na Fase 5 com Autenticação)
CREATE POLICY "Permitir leitura pública de jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de jobs" ON public.jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública de jobs" ON public.jobs FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública de jobs" ON public.jobs FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de transcripts" ON public.transcripts FOR SELECT USING (true);
CREATE POLICY "Permitir escrita pública de transcripts" ON public.transcripts FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública de transcripts" ON public.transcripts FOR UPDATE USING (true);

CREATE POLICY "Permitir acesso público a comentários" ON public.comments FOR ALL USING (true);
