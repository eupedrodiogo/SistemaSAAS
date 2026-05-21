export const getEmailTemplate = (plan: string, name: string, magicLink?: string) => {
    const primaryColor = '#0f172a'; // Slate 900
    const accentColor = '#3b82f6';  // Blue 500
    const footerColor = '#64748b';  // Slate 500

    // Base container style
    const containerStyle = `
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        background-color: #ffffff;
    `;

    const headerStyle = `
        background-color: ${primaryColor};
        padding: 32px;
        text-align: center;
    `;

    const bodyStyle = `
        padding: 40px 32px;
        color: #334155;
        line-height: 1.6;
    `;

    const buttonStyle = `
        display: inline-block;
        background-color: ${accentColor};
        color: white;
        padding: 14px 32px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
        margin-top: 24px;
        text-align: center;
    `;

    let title, subject, content;
    // Use the provided magicLink if available, otherwise fallback to the standard login URL
    const loginUrl = magicLink || (process.env.VITE_APP_URL ? `${process.env.VITE_APP_URL}/login` : 'https://trg-nexus.vercel.app/login');

    switch (plan) {
        case 'price_1ScuH5KPo7EypB7VQ7epTjiW': // Estágio
        case 'estagio':
            subject = 'Começou! Seu Acesso ao TRG Nexus (Plano Estágio) 🚀';
            title = 'Bem-vindo ao Início da Sua Jornada';
            content = `
                <p style="font-size: 18px;">Olá, <strong>${name}</strong>!</p>
                <p>Parabéns por investir na sua carreira. O <strong>Plano Estágio</strong> é o primeiro passo para organizar seus atendimentos e ganhar confiança clínica.</p>
                <p>Você agora tem acesso a:</p>
                <ul style="color: #475569;">
                    <li>Prontuário Digital Simplificado</li>
                    <li>Organização básica de pacientes</li>
                    <li>Segurança de dados criptografados</li>
                </ul>
                <p>Estamos honrados em fazer parte do seu crescimento.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="${buttonStyle}">Acessar Minha Conta</a>
                </div>
            `;
            break;

        case 'price_1ScuH5KPo7EypB7VnIs6qfbQ': // Iniciante (Antigo)
        case 'price_1Sd8DXKPo7EypB7VeUWX8m7L': // Iniciante (0.50)
        case 'iniciante':
        case 'starter':
            subject = 'Agora é Profissional! Bem-vindo ao TRG Nexus 🌟';
            title = 'Você Subiu de Nível';
            content = `
                <p style="font-size: 18px;">Olá, <strong>${name}</strong>!</p>
                <p>Excelente decisão. Com o <strong>Plano Iniciante</strong>, você deixa de apenas "atender" para começar a <strong>gerir</strong> sua clínica.</p>
                <p>Destaques do seu acesso:</p>
                <ul style="color: #475569;">
                    <li>Até 10 Pacientes ativos</li>
                    <li>Agenda inteligente</li>
                    <li>Suporte dedicado por email</li>
                </ul>
                <p>Sua organização acaba de ganhar um upgrade sério.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="${buttonStyle}">Começar Agora</a>
                </div>
            `;
            break;

        case 'price_1SZgFjKPo7EypB7V8hI35TpO': // Profissional (Antigo)
        case 'price_1Sd8DXKPo7EypB7VZwytTUEP': // Profissional (0.50)
        case 'profissional':
        case 'pro':
            subject = 'Elite TRG: Bem-vindo ao Nexus Profissional 💎';
            title = 'Alta Performance Ativada';
            content = `
                <p style="font-size: 18px;">Olá, <strong>${name}</strong>!</p>
                <p>Você acaba de entrar para o grupo dos terapeutas que levam a gestão tão a sério quanto o protocolo. O <strong>Plano Profissional</strong> é a nossa experiência completa.</p>
                <p>Seu arsenal completo inclui:</p>
                <ul style="color: #475569;">
                    <li><strong>Pacientes Ilimitados</strong></li>
                    <li>Relatórios com Inteligência Artificial</li>
                    <li>Gestão Financeira e Recibos</li>
                    <li>Suporte Prioritário</li>
                </ul>
                <p>Estamos prontos para escalar junto com você.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="${buttonStyle}">Acessar Painel VIP</a>
                </div>
            `;
            break;

        default: // Fallback / Trial
            subject = 'Seu Teste Grátis no TRG Nexus Começou! ⚡';
            title = 'Experimente o Poder da Organização';
            content = `
                <p style="font-size: 18px;">Olá, <strong>${name}</strong>!</p>
                <p>Seja muito bem-vindo. Você tem 7 dias para explorar o sistema que está revolucionando a gestão de terapeutas TRG.</p>
                <p>Aproveite cada funcionalidade e veja como simplificar sua rotina.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="${buttonStyle}">Iniciar Teste</a>
                </div>
            `;
    }

    // Combine into full HTML
    return {
        subject,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 20px; background-color: #f8fafc;">
                <div style="${containerStyle}">
                    <div style="${headerStyle}">
                        <h1 style="color: white; margin: 0; font-size: 24px;">TRG <span style="color: ${accentColor}">Nexus</span></h1>
                    </div>
                    <div style="${bodyStyle}">
                        <h2 style="color: ${primaryColor}; margin-top: 0;">${title}</h2>
                        ${content}
                        <p style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: ${footerColor}; text-align: center;">
                            Este email foi enviado automaticamente pelo TRG Nexus.<br>
                            Se você não realizou este cadastro, por favor ignore.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};
