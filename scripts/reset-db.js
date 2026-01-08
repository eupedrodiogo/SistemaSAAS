
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;
const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
    console.error('Error: POSTGRES_URL is not defined in .env.local');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function resetDatabase() {
    const client = await pool.connect();
    try {
        console.log('🗑️  Limpar banco de dados iniciado...');

        // Delete appointments first due to foreign key constraints
        console.log('   Apagando agendamentos...');
        await client.query('DELETE FROM appointments');

        // Delete patients
        console.log('   Apagando pacientes...');
        await client.query('DELETE FROM patients');

        console.log('✅ Banco de dados limpo com sucesso! (Agendamentos e Pacientes removidos)');
    } catch (err) {
        console.error('❌ Erro ao limpar banco de dados:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

resetDatabase();
