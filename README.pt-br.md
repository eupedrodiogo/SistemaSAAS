
<div align="center">

# Tera Nexus - SaaS de Gestão Inteligente para Terapeutas

[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)

**A "Assistente Digital 24h" para Terapeutas TRG.**  
*Uma plataforma SaaS completa que automatiza anamnese, agendamento e controle financeiro.*

[Ver Demo Online](https://trg-nexus.vercel.app/) | [Contato do Desenvolvedor](https://www.linkedin.com/in/pedro-diogo-developer/)

[🇺🇸 Read in English](README.md)

</div>

---

## 🚀 Visão Geral do Projeto

**Tera Nexus** é uma solução SaaS especializada construída para resolver o caos operacional enfrentado por terapeutas. Ele vai além do simples agendamento para oferecer um **ecossistema completo de gestão de consultório**.

O sistema substitui planilhas manuais e prontuários de papel por uma plataforma segura em nuvem que cuida de tudo, desde a admissão do paciente (anamnese) até relatórios financeiros, permitindo que os terapeutas foquem 100% em seus pacientes.

## ✨ Funcionalidades Chave

### 🧠 Anamnese Inteligente & Protocolos
- **Formulários de Admissão Automatizados**: Pacientes preenchem seu histórico antes da primeira sessão.
- **Rastreamento de Protocolos**: Barras de progresso visuais para fases de Reorganização, Reprocessamento e Potencialização.
- **Insights Inteligentes**: Estrutura pronta para IA analisar o progresso do paciente ao longo do tempo.

### 📅 Sistema de Agendamento Avançado
- **Portal de Autoagendamento**: Pacientes podem agendar sessões baseados na disponibilidade real do terapeuta.
- **Notificações Automatizadas**: Lembretes via WhatsApp e E-mail para reduzir faltas (no-shows).
- **Inteligência de Fuso Horário**: Lida com sessões de terapia internacionais sem problemas.

### 💼 Centro de Comando Financeiro
- **Dashboard em Tempo Real**: Rastreamento de receita, renda projetada e gestão de despesas.
- **Gestão de Assinaturas**: Níveis de acesso para terapeutas "Iniciantes" vs "Profissionais".
- **Integração de Pagamentos**: Pronto para fluxos de integração com Stripe e PIX.

### 🔒 Segurança & Compliance
- **Pronto para LGPD**: Anonimização de dados e gestão de consentimento.
- **Controle de Acesso Baseado em Função (RBAC)**: Isolamento estrito de dados usando políticas RLS do Supabase.
- **Criptografia**: Melhores práticas de segurança de ponta a ponta.

## 🛠️ Arquitetura Técnica

Este projeto foi arquitetado focado em **escalabilidade** e **performance**:

- **Frontend**: Construído com **React 18** e **TypeScript** para código robusto e tipado.
- **Gerenciamento de Estado**: Context API para estados globais de autenticação e tema.
- **Estilização**: **Tailwind CSS** para um design moderno, responsivo e focado em dark-mode.
- **Backend / Banco de Dados**: **Supabase** (PostgreSQL) fornecendo:
    - **Autenticação**: Email/senha seguros e login social.
    - **Row Level Security (RLS)**: Políticas de segurança a nível de banco de dados garantindo que terapeutas acessem apenas seus próprios dados.
    - **Edge Functions**: Para lógica server-side como notificações e processamento de pagamentos.
- **Deploy**: Pipeline CI/CD via **Vercel**, garantindo deploys instantâneos via git push.

## 📂 Estrutura do Projeto

```bash
c:/Projetos/sistema-saas/
├── src/
│   ├── api/            # Serverless functions (Edge)
│   ├── components/     # Componentes UI Reutilizáveis (Atomic design)
│   ├── contexts/       # Estado Global (Auth, Theme)
│   ├── hooks/          # Hooks React Customizados (Extração de Lógica)
│   ├── lib/            # Clientes de Infraestrutura (Supabase, OpenAI)
│   └── services/       # Camada de Integração com API
├── db/                 # Migrations SQL e Schema
└── docs/               # Documentação do Projeto
```

## 👨‍💻 Contato do Desenvolvedor

**Pedro Diogo**  
*Desenvolvedor Full Stack & Arquiteto de Software*

Disponível para cargos de **Tech Lead**, **Frontend Sênior** ou oportunidades de **Parceria SaaS**.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Conectar-blue?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/pedro-diogo-developer/)
[![Email](https://img.shields.io/badge/Email-Contato-red?style=for-the-badge&logo=gmail)](mailto:contact@pedrodiogo.dev)
