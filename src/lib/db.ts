import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.POSTGRES_URL;

const pool = new Pool({
    connectionString: connectionString ? connectionString.replace('?sslmode=require', '?') : undefined,
    ssl: {
        rejectUnauthorized: false,
    },
});

export default pool;
