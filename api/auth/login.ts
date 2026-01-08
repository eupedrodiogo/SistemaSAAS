
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import * as jwt from 'jsonwebtoken';

// Force load .env.local for local dev
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Inlined auth utilities to avoid module resolution issues in Vercel Serverless
const getSecret = () => process.env.SECRET_KEY || 'change-this-secret-in-prod';
function signToken(payload: object) {
    return jwt.sign(payload, getSecret(), { expiresIn: '8h' });
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. CORS Setup
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Validate Method
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // 3. Initialize Supabase Client
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase configuration missing');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 4. Authenticate User
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError || !authData.user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 5. Fetch Therapist Profile
        const { data: therapist, error: dbError } = await supabase
            .from('therapists')
            .select('*')
            .eq('email', email)
            .single();

        const therapistId = therapist?.id || authData.user.id;

        // 6. Generate Custom JWT for our API
        // Our backend endpoints use verifyAuth which checks SECRET_KEY.
        // We must provide a token signed with that same key.
        const token = signToken({
            id: therapistId,
            email: email.toLowerCase()
        });

        // 7. Return Success Response
        return res.status(200).json({
            token, // Custom JWT
            supabaseToken: authData.session.access_token, // Keep for potential frontend usage
            user: authData.user,
            therapist: therapist || {
                id: authData.user.id,
                email: authData.user.email,
                name: authData.user.user_metadata?.name
            }
        });

    } catch (error: any) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
