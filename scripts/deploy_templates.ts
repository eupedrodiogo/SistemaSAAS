
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fetch from 'node-fetch';

const TOKEN = process.env.META_WHATSAPP_TOKEN;
const PHONE_ID = process.env.META_PHONE_ID;

console.log('Loaded API Key names:', Object.keys(process.env).filter(k => k.includes('WHATSAPP') || k.includes('META') || k.includes('TOKEN')));

if (!TOKEN || !PHONE_ID) {
    console.error(`Missing credentials. TOKEN=${!!TOKEN}, PHONE_ID=${!!PHONE_ID}`);
    process.exit(1);
}

const BASE_URL = 'https://graph.facebook.com/v17.0';

async function getBusinessAccountId() {
    console.log('Fetching Business Account ID...');
    const res = await fetch(`${BASE_URL}/${PHONE_ID}?fields=business_account_id`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const data = await res.json();
    if (data.error) {
        throw new Error(data.error.message);
    }
    return data.id; // Note: Endpoint returns the phone object, which *should* have business_account_id if fields requested
    // Actually for Phone ID endpoint, it validates the token has access. 
    // Wait, the documentation says GET /PHONE_ID?fields=business_account returns { "business_account": { "id": "..." } } or similar?
    // Let's print data to be sure if debugging, but I'll assume standard structure or WABA ID might need to be provided manually if this fails.
    // Actually, let's try to list templates first, maybe we don't need WABA ID if we use the account endpoint? 
    // No, templates are owned by the WABA, not the phone number.
    // We MUST have the WABA ID.
    return data.business_account?.id || data.id; // Fallback? 
}

const TEMPLATES = [
    {
        name: 'confirmacao_agendamento',
        category: 'UTILITY',
        components: [
            {
                type: 'BODY',
                text: 'Olá {{1}}! 🗓️\n\nVocê tem um novo agendamento confirmado.\n\n👤 Paciente: {{2}}\n📅 Data: {{3}}\n⏰ Horário: {{4}}\n\nAcesse o painel para ver mais detalhes.',
                example: {
                    body_text: [['Pedro', 'Maria Silva', '25/12', '14:30']]
                }
            }
        ],
        language: 'pt_BR'
    },
    {
        name: 'cancelamento_agendamento',
        category: 'UTILITY',
        components: [
            {
                type: 'BODY',
                text: 'Atenção, {{1}}. ⚠️\n\nO agendamento previsto para {{2}} às {{3}} foi cancelado.\n\nMotivo/Status: Cancelado pelo sistema.\nEntre em contato para reagendar se necessário.',
                example: {
                    body_text: [['Pedro', '25/12', '14:30']]
                }
            }
        ],
        language: 'pt_BR'
    },
    {
        name: 'lembrete_sessao_15min_v2',
        category: 'UTILITY',
        components: [
            {
                type: 'BODY',
                text: 'Olá {{1}}! 👋\n\nSua sessão de terapia começa em 15 minutos.\n\nPrepare seu ambiente e garanta uma boa conexão.\nEstamos aguardando você!',
                example: {
                    body_text: [['Maria Silva']]
                }
            }
        ],
        language: 'pt_BR'
    },
    {
        name: 'notificacao_sessao_cliente',
        category: 'UTILITY',
        components: [
            {
                type: 'BODY',
                text: 'Olá {{1}}! ✅\n\nSeu agendamento de sessão está confirmado.\n\n🧠 Terapeuta: {{2}}\n📅 Data: {{3}}\n⏰ Horário: {{4}}\n\nAcesse o portal para mais informações ou para iniciar a sessão na hora marcada.',
                example: {
                    body_text: [['Pedro Antunes', 'Dra. Ana Costa', '15/01/2026', '14:30']]
                }
            }
        ],
        language: 'pt_BR'
    }
];

async function deploy() {
    try {
        // 1. Get WABA ID
        let wabaId = process.env.META_WABA_ID;

        if (!wabaId) {
            // Note: GET /v17.0/{phone-id} fields=business_account
            const phoneDataRes = await fetch(`${BASE_URL}/${PHONE_ID}?fields=whatsapp_business_account`, {
                headers: { Authorization: `Bearer ${TOKEN}` }
            });
            const phoneData = await phoneDataRes.json();

            if (phoneData.error) throw new Error(`Phone Lookup Error: ${phoneData.error.message}`);

            wabaId = phoneData.whatsapp_business_account?.id;
        }

        if (!wabaId) throw new Error('Could not find WhatsApp Business Account ID linked to this Phone ID.');

        console.log(`Using WABA ID: ${wabaId}`);

        // 2. Create Templates
        for (const tmpl of TEMPLATES) {
            console.log(`Creating template: ${tmpl.name}...`);
            const res = await fetch(`${BASE_URL}/${wabaId}/message_templates`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tmpl)
            });
            const data = await res.json();

            if (data.error) {
                console.error(`❌ Failed to create ${tmpl.name}:`, data.error.message);
                if (data.error.message.includes('already exists')) {
                    console.log('   (Skipping, already exists)');
                }
            } else {
                console.log(`✅ Created ${tmpl.name} (Status: ${data.status})`);
            }
        }

    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

deploy();
