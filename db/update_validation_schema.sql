-- Adicionando novos campos para capturar mais inteligência de mercado
-- Rode este script no SQL Editor do Supabase para atualizar a tabela

alter table validation_responses 
add column if not exists time_spent_weekly text, -- Quanto tempo gasta com burocracia
add column if not exists security_concern text, -- Preocupação com segurança/perda de dados
add column if not exists tech_level text; -- Nível de afinidade com tecnologia
