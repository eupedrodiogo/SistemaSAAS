
import dotenv from 'dotenv';
import path from 'path';
import twilio from 'twilio';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.VITE_TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.VITE_TWILIO_AUTH_TOKEN;

console.log('Debug Environment:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'FOUND' : 'MISSING');
console.log('VITE_TWILIO_ACCOUNT_SID:', process.env.VITE_TWILIO_ACCOUNT_SID ? 'FOUND' : 'MISSING');

if (!accountSid || !authToken) {
    console.error("Missing Twilio Credentials in .env.local (Checked standard and VITE_ prefix)");
    process.exit(1);
}

const client = twilio(accountSid, authToken);

async function createTemplate() {
    try {
        console.log("🚀 Initializing Template Creation for TRG Nexus...");

        // Content API Payload
        // Using "UTILITY" category for higher approval chance (Transactional)
        const contentCreateRequest = {
            friendlyName: "trg_nexus_welcome_v2",
            variables: {
                "1": "Pedro", // Example Value for Validation
                "2": "https://trg-nexus.vercel.app" // Example Value
            },
            types: {
                "twilio/text": {
                    "body": "Olá {{1}}, seu cadastro no TRG Nexus foi confirmado com sucesso! 🚀\n\nAcesse seu painel agora mesmo: {{2}}\n\nQualquer dúvida, responda esta mensagem."
                }
            }
        };

        // Note: Using client.request because the Content API might not be fully typed in all SDK versions yet
        // Endpoint: https://content.twilio.com/v1/Content
        // Endpoint: https://content.twilio.com/v1/Content
        const response = await client.request({
            method: 'POST',
            uri: 'https://content.twilio.com/v1/Content',
            data: contentCreateRequest,
            headers: { 'Content-Type': 'application/json' }
        });

        console.log("Raw Response Keys:", Object.keys(response));
        // Twilio 'request' usually returns { statusCode, body, headers }
        // Attempt to parse body if string, or use directly
        const responseBody = response.body ? (typeof response.body === 'string' ? JSON.parse(response.body) : response.body) : response.data;

        if (!responseBody) {
            console.error("Empty Response Body:", response);
            return;
        }

        const sid = responseBody.sid;
        console.log("✅ Template Created Successfully!");
        console.log(`🆔 SID: ${sid}`);
        console.log(`📝 Status: ${responseBody.status}`);

        // Submit for WhatsApp Approval
        // We typically need to associate it with WhatsApp profile, but for simple creation this is Step 1.
        // Actually, creating it makes it exist. Submitting is the next step.
        // Let's try to submit the approval fetch if possible.

        console.log("⏳ Submitting for WhatsApp Approval...");
        const submitResponse = await client.request({
            method: 'POST',
            uri: `https://content.twilio.com/v1/Content/${sid}/ApprovalFetch`,
            data: {
                name: "trg_nexus_welcome_v2",
                category: "UTILITY"
            }
        });

        const submitBody = submitResponse.body || submitResponse.data;
        console.log("✅ Submission Sent!");
        console.log("WhatsApp Status:", submitBody);

    } catch (err: any) {
        console.error("❌ Error:", err.response ? err.response.data : err.message);
    }
}

createTemplate();
