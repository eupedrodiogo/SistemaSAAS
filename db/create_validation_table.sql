-- Execute esse script no SQL Editor do Supabase para criar a tabela de validação

create table if not exists validation_responses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Informações de Contato / Lead
  contact text, -- Email ou WhatsApp
  
  -- Respostas do Formulário
  video_platform text[],      -- Array de strings para multipla escolha
  record_method text[],       -- Array de strings
  pain_point text[],          -- Array de strings
  ai_interest text,           -- Single choice
  digital_notebook_interest text, -- Single choice
  suggestions text
);

-- Habilitar RLS (Row Level Security) mas permitir insert público para esse caso específico (Validação)
alter table validation_responses enable row level security;

-- Política: Qualquer um (Anon) pode inserir respostas
create policy "Permitir inserção anônima para validação"
on validation_responses for insert
to anon
with check (true);

-- Política: Apenas service_role ou admin pode ler (para proteger os dados dos leads)
-- Como o painel admin ainda não tem role definida, por enquanto deixamos sem select pública.
-- Você verá os dados direto no painel do Supabase.
