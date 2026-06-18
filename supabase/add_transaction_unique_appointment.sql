-- ============================================================
-- MIGRATION: Add UNIQUE constraint on transactions.appointment_id
-- Purpose: Allows upsert operations in webhook.ts and manual-confirm.ts
--          to avoid duplicate financial records when a Stripe payment
--          is confirmed by both the webhook and the manual-confirm endpoint.
-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor).
-- ============================================================

-- Safe: only adds the constraint if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_constraint
        WHERE  conname = 'transactions_appointment_id_key'
        AND    conrelid = 'transactions'::regclass
    ) THEN
        ALTER TABLE transactions
            ADD CONSTRAINT transactions_appointment_id_key
            UNIQUE (appointment_id);

        RAISE NOTICE 'Constraint transactions_appointment_id_key added successfully.';
    ELSE
        RAISE NOTICE 'Constraint transactions_appointment_id_key already exists. Skipped.';
    END IF;
END;
$$;
