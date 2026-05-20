import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Endpoint de keep-alive para evitar que o Supabase pause o projeto.
// Configurado como cron job no vercel.json: a cada 3 dias.
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Segurança: aceita apenas chamadas do próprio Vercel Cron (header authorization)
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Missing Supabase credentials' });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Faz uma query leve para manter o projeto ativo
        const { data, error } = await supabase
            .from('therapists')
            .select('id')
            .limit(1);

        if (error) throw error;

        console.log(`[Keep-Alive] Supabase ping OK às ${new Date().toISOString()}`);
        return res.status(200).json({
            ok: true,
            timestamp: new Date().toISOString(),
            message: 'Supabase projeto mantido ativo.'
        });

    } catch (error: any) {
        console.error('[Keep-Alive] Erro:', error);
        return res.status(500).json({ error: error.message });
    }
}
