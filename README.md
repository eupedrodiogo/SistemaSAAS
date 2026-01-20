<div align="center">


# ⚠️ PROPRIETARY SOURCE CODE - PORTFOLIO ONLY

> **This repository is public solely for demonstration and portfolio purposes.**
>
> All code herein is the intellectual property of **Pedro Diogo**.  
> **Copying, redistribution, or commercial use without express written permission is strictly prohibited.**
</div>


<div align="center">

# Tera Nexus - Intelligent Therapy Management SaaS

[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)

**The "24h Digital Assistant" for TRG Therapists.**  
*A comprehensive SaaS platform that automates anamnesis, scheduling, and financial tracking.*

[View Live Demo](https://trg-nexus.vercel.app/) | [Contact Developer](https://www.linkedin.com/in/pedro-diogo-developer/)

[🇧🇷 Leia em Português](README.pt-br.md)

</div>

---

## 🚀 Project Overview

**Tera Nexus** is a specialized SaaS solution built to solve the operational chaos faced by therapists. It moves beyond simple scheduling to offer a **complete practice management ecosystem**.

The system replaces manual spreadsheets and paper records with a secure, cloud-based platform that handles everything from patient intake (anamnesis) to financial reporting, allowing therapists to focus 100% on their patients.

## ✨ Key Features

### 🧠 Intelligent Anamnesis & Protocols
- **Automated Intake Forms**: Patients fill out their history before the first session.
- **Protocol Tracking**: Visual progress bars for Reorganization, Reprocessing, and Potentiation phases.
- **Smart Insights**: AI-ready structure to analyze patient progress over time.

### 📅 Advanced Scheduling System
- **Self-Booking Portal**: Patients can book sessions based on real-time therapist availability.
- **Automated Notifications**: WhatsApp and Email reminders to reduce no-shows.
- **Timezone Intelligence**: Handles cross-border therapy sessions seamlessly.

### 💼 Financial Command Center
- **Real-time Dashboard**: Revenue tracking, projected income, and expense management.
- **Subscription Management**: Tiers for "Iniciante" vs "Profissional" therapist access.
- **Payment Integration**: Ready for Stripe/PIX integration flows.

### 🔒 Security & Compliance
- **LGPD/GDPR Ready**: Data anonymization and consent management.
- **Role-Based Access Control (RBAC)**: Strict data isolation using Supabase RLS policies.
- **Encryption**: End-to-end security best practices.

## 🛠️ Technical Architecture

This project was architected for **scalability** and **performance**:

- **Frontend**: Built with **React 18** and **TypeScript** for type-safe, robust code.
- **State Management**: Context API for global auth and theme state.
- **Styling**: **Tailwind CSS** for a modern, responsive, and dark-mode-first design.
- **Backend / Database**: **Supabase** (PostgreSQL) providing:
    - **Authentication**: Secure email/password and potential social logins.
    - **Row Level Security (RLS)**: Database-level security policies ensuring therapists only access their own data.
    - **Edge Functions**: For server-side logic like notifications and payment processing.
- **Deployment**: CI/CD pipeline via **Vercel**, ensuring instant deployments on git push.

## 📂 Project Structure

```bash
c:/Projetos/sistema-saas/
├── src/
│   ├── api/            # Serverless functions (Edge)
│   ├── components/     # Reusable UI components (Atomic design)
│   ├── contexts/       # Global state (Auth, Theme)
│   ├── hooks/          # Custom React hooks (Logic extraction)
│   ├── lib/            # Infrastructure clients (Supabase, OpenAI)
│   └── services/       # API integration layer
├── db/                 # SQL migrations and schema
└── docs/               # Project documentation
```

## 👨‍💻 Developer Contact

**Pedro Diogo**  
*Full Stack Developer & Software Architect*

Open for **Tech Lead** roles, **Senior Frontend** positions, or **SaaS Partnership** opportunities.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/pedro-diogo-developer/)
[![Email](https://img.shields.io/badge/Email-Contact_Me-red?style=for-the-badge&logo=gmail)](mailto:contact@pedrodiogo.dev)
