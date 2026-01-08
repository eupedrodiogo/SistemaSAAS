import dotenv from 'dotenv';
import path from 'path';
import handler from '../api/emails/welcome';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Mock Vercel Request/Response
const req: any = {
    method: 'POST',
    body: {
        email: process.env.SMTP_USER, // Send to self
        name: 'Teste Welcome',
        plan: 'testing'
    }
};

const res: any = {
    status: (code: number) => ({
        json: (data: any) => {
            console.log(`Response Status: ${code}`);
            console.log('Response Data:', data);
            return data;
        }
    })
};

console.log('--- Testing Welcome Email API ---');
handler(req, res).catch(console.error);
