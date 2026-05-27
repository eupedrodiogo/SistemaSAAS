/**
 * TeraNexus — Migração Financeira SSoT
 * Usa conexão direta PostgreSQL (não-pooled) para executar DDL
 * Rodar: node scripts/run-migration.mjs
 */

import pg from 'pg';
const { Client } = pg;

// Session mode pooler (porta 5432) — suporta DDL, SSL sem verificação de cert
const client = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.kbuknqfnhgyfywnthgyc',
  password: 'Lebazi802@.',
  ssl: { rejectUnauthorized: false }
});

// ─────────────────────────────────────────────────────
// SQL MIGRATIONS
// ─────────────────────────────────────────────────────

const migrations = [
  {
    name: '1. Extensão UUID + Tabela transactions',
    sql: `
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
    `
  },
  {
    name: '2. RLS — Row Level Security',
    sql: `
      ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Therapist owns transactions" ON public.transactions;
      CREATE POLICY "Therapist owns transactions"
        ON public.transactions
        FOR ALL
        USING (auth.uid() = therapist_id)
        WITH CHECK (auth.uid() = therapist_id);
    `
  },
  {
    name: '3. Índices de performance',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_transactions_therapist_date 
        ON public.transactions(therapist_id, date DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_patient 
        ON public.transactions(patient_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_status 
        ON public.transactions(status);
    `
  },
  {
    name: '4. View patient_financial_summary',
    sql: `
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
        COUNT(t.id) FILTER (WHERE t.type = 'income')::INT          AS transaction_count,
        MAX(t.date) FILTER (WHERE t.type = 'income')               AS last_payment_date
      FROM public.patients p
      LEFT JOIN public.transactions t ON t.patient_id = p.id
      GROUP BY p.id, p.name, p.therapist_id;
    `
  },
  {
    name: '5. RPC get_financial_summary',
    sql: `
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
    `
  },
  {
    name: '6. Trigger sessão concluída → transaction',
    sql: `
      CREATE OR REPLACE FUNCTION public.sync_appointment_transaction()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.status IN ('concluída', 'Realizada', 'completed')
           AND (OLD.status IS DISTINCT FROM NEW.status)
           AND NEW.patient_id IS NOT NULL THEN

          INSERT INTO public.transactions (
            therapist_id, patient_id, appointment_id,
            amount, type, status, category, description, date
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

      ALTER TABLE public.transactions 
        DROP CONSTRAINT IF EXISTS uq_transactions_appointment;
      ALTER TABLE public.transactions 
        ADD CONSTRAINT uq_transactions_appointment 
        UNIQUE (appointment_id);

      DROP TRIGGER IF EXISTS trg_sync_appointment_transaction ON public.appointments;
      CREATE TRIGGER trg_sync_appointment_transaction
        AFTER UPDATE ON public.appointments
        FOR EACH ROW EXECUTE FUNCTION public.sync_appointment_transaction();
    `
  }
];

// ─────────────────────────────────────────────────────
// RUNNER
// ─────────────────────────────────────────────────────

async function run() {
  console.log('🚀 TeraNexus — Migração Financeira SSoT\n');
  console.log(`📡 Conectando em: db.kbuknqfnhgyfywnthgyc.supabase.co\n`);

  try {
    await client.connect();
    console.log('✅ Conexão estabelecida\n');
  } catch (err) {
    console.error(`❌ Falha na conexão: ${err.message}`);
    process.exit(1);
  }

  let success = 0;
  let failed = 0;

  for (const migration of migrations) {
    process.stdout.write(`⏳ ${migration.name}... `);
    try {
      await client.query(migration.sql);
      console.log('✅ OK');
      success++;
    } catch (err) {
      console.log(`❌ ERRO`);
      console.error(`   → ${err.message}\n`);
      failed++;
    }
  }

  await client.end();

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 Resultado: ${success}/${migrations.length} OK | ${failed} com erro`);
  
  if (failed === 0) {
    console.log('\n🎉 Migração completa! Banco pronto para a refatoração do frontend.');
    console.log('\n📋 Objetos criados:');
    console.log('   • Tabela: public.transactions');
    console.log('   • View:   public.patient_financial_summary');
    console.log('   • RPC:    public.get_financial_summary(therapist_id, year?, month?)');
    console.log('   • Trigger: trg_sync_appointment_transaction');
  } else {
    console.log('\n⚠️  Alguns passos falharam. Verifique os erros acima.');
  }
}

run();
