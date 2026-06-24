import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

    try {
        const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
        
        const supabase = createClient(url, key);

        // Adicionar coluna pix_txid na tabela appointments (idempotente)
        await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE appointments 
                ADD COLUMN IF NOT EXISTS pix_txid TEXT,
                ADD COLUMN IF NOT EXISTS pix_end_to_end_id TEXT,
                ADD COLUMN IF NOT EXISTS pix_paid_at TIMESTAMPTZ;
            `
        });

        return res.status(200).json({ ok: true, message: 'Colunas PIX adicionadas com sucesso.' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
