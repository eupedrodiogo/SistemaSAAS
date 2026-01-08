
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('--- Environment Variable Comparison ---');

const vars = [
    'VITE_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_URL',
    'trgnexus_SUPABASE_URL'
];

vars.forEach(v => {
    console.log(`${v}: ${process.env[v] || 'UNDEFINED'}`);
});

console.log('---------------------------------------');
