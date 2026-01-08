
import twilio from 'twilio';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const templateSid = process.env.TWILIO_TEMPLATE_SID;

console.log("--- WhatsApp Debug Config ---");
console.log(`Account SID: ${accountSid ? 'FOUND' : 'MISSING'}`);
console.log(`Auth Token: ${authToken ? 'FOUND' : 'MISSING'}`);
console.log(`From Number: ${fromNumber}`);
console.log(`Template SID: ${templateSid || 'MISSING (Will fallback to text)'}`);

if (!accountSid || !authToken || !fromNumber) {
    console.error("Critical credentials missing.");
    process.exit(1);
}

const client = twilio(accountSid, authToken);

async function testSend() {
    // Hardcoded test number (User's number based on previous screenshot)
    const to = "whatsapp:+5521972525151";
    const sender = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

    console.log(`\nAttempting to send to ${to} from ${sender}...`);

    try {
        if (templateSid) {
            console.log(`[Mode: TEMPLATE] Using SID: ${templateSid}`);
            const msg = await client.messages.create({
                from: sender,
                to: to,
                contentSid: templateSid,
                contentVariables: JSON.stringify({
                    "1": "Pedro Debug",
                    "2": "https://trg-nexus.vercel.app"
                })
            });
            console.log(`Message Queued! SID: ${msg.sid}`);
            console.log(`Status: ${msg.status}`);
            if (msg.errorMessage) console.error(`Twilio Error: ${msg.errorMessage}`);
        } else {
            console.log(`[Mode: FREE TEXT] Template SID not found.`);
            const msg = await client.messages.create({
                from: sender,
                to: to,
                body: "Teste de depuração TRG Nexus (Texto Livre)"
            });
            console.log(`Message Queued! SID: ${msg.sid}`);
        }
    } catch (error: any) {
        console.error("\n❌ Send Failed:");
        console.error(`Code: ${error.code}`);
        console.error(`Message: ${error.message}`);
        if (error.moreInfo) console.error(`More Info: ${error.moreInfo}`);
    }
}

testSend();
