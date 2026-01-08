-- Permitir que usuários autenticados (você logado) visualizem as respostas
-- Rode isso no SQL Editor do Supabase para destravar o dashboard

create policy "Permitir leitura para usuários autenticados"
on validation_responses for select
to authenticated
using (true);
