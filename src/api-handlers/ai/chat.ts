
import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyAuth } from '../utils/auth';

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const SYSTEM_PROMPT = `
Você é o Nexus Copilot, um assistente especializado na Terapia de Reprocessamento Generativo (TRG).
Seu objetivo é auxiliar terapeutas com dúvidas sobre o protocolo, marketing para psicólogos e gestão de consultório.

Contexto de Conhecimento TRG:
1. Métodos: Cronológico (linha do tempo, traumas passados), Somático (dores físicas e sensações), Temático (fobias e medos específicos), Potencialização (recursos positivos).
2. Escala SUD: 0 a 10 (nível de desconforto). O objetivo é sempre zerar a SUD.
3. Segurança: Nunca sugira diagnósticos médicos. Foque no reprocessamento emocional.

Diretrizes:
- Responda de forma direta e profissional, mas acolhedora.
- Se a pergunta for sobre funcionalidades do sistema "TRG Nexus", explique como usar (Dashboard, Agenda, Prontuário).
- Se a pergunta for clínica, sugira a aplicação do método TRG adequado.

Sempre responda em Português do Brasil.
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS Setup
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 1. Verify Auth
    const user = verifyAuth(req, res);
    if (!user) return;

    try {
        const { messages, context } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Servidor não configurado com chave de IA (GEMINI_API_KEY missing).');
        }

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Mensagens inválidas.' });
        }

        // Extract last user message
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || !lastMessage.text) return res.status(400).json({ error: 'Mensagem vazia.' });

        // Construct Chat History for Gemini
        // Note: Gemini API handles history differently, but for "gemini-pro" single-turn or multi-turn
        // We will send a constructed prompt with context + history + new question

        let prompt = `${SYSTEM_PROMPT}\n\nContexto Atual da Tela: ${context || 'Dashboard'}\n\nHistórico da Conversa:\n`;

        // Add previous messages (limit to last 6 to save context window)
        messages.slice(-6).forEach((msg: any) => {
            prompt += `${msg.role === 'user' ? 'Terapeuta' : 'Nexus AI'}: ${msg.text}\n`;
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ reply: text });

    } catch (error: any) {
        console.error('AI Chat Error:', error);
        return res.status(500).json({ error: error.message || 'Erro interno na IA.' });
    }
}
