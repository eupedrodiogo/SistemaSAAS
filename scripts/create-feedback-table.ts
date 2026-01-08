
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrate() {
    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();

    try {
        console.log('Creating feedback table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.feedbacks (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                therapist_id UUID REFERENCES public.therapists(id),
                patient_id UUID REFERENCES public.patients(id),
                user_type TEXT CHECK (user_type IN ('therapist', 'patient')) NOT NULL,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
                category TEXT,
                comment TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            );

            -- Enable RLS
            ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

            -- Policies
            DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedbacks;
            CREATE POLICY "Anyone can insert feedback" ON public.feedbacks
                FOR INSERT WITH CHECK (true);

            DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedbacks;
            CREATE POLICY "Admins can view all feedback" ON public.feedbacks
                FOR SELECT USING (true);
        `);
        console.log('Feedback table created successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
