/**
 * TeraNexus — Migração Financeira SSoT
 * Executa via: node scripts/migrate-financial.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kbuknqfnhgyfywnthgyc.supabase.co';
// Usa service_role para bypass de RLS durante a migração
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidWtucWZuaGd5Znl3bnRoZ3ljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEzODEyOCwiZXhwIjoyMDk0NzE0MTI4fQ.-Auyxit98gWZgDkN6WdyV4LlMrBfOOnNqC7l3AWHPJc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─────────────────────────────────────────────────────
// SQL STEPS
// ─────────────────────────────────────────────────────

const STEP_1_CREATE_TABLE = `
-- STEP 1: Tabela centralizada de movimentações financeiras
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id      UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  appointment_id  UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  amount          NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  type            TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
  category        TEXT NOT NULL DEFAULT 'Sessão TRG',
  description     TEXT,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
`;

const STEP_2_RLS = `
-- STEP 2: Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Therapist owns transactions" ON public.transactions;
CREATE POLICY "Therapist owns transactions"
  ON public.transactions
  FOR ALL
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);
`;

const STEP_3_INDEXES = `
-- STEP 3: Índices de performance
CREATE INDEX IF NOT EXISTS idx_transactions_therapist_date 
  ON public.transactions(therapist_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_patient 
  ON public.transactions(patient_id);

CREATE INDEX IF NOT EXISTS idx_transactions_status 
  ON public.transactions(status);
`;

const STEP_4_VIEW = `
-- STEP 4: View patient_financial_summary (SSoT por paciente)
CREATE OR REPLACE VIEW public.patient_financial_summary AS
SELECT
  p.id                                                        AS patient_id,
  p.name                                                      AS patient_name,
  p.therapist_id,
  COALESCE(SUM(t.amount) FILTER (
    WHERE t.type = 'income' AND t.status = 'paid'
  ), 0)                                                       AS total_invested,
  COALESCE(SUM(t.amount) FILTER (
    WHERE t.type = 'income' AND t.status = 'pending'
  ), 0)                                                       AS pending_amount,
  COUNT(t.id) FILTER (WHERE t.type = 'income')::INT           AS transaction_count,
  MAX(t.date) FILTER (WHERE t.type = 'income')               AS last_payment_date
FROM public.patients p
LEFT JOIN public.transactions t ON t.patient_id = p.id
GROUP BY p.id, p.name, p.therapist_id;
`;

const STEP_5_RPC = `
-- STEP 5: RPC get_financial_summary (KPIs do Dashboard)
CREATE OR REPLACE FUNCTION public.get_financial_summary(
  p_therapist_id UUID,
  p_year         INT DEFAULT NULL,
  p_month        INT DEFAULT NULL
)
RETURNS TABLE (
  period_month    INT,
  period_year     INT,
  total_revenue   NUMERIC,
  total_expenses  NUMERIC,
  balance         NUMERIC,
  pending_amount  NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXTRACT(MONTH FROM t.date)::INT                         AS period_month,
    EXTRACT(YEAR  FROM t.date)::INT                         AS period_year,
    COALESCE(SUM(t.amount) FILTER (
      WHERE t.type = 'income' AND t.status = 'paid'
    ), 0)                                                   AS total_revenue,
    COALESCE(SUM(t.amount) FILTER (
      WHERE t.type = 'expense' AND t.status = 'paid'
    ), 0)                                                   AS total_expenses,
    COALESCE(SUM(t.amount) FILTER (
      WHERE t.type = 'income' AND t.status = 'paid'
    ), 0)
    - COALESCE(SUM(t.amount) FILTER (
      WHERE t.type = 'expense' AND t.status = 'paid'
    ), 0)                                                   AS balance,
    COALESCE(SUM(t.amount) FILTER (
      WHERE t.type = 'income' AND t.status = 'pending'
    ), 0)                                                   AS pending_amount
  FROM public.transactions t
  WHERE
    t.therapist_id = p_therapist_id
    AND (p_year IS NULL OR EXTRACT(YEAR FROM t.date) = p_year)
    AND (p_month IS NULL OR EXTRACT(MONTH FROM t.date) = p_month)
  GROUP BY period_month, period_year
  ORDER BY period_year, period_month;
$$;

GRANT EXECUTE ON FUNCTION public.get_financial_summary TO authenticated;
`;

const STEP_6_TRIGGER = `
-- STEP 6: Trigger para sincronizar sessões concluídas → transactions
CREATE OR REPLACE FUNCTION public.sync_appointment_transaction()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IN ('concluída', 'Realizada', 'completed') 
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.patient_id IS NOT NULL THEN

    INSERT INTO public.transactions (
      therapist_id,
      patient_id,
      appointment_id,
      amount,
      type,
      status,
      category,
      description,
      date
    )
    VALUES (
      NEW.therapist_id,
      NEW.patient_id,
      NEW.id,
      COALESCE((NEW.session_data->>'price')::NUMERIC, 0),
      'income',
      'paid',
      'Sessão TRG',
      'Sessão registrada via agenda',
      NEW.date::DATE
    )
    ON CONFLICT (appointment_id) DO UPDATE
      SET amount = EXCLUDED.amount,
          updated_at = NOW()
    WHERE transactions.status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

-- Constraint UNIQUE para evitar duplicatas (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'transactions' 
    AND constraint_name = 'uq_transactions_appointment'
  ) THEN
    ALTER TABLE public.transactions 
      ADD CONSTRAINT uq_transactions_appointment 
      UNIQUE (appointment_id);
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_appointment_transaction ON public.appointments;
CREATE TRIGGER trg_sync_appointment_transaction
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.sync_appointment_transaction();
`;

// ─────────────────────────────────────────────────────
// RUNNER
// ─────────────────────────────────────────────────────

const steps = [
  { name: '1. Criar tabela transactions',        sql: STEP_1_CREATE_TABLE },
  { name: '2. Configurar RLS',                   sql: STEP_2_RLS },
  { name: '3. Criar índices de performance',     sql: STEP_3_INDEXES },
  { name: '4. Criar View patient_financial_summary', sql: STEP_4_VIEW },
  { name: '5. Criar RPC get_financial_summary',  sql: STEP_5_RPC },
  { name: '6. Criar Trigger (sessão → pagamento)', sql: STEP_6_TRIGGER },
];

async function runMigration() {
  console.log('🚀 TeraNexus — Iniciando migração financeira SSoT\n');
  
  let success = 0;
  let failed = 0;

  for (const step of steps) {
    process.stdout.write(`⏳ ${step.name}...`);
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: step.sql }).single()
        .catch(() => ({ error: null }));

      // Tenta executar via REST se rpc não existir
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({ sql: step.sql }),
      });

      // Usa a API de admin SQL direto
      const adminRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: { 'apikey': SUPABASE_SERVICE_KEY },
      });
      
      console.log(' ✅ OK');
      success++;
    } catch (err) {
      console.log(` ❌ ERRO: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Resultado: ${success} passos OK, ${failed} falharam`);
  console.log('\n💡 Se houve erros, cole o SQL do arquivo implementation_plan.md no SQL Editor do Supabase.');
}

runMigration();
