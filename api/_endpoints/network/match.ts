
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Missing Supabase Config' });
    }

    const { sourceTherapistId, patientNeeds } = req.body;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        console.log(`🔁 Finding match for source: ${sourceTherapistId}, needs: ${patientNeeds}`);

        // 1. Fetch Candidates
        // Valid candidates: verified, accepts overflow, different from source, same specialty (if provided)
        let query = supabase
            .from('therapists')
            .select('id, name, specialty, rating, phone') // ensure phone is selected if available (might need schema update if phone in profiles)
            .eq('is_verified', true)
            .eq('is_overflow_target', true)
            .neq('id', sourceTherapistId); // Exclude self

        if (patientNeeds) {
            query = query.eq('specialty', patientNeeds);
        }

        const { data: candidates, error } = await query;

        if (error) throw error;

        if (!candidates || candidates.length === 0) {
            return res.status(404).json({ success: false, message: 'No qualified therapists found.' });
        }

        // 2. Ranking Logic (Sort by Rating Descending)
        // In a real scenario, we might add "Availability" checks here
        candidates.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        const topMatch = candidates[0];

        console.log(`✅ Update Match Found: ${topMatch.name} (Rating: ${topMatch.rating})`);

        return res.status(200).json({
            success: true,
            match: topMatch,
            candidatesCount: candidates.length
        });

    } catch (error: any) {
        console.error('Match Algorithm Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
