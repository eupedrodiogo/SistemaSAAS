
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const targetPhone = process.argv[2];

if (!targetPhone) {
    console.error('Usage: npx ts-node scripts/send_test_whatsapp.ts <PHONE_NUMBER>');
    process.exit(1);
}

// Self-contained function to avoid ts-node import issues
async function sendMetaWhatsAppTest(to: string, templateName: string, languageCode: string = 'pt_BR') {
    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneId = process.env.META_PHONE_ID;

    if (!token || !phoneId) {
        console.warn('Meta WhatsApp credentials missing.');
        return { success: false, error: 'missing_credentials' };
    }

    // Format phone
    let cleanPhone = to.replace(/\D/g, '');
    if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) cleanPhone = '55' + cleanPhone;

    console.log(`Sending to formatted number: ${cleanPhone}`);
    console.log(`Using Phone ID: ${phoneId}`);
    console.log(`Language Code: ${languageCode}`);
    // console.log(`Using Token: ${token.substring(0, 10)}...`);

    const payload = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
            name: templateName,
            language: { code: languageCode },
        }
    };

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

        if (!response.ok) {
            console.error('Meta WhatsApp Error:', JSON.stringify(data, null, 2));
            return { success: false, error: data };
        }

        console.log(`✅ Meta WhatsApp sent successfully! Message ID:`, data.messages?.[0]?.id);
        return { success: true, id: data.messages?.[0]?.id };

    } catch (error: any) {
        console.error('Meta WhatsApp Network Error:', error);
        return { success: false, error: error.message };
    }
}

(async () => {
    console.log(`Sending test message to ${targetPhone}...`);
    await sendMetaWhatsAppTest(
        targetPhone,
        'hello_world',
        'en_US'
    );
})();
