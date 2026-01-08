
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fetch from 'node-fetch';

const TOKEN = process.env.META_WHATSAPP_TOKEN;
const WABA_ID = process.env.META_WABA_ID;

if (!TOKEN || !WABA_ID) {
    console.error('Missing META_WHATSAPP_TOKEN or META_WABA_ID');
    process.exit(1);
}

async function listTemplates() {
    console.log(`Checking templates for WABA ID: ${WABA_ID}...`);

    const url = `https://graph.facebook.com/v17.0/${WABA_ID}/message_templates?limit=50`;

    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        const data = await res.json();

        if (data.error) {
            console.error('API Error:', data.error);
            return;
        }

        console.log(`Found ${data.data?.length || 0} templates.`);

        data.data.forEach((t: any) => {
            console.log(`- [${t.status}] ${t.name} (${t.language})`);
        });

    } catch (err) {
        console.error('Network Error:', err);
    }
}

listTemplates();
