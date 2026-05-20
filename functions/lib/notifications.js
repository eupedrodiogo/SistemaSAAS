"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WHATSAPP_TEMPLATES = void 0;
exports.sendMetaWhatsApp = sendMetaWhatsApp;
const axios_1 = __importDefault(require("axios"));
exports.WHATSAPP_TEMPLATES = {
    SESSION_REMINDER_15MIN: (patientName) => ({
        name: 'lembrete_sessao_15min_v2',
        language: { code: 'pt_BR' },
        components: [
            {
                type: 'body',
                parameters: [
                    { type: 'text', text: patientName }
                ]
            }
        ]
    }),
};
async function sendMetaWhatsApp(to, template) {
    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneId = process.env.META_PHONE_ID;
    if (!token || !phoneId) {
        console.warn('Meta WhatsApp credentials missing.');
        return { success: false, error: 'missing_credentials' };
    }
    let cleanPhone = to.replace(/\D/g, '');
    if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11)
        cleanPhone = '55' + cleanPhone;
    const payload = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
            name: template.name,
            language: { code: template.language.code },
            components: template.components
        }
    };
    try {
        const response = await axios_1.default.post(`https://graph.facebook.com/v21.0/${phoneId}/messages`, payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return { success: true, id: response.data.messages?.[0]?.id };
    }
    catch (error) {
        console.error('Meta WhatsApp Network Error:', error.response?.data || error.message);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=notifications.js.map