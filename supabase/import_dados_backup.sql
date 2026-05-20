-- ==========================================================
-- IMPORTAÇÃO DE DADOS - TeraNexus (backup 27/01/2026)
-- Cole no SQL Editor do novo projeto: kbuknqfnhgyfywnthgyc
-- ==========================================================

-- Desabilita verificação de FKs temporariamente
SET session_replication_role = replica;

-- ==========================================================
-- 0. ADICIONA COLUNAS QUE EXISTIAM NO PROJETO ANTIGO
-- ==========================================================
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS specialties text[];
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS citrg_code text;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS appointments_count integer DEFAULT 0;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS currency text DEFAULT 'BRL';
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS session_duration integer DEFAULT 50;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS certificates jsonb DEFAULT '[]'::jsonb;

-- Cria tabela blocked_slots se não existir
CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
  therapist_id uuid NOT NULL,
  day_of_week integer,
  start_time text NOT NULL,
  end_time text NOT NULL,
  label text,
  created_at timestamptz DEFAULT now() NOT NULL,
  date date,
  CONSTRAINT blocked_slots_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Terapeutas gerenciam seus próprios bloqueios" ON public.blocked_slots;
CREATE POLICY "Terapeutas gerenciam seus próprios bloqueios" ON public.blocked_slots
  FOR ALL USING (auth.uid() = therapist_id);

-- Cria tabela reports se não existir
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  therapist_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  title character varying(255) NOT NULL,
  type character varying(50) NOT NULL,
  content text,
  status character varying(50) DEFAULT 'finalized',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Terapeutas gerenciam seus próprios relatórios" ON public.reports;
CREATE POLICY "Terapeutas gerenciam seus próprios relatórios" ON public.reports
  FOR ALL USING (auth.uid() = therapist_id);

