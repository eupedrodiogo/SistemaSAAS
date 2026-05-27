-- =============================================================
-- FIX: Diagnóstico e Correção de Policies RLS
-- Execute no: Supabase Dashboard → SQL Editor → New query
-- =============================================================

-- 1. VERIFICAR quais appointments existem (como service_role, bypass RLS)
-- Isso vai te mostrar SE há dados no banco:
SELECT 
  a.id,
  a.therapist_id,
  a.patient_id,
  a.date,
  a.time,
  a.status,
  p.name as patient_name,
  t.email as therapist_email
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN therapists t ON a.therapist_id = t.id
ORDER BY a.created_at DESC
LIMIT 20;

-- =============================================================
-- 2. VERIFICAR o therapist_id dos registros vs. auth.users
-- =============================================================
SELECT 
  t.id as therapist_id,
  t.email,
  t.name,
  (SELECT COUNT(*) FROM appointments WHERE therapist_id = t.id) as appointment_count,
  (SELECT COUNT(*) FROM patients WHERE therapist_id = t.id) as patient_count
FROM therapists t;

-- =============================================================
-- 3. REMOVER policies duplicadas e conflitantes
-- =============================================================

-- Appointments: limpar policies de INSERT duplicadas
DROP POLICY IF EXISTS "Service role pode inserir agendamentos" ON public.appointments;
DROP POLICY IF EXISTS "Service role pode inserir pacientes" ON public.patients;

-- =============================================================
-- 4. GARANTIR que a policy de SELECT funciona corretamente
-- =============================================================

-- Testar: o terapeuta logado consegue ver seus appointments?
-- (Substitua 'SEU-UUID-AQUI' pelo UUID do terapeuta)
-- SELECT * FROM appointments WHERE therapist_id = 'SEU-UUID-AQUI';

-- =============================================================
-- 5. ADICIONAR policy de SELECT para service_role (backend APIs)
-- =============================================================

-- Permitir que o service_role (APIs backend) leia tudo
DROP POLICY IF EXISTS "Service role lê todos agendamentos" ON public.appointments;
CREATE POLICY "Service role lê todos agendamentos" ON public.appointments
  FOR SELECT
  TO service_role
  USING (true);

DROP POLICY IF EXISTS "Service role lê todos pacientes" ON public.patients;
CREATE POLICY "Service role lê todos pacientes" ON public.patients
  FOR SELECT
  TO service_role
  USING (true);

-- =============================================================
-- 6. VERIFICAR se o trigger de criação de terapeuta está ativo
-- =============================================================
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- =============================================================
-- 7. Se não houver terapeutas na tabela, inserir manualmente
-- (Substitua os valores pelos dados reais)
-- =============================================================
-- INSERT INTO public.therapists (id, name, email, plan)
-- SELECT id, COALESCE(raw_user_meta_data->>'name', email), email, 'trial'
-- FROM auth.users
-- ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- FIM - Execute a query de verificação (item 1) primeiro
-- para confirmar se os dados estão no banco
-- =============================================================
