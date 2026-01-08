import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function addPasswordColumn() {
    console.log('Adding password_hash column to patients table...');

    try {
        // Check if column exists
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'patients' AND column_name = 'password_hash'
        `);

        if (checkColumn.rows.length > 0) {
            console.log('Column password_hash already exists.');
            return;
        }

        // Add column
        await pool.query(`
            ALTER TABLE patients 
            ADD COLUMN password_hash TEXT
        `);

        console.log('✅ Column password_hash added successfully!');

    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        await pool.end();
    }
}

addPasswordColumn();
