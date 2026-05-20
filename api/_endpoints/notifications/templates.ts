export type WhatsAppTemplate = {
    name: string;
    language: { code: string };
    components?: any[];
};

export const WHATSAPP_TEMPLATES = {
    WELCOME: (userName: string): WhatsAppTemplate => ({
        name: 'welcome_trg_nexus',
        language: { code: 'pt_BR' },
        components: [
            {
                type: 'body',
                parameters: [
                    { type: 'text', text: userName }
                ]
            }
        ]
    }),
    HELLO_WORLD: {
        name: 'hello_world',
        language: { code: 'en_US' }
    },
    // Novos Templates (Aguardando Aprovação na Meta)
    BOOKING_CONFIRMATION: (therapistName: string, patientName: string, date: string, time: string): WhatsAppTemplate => ({
        name: 'confirmacao_agendamento',
        language: { code: 'pt_BR' },
        components: [
            {
                type: 'body',
                parameters: [
                    { type: 'text', text: therapistName },
                    { type: 'text', text: patientName },
                    { type: 'text', text: date },
                    { type: 'text', text: time }
                ]
            }
        ]
    }),
    BOOKING_CANCELLATION: (recipientName: string, date: string, time: string): WhatsAppTemplate => ({
        name: 'cancelamento_agendamento',
        language: { code: 'pt_BR' },
        components: [
            {
                type: 'body',
                parameters: [
                    { type: 'text', text: recipientName },
                    { type: 'text', text: date },
                    { type: 'text', text: time }
                ]
            }
        ]
    }),
    SESSION_REMINDER_15MIN: (patientName: string): WhatsAppTemplate => ({
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
    SESSION_NOTIFICATION_CLIENT: (clientName: string, therapistName: string, date: string, time: string): WhatsAppTemplate => ({
        name: 'notificacao_sessao_cliente',
        language: { code: 'pt_BR' },
        components: [
            {
                type: 'body',
                parameters: [
                    { type: 'text', text: clientName },
                    { type: 'text', text: therapistName },
                    { type: 'text', text: date },
                    { type: 'text', text: time }
                ]
            }
        ]
    })
};
