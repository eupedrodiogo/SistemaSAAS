
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.POSTGRES_URL || process.env.trgnexus_POSTGRES_URL;

const pool = new Pool({
    connectionString: connectionString?.replace('?sslmode=require', '?'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const client = await pool.connect();

        const tables = ['patients', 'appointments'];

        for (const table of tables) {
            console.log(`\nQuerying RLS Policies for "${table}"...`);
            const res = await client.query(`
                SELECT policyname, permissive, roles, cmd, qual, with_check
                FROM pg_policies 
                WHERE tablename = $1;
            `, [table]);

            console.log(`--- RLS POLICIES (${table}) ---`);
            if (res.rows.length === 0) console.log("No policies found.");
            res.rows.forEach(row => {
                console.log(`Policy: ${row.policyname}`);
                console.log(`  Cmd: ${row.cmd}`);
                console.log(`  Qual (USING): ${row.qual}`);
                console.log('---');
            });
        }

        client.release();
    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await pool.end();
    }
}

run();
