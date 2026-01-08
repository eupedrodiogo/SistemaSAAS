import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env.local:', result.error);
} else {
    console.log('.env.local loaded successfully');
}

const supabaseKeys = Object.keys(process.env).filter(k => k.includes('SUPABASE'));
console.log('Found Supabase keys:', supabaseKeys);

// Also check for VITE_ keys
const viteKeys = Object.keys(process.env).filter(k => k.includes('VITE_'));
console.log('Found VITE_ keys (count):', viteKeys.length);
if (viteKeys.length > 0) {
    console.log('First few VITE_ keys:', viteKeys.slice(0, 3));
}
