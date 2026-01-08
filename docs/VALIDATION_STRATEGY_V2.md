# 🧪 Estratégia de Validação V2: "Founder Appeal"

Em substituição à estratégia de Ads tradicional, adotamos uma abordagem baseada em **conexão pessoal ("Founder Appeal")** e **design premium**, mas em modo "stealth" (sem revelar o produto completo).

## 1. O Conceito
Em vez de vender um software, pedimos **ajuda**.
*   **Headline:** "Ajude a construir o futuro da Terapia TRG".
*   **Narrativa:** "Sou o Pedro, dev e entusiasta. Vi que vocês sofrem. Quero ajudar, mas preciso saber onde dói."
*   **Visual:** Dark Mode, Minimalista, Ícone de "Dev" (não logo de empresa), Foco em Conversão.

## 2. A Estrutura da Solução

### A) Landing Page (`/ajuda`)
Página ultra-leve focada em apenas duas ações:
1.  **Survey (Pesquisa):** Coleta de dados estruturados.
2.  **WhatsApp:** Contato direto para quem prefere falar.

### B) Custom Form (`/ajuda/pesquisa`)
Substituímos o Google Forms por um formulário nativo React (`ValidatorSurvey.tsx`) integrado ao Supabase.
*   **Por que?**
    *   Mantém a identidade visual (Dark/Emerald).
    *   Passa mais credibilidade e profissionalismo do que um link externo.
    *   Salva o lead automaticamente no nosso banco de dados.

### C) Banco de Dados (`validation_responses`)
Tabela no Supabase criada para armazenar:
*   Email/WhatsApp
*   Dores selecionadas
*   Interesse em IA/Caderno Digital

## 3. Como Divulgar (Organic & Direct)
Como não estamos usando Ads pagos massivos agora, a divulgação será:
1.  **Grupos de WhatsApp de Terapeutas:** "Gente, sou dev e tô criando uma ferramenta pra nós. Quem puder opinar..."
2.  **Direct do Instagram:** Abordagem manual em perfis de terapeutas.
3.  **Link na Bio:** Temporário.

## 4. Próximos Passos
1.  Rodar o script SQL no Supabase.
2.  Compartilhar o link `seudominio.com/ajuda` (ou `localhost...` se for mostrar pessoalmente).
3.  Monitorar a tabela `validation_responses`.
