
import dotenv from 'dotenv';
// Load .env.local for local testing
dotenv.config({ path: '.env.local' });

const TO_PHONE = '5521972525151'; // User's phone from context/screenshot
// const TO_PHONE = '5511999999999'; // Fallback if needed

async function sendTestWelcome() {
    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneId = process.env.META_PHONE_ID;

    console.log('--- Debug Info ---');
    console.log('Phone ID:', phoneId);
    console.log('Token Exists:', !!token);
    console.log('Target Phone:', TO_PHONE);
    console.log('------------------');

    if (!token || !phoneId) {
        console.error('Missing credentials!');
        return;
    }

    const payload = {
        messaging_product: "whatsapp",
        to: TO_PHONE,
        type: "template",
        template: {
            name: "welcome_trg_nexus",
            language: { code: "pt_BR" },
            components: [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: "Pedro Teste" } // Simulating user name
                    ]
                }
            ]
        }
    };

    console.log('Sending Payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Body:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

sendTestWelcome();
