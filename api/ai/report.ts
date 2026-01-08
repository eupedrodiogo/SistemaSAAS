
import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyAuth } from '../utils/auth';

// Initialize Gemini Client
const REPORT_PROMPTS: Record<string, string> = {
  'evolution': `
      Crie um Relatório de Evolução Clínica formal.
      Use uma linguagem técnica, objetiva e profissional (padrão CFP/Psicologia).
      Estrutura:
      1. Identificação (Nome do Paciente).
      2. Resumo da Demanda Inicial.
      3. Processo Terapêutico (Foque na evolução na escala SUD e métodos TRG aplicados).
      4. Estado Atual e Prognóstico.
    `,
  'laudo': `
      Elabore um Laudo Técnico Psicológico.
      Linguagem extremamente formal e jurídica se necessário.
      Estrutura:
      1. Cabeçalho Técnico.
      2. Análise da Demanda.
      3. Procedimentos Técnicos Adotados (TRG - Terapia de Reprocessamento Generativo).
      4. Análise e Conclusão.
    `,
  'atestado': `
      Gere um Atestado Psicológico formal.
      Deve conter:
      1. Título: ATESTADO PSICOLÓGICO
      2. Texto padrão atestando que o paciente encontra-se em acompanhamento psicoterapêutico.
      3. Espaço para data e local.
      4. Espaço para assinatura do terapeuta (CRP).
      Se houver CID ou detalhes clínicos, inclua apenas se mencionado nas notas.
    `,
  'encaminhamento': `
      Gere uma Carta de Encaminhamento.
      Estrutura:
      1. A quem possa interessar / Ao Dr(a). [Especialidade].
      2. Identificação do Paciente.
      3. Motivo do Encaminhamento (baseado nas notas clínicas).
      4. Breve resumo do quadro atual.
      5. Solicitação de avaliação/conduta.
    `
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Setup logic
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
    const { patientName, reportType, clinicalNotes, metadata } = req.body;
    const templateType = reportType; // Aligning frontend input

    const apiKey = process.env.GEMINI_API_KEY;
    // Strong verification for empty strings which might exist in Vercel envs
    if (!apiKey || apiKey.trim() === '') {
      console.error('SERVER ERROR: GEMINI_API_KEY is missing or empty.');
      return res.status(500).json({
        error: 'Configuração de API ausente',
        details: 'A chave da API Gemini não foi configurada no servidor Vercel (Variável vazia ou indefinida).'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using "gemini-2.0-flash" as it is explicitly available in the account's model list
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const templatePrompt = REPORT_PROMPTS[templateType] || REPORT_PROMPTS['evolution'];

    const prompt = `
      ${templatePrompt}

      DADOS DO PACIENTE:
      Nome: ${patientName}
      
      NOTAS CLÍNICAS (Rascunho do Terapeuta):
      ${clinicalNotes}

      METADADOS DA SESSÃO:
      Fase Atual: ${metadata?.phase || 'N/A'}
      Duração: ${metadata?.duration || 'N/A'}
      SINTOMAS: ${metadata?.symptoms || 'N/A'}
      
      Instrução Final: Responda apenas com o texto do relatório, formatado em Markdown.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ report: text });

  } catch (error: any) {
    console.error('AI Report Error:', error);
    return res.status(500).json({
      error: 'Erro na geração do relatório',
      details: error.message
    });
  }
}
