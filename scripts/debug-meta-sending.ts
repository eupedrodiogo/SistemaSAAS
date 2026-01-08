
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const token = process.env.META_WHATSAPP_TOKEN;
const phoneId = process.env.META_PHONE_ID;

// User's number from previous logs (55 21 97252-5151)
const recipientPhone = "5521996730725";

console.log("--- Meta WhatsApp Debug ---");
console.log(`Phone ID: ${phoneId}`);
console.log(`Token: ${token ? 'FOUND (' + token.substring(0, 10) + '...)' : 'MISSING'}`);
console.log(`Target: ${recipientPhone}`);

if (!token || !phoneId) {
    console.error("Missing Credentials");
    process.exit(1);
}

// Meta API allows sending a "hello_world" test template without prior approval
const payload = {
    messaging_product: "whatsapp",
    to: recipientPhone,
    type: "template",
    template: {
        name: "hello_world",
        language: { code: "en_US" }
    }
};

async function sendTest() {
    try {
        console.log("Sending request to Meta Graph API...");
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ Message Sent!");
            console.log("Response:", JSON.stringify(data, null, 2));
        } else {
            console.error("❌ Send Failed:");
            console.error(JSON.stringify(data, null, 2));
        }
    } catch (err: any) {
        console.error("❌ Network Error:", err.message);
    }
}

sendTest();
