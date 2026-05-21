import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';

// Inlined auth utilities to avoid module resolution issues in Vercel Serverless
const getSecret = () => process.env.SECRET_KEY || 'change-this-secret-in-prod';
function verifyAuth(req: VercelRequest, res: VercelResponse): { id: string; email: string } | null {
    const auth = req.headers['authorization'];
    if (!auth) {
        res.status(401).json({ message: 'Token não fornecido' });
        return null;
    }
    const token = (Array.isArray(auth) ? auth[0] : auth).split(' ')[1];
    try {
        const decoded = jwt.verify(token, getSecret()) as any;
        return decoded;
    } catch {
        res.status(403).json({ message: 'Token inválido' });
        return null;
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Server Misconfiguration', details: 'Missing keys' });
    }

    // 1. Verify Auth First
    const user = verifyAuth(req, res);
    if (!user) return; // verifyAuth handles the error response

    const therapistId = user.id;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // 1. Total Patients
        const { count: totalPatients, error: pError } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('therapist_id', therapistId);

        if (pError) throw pError;

        // 2. Sessions Today
        const today = new Date().toISOString().split('T')[0];
        const { count: sessionsToday, error: sError } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('therapist_id', therapistId)
            .eq('date', today);

        if (sError) throw sError;

        // 3. Revenue
        // Fetch all appointments for revenue calc (MVP)
        // If volume is high, use RPC or View.
        const { data: allAppointments, error: allAppError } = await supabase
            .from('appointments')
            .select('date')
            .eq('therapist_id', therapistId);

        if (allAppError) throw allAppError;

        const totalSessions = allAppointments?.length || 0;
        const revenueMonth = totalSessions * 250;

        // 4. Weekly Activity (Last 7 days)
        // Calculate in JS
        const weeklyActivityMap = new Map<string, number>();
        const now = new Date();

        // Initialize last 7 days with 0
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }); // Dy format
            // We might want ISO date for sorting, but prompt used 'Dy'.
            // Let's us day name but careful with duplicates (e.g. if >1 week). 
            // Last 7 days implies unique days.
            if (!weeklyActivityMap.has(dayName)) {
                weeklyActivityMap.set(dayName, 0);
            }
        }

        // Filter last 7 days appointments
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        allAppointments?.forEach(app => {
            const appDate = new Date(app.date);
            if (appDate >= sevenDaysAgo && appDate <= now) {
                const dayName = appDate.toLocaleDateString('en-US', { weekday: 'short' });
                if (weeklyActivityMap.has(dayName)) {
                    weeklyActivityMap.set(dayName, (weeklyActivityMap.get(dayName) || 0) + 1);
                }
            }
        });

        const weeklyActivity = Array.from(weeklyActivityMap.entries()).map(([day, sessions]) => ({
            day,
            sessions,
            revenue: sessions * 250
        }));

        res.status(200).json({
            stats: {
                patients: totalPatients || 0,
                sessionsToday: sessionsToday || 0,
                revenue: revenueMonth,
                productivity: (totalPatients || 0) > 0 ? 95 : 0
            },
            weeklyActivity
        });

    } catch (error: any) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ error: error.message });
    }
}
