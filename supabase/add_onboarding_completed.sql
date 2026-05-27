-- ─────────────────────────────────────────────────────────────────────────────
-- Migração: adiciona coluna onboarding_completed na tabela therapists
--
-- Execute este script no SQL Editor do Supabase Dashboard:
-- https://supabase.com/dashboard > SQL Editor > New Query
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Terapeutas já cadastrados não precisam refazer o tour
UPDATE therapists
  SET onboarding_completed = true
  WHERE created_at < NOW() - INTERVAL '1 day'; -- Usuários com mais de 1 dia = não são "primeiros logins"

-- Índice para queries rápidas (SELECT por id já tem PK, mas adicionamos comentário de doc)
COMMENT ON COLUMN therapists.onboarding_completed IS
  'Se true, o terapeuta já concluiu ou pulou o tour de onboarding do primeiro acesso.';
