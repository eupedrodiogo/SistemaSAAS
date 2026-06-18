import { Client } from 'pg';

const client = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.kbuknqfnhgyfywnthgyc',
  password: 'Lebazi802@.',
  ssl: { rejectUnauthorized: false }
});

async function addMissingColumns() {
  try {
    await client.connect();
    console.log("Connected to Supabase!");
    console.log("Adding missing columns to therapists table...");
    await client.query(`
      ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS pix_key text;
      ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS pix_type text;
      ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS invoice_notes text;
      ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS clinic_name text;
      ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS cnpj text;
      ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS address text;
    `);
    console.log("Success!");
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
addMissingColumns();
