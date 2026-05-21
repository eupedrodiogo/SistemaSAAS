import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import { verifyAuth } from './utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Verify Auth First
    const user = verifyAuth(req, res);
    if (!user) return; // verifyAuth handles the error response

    const { Pool } = pg;
    const therapistId = user.id;

    const connectionString = process.env.POSTGRES_URL ? process.env.POSTGRES_URL.replace('?sslmode=require', '?') : undefined;

    if (!connectionString) {
        return res.status(500).json({ error: 'Database configuration missing' });
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();

    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        if (!therapistId) {
            return res.status(400).json({ error: 'Missing therapistId' });
        }

        // Fetch appointments to calculate revenue
        const appointmentsRes = await client.query(
            `SELECT a.*, p.name as patient_name 
             FROM appointments a
             LEFT JOIN patients p ON a.patient_id = p.id
             WHERE a.therapist_id = $1
             ORDER BY a.date DESC`,
            [therapistId]
        );

        const PRICE_PER_SESSION = 250;

        // Generate Transactions List
        const transactions = appointmentsRes.rows.map(apt => ({
            id: apt.id,
            type: 'income',
            description: `Sessão - ${apt.patient_name}`,
            category: 'Sessão TRG',
            date: apt.date instanceof Date ? apt.date.toISOString().split('T')[0] : apt.date,
            amount: PRICE_PER_SESSION,
            status: apt.status === 'Concluída' ? 'Pago' : 'Pendente'
        }));

        // Generate Monthly Data
        const monthlyDataMap = new Map<string, { receita: number, despesas: number }>();
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        appointmentsRes.rows.forEach(apt => {
            const date = new Date(apt.date);
            const monthIndex = date.getMonth();
            const monthName = months[monthIndex];

            if (!monthlyDataMap.has(monthName)) {
                monthlyDataMap.set(monthName, { receita: 0, despesas: 0 });
            }

            const current = monthlyDataMap.get(monthName)!;
            // Only count as revenue if completed or scheduled (projected)
            // For "Real" cash flow, maybe only 'Concluída'?
            // Let's include all for now as "Projected" is often useful, but distinguish status in UI.
            // For the chart, let's sum up everything.
            current.receita += PRICE_PER_SESSION;
        });

        // Fill in missing months with 0
        const currentMonthIndex = new Date().getMonth();
        const monthlyData = [];
        for (let i = 0; i <= currentMonthIndex; i++) {
            const m = months[i];
            monthlyData.push({
                name: m,
                receita: monthlyDataMap.get(m)?.receita || 0,
                despesas: 0 // No expense tracking yet
            });
        }

        // Calculate Summary Stats
        const totalRevenue = transactions
            .filter(t => t.type === 'income' && t.status === 'Pago')
            .reduce((acc, t) => acc + t.amount, 0);

        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        const pendingAmount = transactions
            .filter(t => t.type === 'income' && t.status === 'Pendente')
            .reduce((acc, t) => acc + t.amount, 0);

        const balance = totalRevenue - totalExpenses;

        res.status(200).json({
            transactions,
            monthlyData,
            summary: {
                balance,
                totalRevenue,
                totalExpenses,
                pendingAmount
            }
        });

    } catch (error: any) {
        console.error('Financials API Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
        await pool.end();
    }
}
