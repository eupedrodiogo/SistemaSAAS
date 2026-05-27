-- =============================================================
-- DIAGNÓSTICO E CORREÇÃO DEFINITIVA - Execute no SQL Editor
-- Supabase → SQL Editor → New Query
-- =============================================================

-- PASSO 1: Ver TODOS os therapists e seus UUIDs
SELECT id, email, name, created_at
FROM therapists
ORDER BY created_at DESC;

-- PASSO 2: Ver TODOS os agendamentos e quais therapist_id foram usados
SELECT 
  a.id,
  a.therapist_id,
  t.email as therapist_email,
  a.patient_id,
  p.name as patient_name,
  p.email as patient_email,
  a.date,
  a.status,
  a.created_at
FROM appointments a
LEFT JOIN therapists t ON a.therapist_id = t.id
LEFT JOIN patients p ON a.patient_id = p.id
ORDER BY a.created_at DESC
LIMIT 50;

-- PASSO 3: Ver TODOS os pacientes e seus therapist_id
SELECT 
  p.id,
  p.therapist_id,
  t.email as therapist_email,
  p.name,
  p.email,
  p.status,
  p.created_at
FROM patients p
LEFT JOIN therapists t ON p.therapist_id = t.id
ORDER BY p.created_at DESC
LIMIT 50;

-- =============================================================
-- SE OS DADOS EXISTEM COM UM therapist_id ERRADO:
-- Execute o PASSO 4 substituindo:
--   'UUID_CORRETO' = o auth.uid() do terapeuta que faz login
--   'UUID_ERRADO'  = o therapist_id que aparece nos registros
-- =============================================================

-- PASSO 4A: Corrigir pacientes com therapist_id errado
-- UPDATE patients
-- SET therapist_id = 'UUID_CORRETO'
-- WHERE therapist_id = 'UUID_ERRADO';

-- PASSO 4B: Corrigir agendamentos com therapist_id errado  
-- UPDATE appointments
-- SET therapist_id = 'UUID_CORRETO'
-- WHERE therapist_id = 'UUID_ERRADO';

-- =============================================================
-- SE NÃO HÁ DADOS (tabelas vazias):
-- O problema é que nenhum agendamento foi completado ainda.
-- Use o painel para adicionar um cliente manualmente clicando
-- em "+ Novo Cliente" e depois criar um agendamento.
-- =============================================================
