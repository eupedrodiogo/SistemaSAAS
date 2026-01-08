
import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyAuth } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS Setup
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // 1. Verify Auth
    const user = verifyAuth(req, res);
    if (!user) return;

    try {
        const { appointments, dateRange, blockedTimes } = req.body;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Configuração de API ausente' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            Você é um assistente de produtividade clínica para terapeutas TRG.
            Analise a seguinte lista de agendamentos e horários bloqueados para o período: ${dateRange}.
            
            Dados de Entrada:
            1. Agendamentos (JSON):
            ${JSON.stringify(appointments)}

            2. Horários Bloqueados (JSON) - Respeite RIGOROSAMENTE estes bloqueios:
            ${JSON.stringify(blockedTimes || [])}

            OBJETIVO: Otimizar a agenda para aumentar a produtividade e eliminar "buracos" (janelas ociosas) desnecessários.
            
            REGRAS DE OURO:
            - NÃO sugira horários que conflitem com "Horários Bloqueados".
            - Tente agrupar atendimentos sequencialmente (ex: 09:00, 10:00, 11:00) para evitar janelas de 30min ou 1h soltas no meio do dia.
            - Considere a duração padrão de atendimento como 1 hora, salvo se o agendamento indicar outro intervalo.
            - Se um dia estiver muito vazio, sugira mover pacientes isolados para dias mais cheios (compactação semanal), se fizer sentido.
            
            Retorne APENAS um JSON com o seguinte formato, idêntico a este exemplo, sem markdown:
            {
                "analysis": "Texto explicativo sobre a eficiência atual e o que foi melhorado.",
                "suggestions": [
                    {
                        "originalAppointmentId": "id_original",
                        "patientName": "Nome do Paciente",
                        "currentDate": "YYYY-MM-DD",
                        "currentTime": "HH:MM",
                        "suggestedDate": "YYYY-MM-DD",
                        "suggestedTime": "HH:MM",
                        "reason": "Explicação clara do porquê (ex: 'Move para logo após o paciente X para fechar janela')"
                    }
                ],
                "savings": "Estimativa de tempo ganho (ex: '3 horas de janelas eliminadas')"
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Cleanup markdown code blocks if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const jsonResponse = JSON.parse(text);

        return res.status(200).json(jsonResponse);

    } catch (error: any) {
        console.error('AI Optimize Error:', error);
        return res.status(500).json({
            error: 'Erro na otimização da agenda',
            details: error.message
        });
    }
}
