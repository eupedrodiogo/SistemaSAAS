
import dotenv from 'dotenv';
// Load .env.local for local testing
dotenv.config({ path: '.env.local' });

const TO_PHONE = '5521972525151'; // User's phone (confirmed working)

async function sendTestAppointment() {
    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneId = process.env.META_PHONE_ID;

    console.log('--- Appointment Test Info ---');
    console.log('Template: notificacao_sessao_cliente');
    console.log('Target:', TO_PHONE);

    if (!token || !phoneId) {
        console.error('Missing credentials in .env.local');
        return;
    }

    const payload = {
        messaging_product: "whatsapp",
        to: TO_PHONE,
        type: "template",
        template: {
            name: "notificacao_sessao_cliente",
            language: { code: "pt_BR" },
            components: [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: "Pedro Diogo" },       // {{1}} Client Name
                        { type: "text", text: "Dr. Silva" },         // {{2}} Therapist Name
                        { type: "text", text: "27/12/2025" },        // {{3}} Date
                        { type: "text", text: "15:00" }              // {{4}} Time
                    ]
                }
            ]
        }
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));

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
        if (response.ok) {
            console.log('✅ Success! Message ID:', data.messages?.[0]?.id);
        } else {
            console.error('❌ Error:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

sendTestAppointment();
