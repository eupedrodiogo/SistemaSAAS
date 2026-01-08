# 🚀 Plano de Lançamento: TRG Nexus

Este documento detalha a estratégia e as etapas necessárias para o lançamento oficial do **TRG Nexus**, garantindo uma transição suave do desenvolvimento para a produção e uma entrada impactante no mercado.

---

## 📋 Sumário Executivo
O TRG Nexus é uma solução SaaS completa para terapeutas de TRG, focando em automação, gestão de pacientes e profissionalismo. O lançamento será dividido em 3 fases: **Beta Fechado**, **Lançamento Antecipado (Soft Launch)** e **Lançamento Oficial**.

---

## 🛠️ Fase 1: Prontidão Técnica (Checklist Final)
Antes de abrir as portas, devemos garantir que a infraestrutura está impecável.

- [ ] **Domínio & SSL**: Validar se o domínio final (ex: `trgnexus.com.br`) está configurado e com SSL ativo no Vercel.
- [ ] **Variáveis de Ambiente**: Conferir se todas as chaves de API (Stripe, Supabase, PicPay, PayPal, Gemini) estão no modo `Production`.
- [ ] **Webhook Validation**: Testar o ciclo completo de pagamento (Compra -> Webhook -> Liberação de Acesso) em produção.
- [ ] **Políticas de Segurança (RLS)**: Revisar todas as Row Level Security no Supabase para garantir que terapeutas não acessem dados de outros.
- [ ] **E-mails Transacionais**: Confirmar se os e-mails de boas-vindas e recuperação de senha estão chegando na caixa de entrada (não no spam).
- [ ] **Otimização de Performance**: Rodar o Lighthouse e garantir que o Core Web Vitals está no verde.
- [ ] **Documentação Legal**: Validar se Termos de Uso e Política de Privacidade estão acessíveis e atualizados.

---

## 📈 Fase 2: Estratégia de Marketing & Vendas
Como atrair os primeiros usuários e converter.

### 1. Landing Page de Alta Conversão
- **Headline**: Focada na dor do terapeuta (ex: "Sua clínica no automático").
- **Vídeo de Demonstração**: Um tour rápido de 2 minutos mostrando o dashboard e o agendamento.
- **Prova Social**: Depoimentos de usuários Beta.
- **Garantia**: Oferecer 7 dias de teste grátis ou devolução garantida.

### 2. Funil de Aquisição
- **Organic Social**: Posts diários no Instagram/LinkedIn focados em "Como o TRG Nexus resolve o problema X".
- **E-mail Marketing**: Sequência de 3 e-mails para a lista de espera:
    1. O problema da gestão manual.
    2. A solução (Nexus).
    3. Convite especial com desconto de lançamento.
- **Tráfego Pago**: Campanhas segmentadas para "Terapeutas TRG" no Meta Ads e Google Ads.

---

## 🚀 Fase 3: Cronograma de Lançamento

| Semana | Ação Principal | Objetivo |
| :--- | :--- | :--- |
| **Semana 1** | **Beta Fechado** | 10 a 20 terapeutas selecionados testando em cenário real. |
| **Semana 2** | **Ajustes & Feedback** | Correção de bugs críticos e melhorias de UX relatadas no Beta. |
| **Semana 3** | **Soft Launch** | Abertura para lista de espera com bônus de "Fundador". |
| **Semana 4** | **Lançamento Oficial** | Abertura geral com campanha massiva em redes sociais. |

---

## ☎️ Suporte e Retenção
Garantir que o usuário continue assinando.

- **Onboarding Guiado**: Manter o "Guided Tour" ativo para novos usuários.
- **Canal de Suporte**: Integração direta com WhatsApp (Já presente no código).
- **FAQ/Central de Ajuda**: Criar uma página simples com as dúvidas mais comuns.
- **Feedback Loop**: Enviar um formulário de satisfação após os primeiros 15 dias de uso.

---

## 📊 Métricas de Sucesso (KPIs)
O que vamos monitorar no Dashboard Admin:
1. **CAC (Custo de Aquisição de Cliente)**.
2. **Taxa de Conversão da Landing Page**.
3. **Churn Rate (Taxa de cancelamento)**.
4. **NPS (Net Promoter Score)**.

---

> **Ação Imediata**: Finalizar os testes de Push Notifications e Integração com WhatsApp para garantir a entrega das notificações de agendamento.