-- ==========================================================
-- 1. TERAPEUTAS
-- ==========================================================
INSERT INTO public.therapists (
  id, name, email, plan, created_at,
  specialty, is_verified, rating, is_overflow_source, is_overflow_target,
  status, bio, photo_url, specialties, citrg_code,
  review_count, appointments_count, price, currency, session_duration,
  certificates, phone
) VALUES
(
  '4220bc6f-7e95-4afb-b3fe-fa00789fe275',
  'Pedro Diogo Santana Mello',
  'pedrodiogo.suporte@gmail.com',
  'pro',
  '2025-12-27 00:09:27.536988+00',
  'Ansiedade', true, 5.0, false, true,
  'active',
  'Especialista em Metodologia TRG com foco em reprocessamento de traumas emocionais e ansiedade. Ajudando você a reencontrar o equilíbrio.',
  null,
  ARRAY['Ansiedade','Depressão'],
  '04207', 120, 1414, 2, 'BRL', 50,
  '[{"url": "", "name": "Certificado.pdf", "status": "pending"}]'::jsonb,
  '21972525151'
),
(
  '7b8a64e6-91e9-459a-abb4-44a5570725c2',
  'Izabel Crisitina Dias Guimarães',
  'izabelhomeoffice7@gmail.com',
  'free',
  '2026-01-07 12:32:21.393914+00',
  'Psicossomática', false, 5.0, false, true,
  'active',
  null, null,
  ARRAY['Psicossomática'],
  '12345', 0, 0, 1, 'BRL', 50,
  '[]'::jsonb,
  '21965973741'
),
(
  '62c2dc37-0e08-4df2-90f9-ba7992c5f9d8',
  'Jonas Aparecido Monteiro',
  'jonas.aparecido@hotmail.com',
  'free',
  '2026-01-24 17:51:24.705268+00',
  null, false, 5.0, false, true,
  'active',
  null, null, null, null,
  0, 0, null, 'BRL', 50,
  '[]'::jsonb, null
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  plan = EXCLUDED.plan,
  specialty = EXCLUDED.specialty,
  is_verified = EXCLUDED.is_verified,
  status = EXCLUDED.status,
  bio = EXCLUDED.bio,
  specialties = EXCLUDED.specialties,
  citrg_code = EXCLUDED.citrg_code,
  review_count = EXCLUDED.review_count,
  appointments_count = EXCLUDED.appointments_count,
  price = EXCLUDED.price,
  phone = EXCLUDED.phone;

-- ==========================================================
-- 2. SITE CONFIG (mini-site do Pedro)
-- ==========================================================
INSERT INTO public.site_configs (
  id, therapist_id, subdomain, theme, content, published, created_at, updated_at
) VALUES (
  'ecf7dfe8-3a12-4d98-b33c-71cee55e744d',
  '4220bc6f-7e95-4afb-b3fe-fa00789fe275',
  'pedrodiogo',
  '{"textColor": "#1E293B", "primaryColor": "#8b182a", "secondaryColor": "#C7D2FE", "backgroundColor": "#F0F9FF"}'::jsonb,
  '{"faq": [], "hero": {"title": "Liberte-se das dores emocionais e viva plenamente.", "ctaText": "Agendar minha sessão", "subtitle": "Terapia especializada em reprocessamento generativo (TRG).", "backgroundImageUrl": "https://images.unsplash.com/photo-1633613286991-611fe299c4be?q=80&w=2070&auto=format&fit=crop"}, "about": {"body": "Minha missão é ajudar pessoas a superarem barreiras emocionais...", "title": "Sobre Mim", "imageUrl": "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"}, "benefits": [], "testimonials": []}'::jsonb,
  true,
  '2026-01-11 18:54:47.994391+00',
  '2026-01-11 18:59:57.852+00'
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================================
-- 3. PACIENTES
-- ==========================================================
INSERT INTO public.patients (
  id, therapist_id, name, email, phone, status, notes, created_at
) VALUES
(
  '100d848d-4d02-4798-bbe8-0aa0238dba28',
  '4220bc6f-7e95-4afb-b3fe-fa00789fe275',
  'Joao', 'pedrodiogo.mello@gmail.com', '21972525151',
  'active',
  'Queixa: teste | Transtornos: Abandono (5), Aborto (5), Alcoolismo (3), Agressividade (7), Alopécia (0), Anorexia (10)',
  '2026-01-20 14:21:22.23195+00'
),
(
  '231dd2c5-b22e-4351-b25c-abc2ff45aef7',
  '4220bc6f-7e95-4afb-b3fe-fa00789fe275',
  'Bernardo', 'pedrodiogo.job@gmail.com', '21972525151',
  'active',
  'Queixa: Ansiedade | Transtornos: Abandono (10), Aborto (5), Abuso Sexual (8), Adoção (3), Agressividade (0)',
  '2026-01-21 22:24:24.721704+00'
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================================
-- 4. AGENDAMENTOS
-- ==========================================================
INSERT INTO public.appointments (
  id, therapist_id, patient_id, date, time,
  status, type, notes, created_at, session_data
) VALUES
(
  'e61dee06-bcd5-43bb-89b1-96cb5fab61f7',
  '4220bc6f-7e95-4afb-b3fe-fa00789fe275',
  '100d848d-4d02-4798-bbe8-0aa0238dba28',
  '2026-01-22', '11:00:00', 'scheduled', 'Primeira Consulta',
  '{"complaint":"teste","nome":"Joao","celular":"21972525151"}',
  '2026-01-20 14:21:22.593646+00',
  '{"price": 2}'::jsonb
),
(
  'b7d3cdf4-47ec-4920-b94e-033029d67b2d',
  '4220bc6f-7e95-4afb-b3fe-fa00789fe275',
  '231dd2c5-b22e-4351-b25c-abc2ff45aef7',
  '2026-01-21', '08:00:00', 'pending_payment', 'Primeira Consulta',
  '{"complaint":"Ansiedade","nome":"Bernardo","celular":"21972525151"}',
  '2026-01-21 22:24:24.860861+00',
  '{"price": 2}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================================
-- 5. BLOQUEIOS DE AGENDA
-- ==========================================================
INSERT INTO public.blocked_slots (
  id, therapist_id, day_of_week, start_time, end_time, label, created_at, date
) VALUES
(
  '2a36893e-29aa-4f18-b689-95deac84637e',
  '4220bc6f-7e95-4afb-b3fe-fa00789fe275',
  null, '00:00', '23:59', 'Folga', '2026-01-14 01:49:53.579826+00', '2026-01-24'
),
(
  '57737bc0-cf80-48ba-a50f-8ce3a1e91090',
  '4220bc6f-7e95-4afb-b3fe-fa00789fe275',
  null, '00:00', '23:59', 'Folga', '2026-01-14 01:50:12.014412+00', '2026-01-17'
),
(
  'f194d0cf-fa1c-4c2e-9e66-574a18c0ded9',
  '4220bc6f-7e95-4afb-b3fe-fa00789fe275',
  null, '12:00', '13:00', 'Almoço', '2026-01-14 02:03:39.786895+00', '2026-01-31'
),
(
  '7c9d1963-65c9-4e65-830f-6f0bc4e5103e',
  '4220bc6f-7e95-4afb-b3fe-fa00789fe275',
  null, '00:00', '23:59', 'Folga', '2026-01-20 14:29:02.484005+00', '2026-01-30'
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================================
-- 6. RESPOSTAS DE VALIDAÇÃO DE MERCADO
-- ==========================================================
INSERT INTO public.validation_responses (
  id, created_at, contact, video_platform, record_method,
  pain_point, ai_interest, digital_notebook_interest, suggestions
) VALUES
(
  'c948d98e-323f-4612-b3ce-436818c7fe61',
  '2026-01-07 22:22:28.369+00',
  'pedrodiogo.mello@gmail.com',
  ARRAY['WhatsApp','Zoom / Google Meet + Agenda de Papel'],
  ARRAY['Papel / Cadernos','Word / Google Docs (Arquivo soltos)','Prontuário Excel'],
  ARRAY['Perder anotações antigas','Não lembrar o que conversou na última sessão','Perda de tempo com outras documentações','Organizar agenda e pagamentos'],
  'Sim, com certeza', 'Sim, com certeza', 'Vou elaborar aqui'
),
(
  'cdeaf01c-d6cc-46d2-a120-23db74dad33f',
  '2026-01-09 23:41:31.404+00',
  'izabelhomeoffice7@gmail.com',
  ARRAY['WhatsApp Vídeo','Zoom','Outros: google keep'],
  ARRAY['Papel / Cadernos','Prontuário Excel / Planilhas'],
  ARRAY['Perder anotações antigas','Falta de tempo para documentar'],
  'Sim, preciso disso', 'Sim, facilita', 'rede de transbordo'
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================================
-- Reabilita verificação normal
-- ==========================================================
SET session_replication_role = DEFAULT;

-- Verificação final
SELECT 'therapists' as tabela, count(*) as total FROM public.therapists
UNION ALL SELECT 'patients', count(*) FROM public.patients
UNION ALL SELECT 'appointments', count(*) FROM public.appointments
UNION ALL SELECT 'blocked_slots', count(*) FROM public.blocked_slots
UNION ALL SELECT 'site_configs', count(*) FROM public.site_configs
UNION ALL SELECT 'validation_responses', count(*) FROM public.validation_responses;
