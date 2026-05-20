import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Check,
    Shield,
    Lock,
    EyeOff,
    Calendar,
    Bot,
    Sparkles,
    ChevronRight,
    Info,
    ArrowRight
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe (Replace with your Publishable Key)
const stripePromise = loadStripe('pk_live_51MPKq2Lz0qOQeXyX0B9gZ5q5q5q5q5q5');

const BetaLandingPage: React.FC = () => {
    const navigate = useNavigate();

    // Handle Join Waitlist / Beta Access
    const handleJoinBeta = () => {
        // Logic to save email or redirect to register
        navigate('/register');
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-[#2dd4bf] selection:text-[#0f172a]">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2dd4bf] to-[#0f172a] border border-[#2dd4bf]/20 flex items-center justify-center relative overflow-hidden group">
                            <img src="/logo-new.jpg" alt="TeraNexus Logo" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tight text-white">TeraNexus</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#2dd4bf] font-semibold">Intelligence</span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm text-gray-400 hover:text-white transition-colors font-medium hover:bg-white/5 px-4 py-2 rounded-lg"
                    >
                        Entrar no Beta
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-48 pb-32 px-6 relative overflow-hidden">
                {/* Background Glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#2dd4bf]/5 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2dd4bf]/10 border border-[#2dd4bf]/20 mb-10 backdrop-blur-sm animate-fade-in-up">
                        <Sparkles className="w-3 h-3 text-[#2dd4bf]" />
                        <span className="text-sm font-semibold text-[#2dd4bf]">Acesso Antecipado: TeraNexus Beta</span>
                    </div>

                    {/* Quote */}
                    <h2 className="text-xl md:text-2xl font-light text-gray-400 italic mb-8 max-w-2xl mx-auto leading-relaxed">
                        "Meu primeiro 'cliente' é a <span className="text-[#2dd4bf] font-semibold not-italic relative inline-block">
                            minha esposa
                            <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#2dd4bf]/50"></span>
                        </span> (futura Terapeuta TRG)."
                    </h2>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-bold mb-16 tracking-tight leading-tight">
                        Ajude a construir o futuro da <br className="hidden md:block" />
                        <span className="bg-gradient-to-r from-[#2dd4bf] via-[#38bdf8] to-[#3b82f6] bg-clip-text text-transparent">
                            Terapia TRG
                        </span>
                    </h1>

                    {/* Story Box */}
                    <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 md:p-12 text-left mb-16 relative overflow-hidden hover:border-[#2dd4bf]/30 transition-all duration-500 group shadow-2xl shadow-black/50">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#2dd4bf] to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>

                        <div className="space-y-6 text-lg text-gray-300 leading-relaxed font-light">
                            <p>
                                Sou o <strong className="text-white font-semibold">Pedro Diogo</strong>, desenvolvedor de software. Tudo começou em casa: eu planejava criar um sistema genérico para psicólogos, até que minha esposa — que está se formando em TRG — me questionou: <em className="text-[#2dd4bf] bg-[#2dd4bf]/5 px-1 rounded">'E para a minha área? A gente precisa de algo específico!'</em>.
                            </p>

                            <p>
                                Fui estudar o mercado dela e entendi: vocês já têm o excelente TRG Club para agenda e vídeo, mas vi a oportunidade de criar o complemento perfeito focado na <strong className="text-white font-semibold">Gestão dos registros, evolução dos clientes e dos processos administrativos.</strong>
                            </p>

                            <p>
                                Aceitei o desafio dela. Estou construindo essa solução para ela (e para você). Me ajude utilizando o sistema e me passando feedback para eu não criar algo inútil.
                            </p>
                        </div>

                        {/* Transparency Note */}
                        <div className="mt-10 bg-[#1e293b]/50 rounded-xl p-5 flex gap-4 items-start border border-dashed border-gray-700">
                            <Info className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nota de Transparência</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    A metodologia TRG (Terapia de Reprocessamento Generativo) foi desenvolvida pelo Jair Soares, que também possui todos os direitos sobre a marca. O TeraNexus é uma solução independente focada em produtividade.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleJoinBeta}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#2dd4bf] text-[#0f172a] rounded-full font-bold text-lg hover:bg-[#14b8a6] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(45,212,191,0.4)]"
                    >
                        Quero Participar do Beta
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </section>

            {/* Feature Grid Section */}
            <section className="py-24 px-6 bg-[#0f172a]">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 relative">
                        {/* Vertical Divider (Desktop) */}
                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

                        {/* Column 1: Ready */}
                        <div>
                            <div className="flex items-center gap-3 mb-10">
                                <div className="w-10 h-10 rounded-full bg-[#2dd4bf]/20 flex items-center justify-center ring-4 ring-[#2dd4bf]/5">
                                    <Check className="w-5 h-5 text-[#2dd4bf]" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Pronto para usar</h3>
                                    <p className="text-gray-400 text-sm mt-1">Funcionalidades testadas e aprovadas para sua rotina diária.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <FeatureCard
                                    icon={<Calendar className="w-5 h-5 text-[#2dd4bf]" />}
                                    title="Registro de Dados Inteligente"
                                    status="Disponível"
                                    description="Histórico completo do paciente com templates personalizáveis e busca rápida."
                                    active
                                />
                                <FeatureCard
                                    icon={<Lock className="w-5 h-5 text-[#2dd4bf]" />}
                                    title="Anotações Criptografadas"
                                    status="Disponível"
                                    description="Segurança de nível bancário para todas as suas notas de sessão."
                                    active
                                />
                            </div>
                        </div>

                        {/* Column 2: Horizon */}
                        <div>
                            <div className="flex items-center gap-3 mb-10 opacity-70">
                                <div className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center border-dashed">
                                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-600 animate-spin-slow absolute"></div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-300">No Horizonte</h3>
                                    <p className="text-gray-500 text-sm mt-1">O que estamos construindo juntos com nossos parceiros Beta.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <FeatureCard
                                    icon={<Bot className="w-5 h-5 text-gray-400" />}
                                    title="Assistente IA (TeraBot)"
                                    status="Em breve"
                                    description="Resumos automáticos de sessões e sugestões de insights clínicos baseados em padrões."
                                />
                                <FeatureCard
                                    icon={<Calendar className="w-5 h-5 text-gray-400" />}
                                    title="Auto-Agendamento"
                                    status="Em breve"
                                    description="Link inteligente que negocia horários com pacientes e reduz no-shows."
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Privacy Section */}
            <section className="py-32 px-6 relative">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="inline-block p-3 rounded-2xl bg-white/5 mb-8">
                        <Shield className="w-8 h-8 text-[#2dd4bf]" />
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Sua privacidade não é negociável</h2>
                    <p className="text-gray-400 mb-20 max-w-2xl mx-auto text-lg">Desenvolvido seguindo rigorosos padrões de segurança internacional. Seus dados e os de seus pacientes são sagrados.</p>

                    <div className="grid md:grid-cols-3 gap-8">
                        <PrivacyCard
                            icon={<Shield className="w-6 h-6 text-[#2dd4bf]" />}
                            title="LGPD Compliant"
                            description="Estrutura de dados totalmente alinhada com a Lei Geral de Proteção de Dados desde a primeira linha de código."
                        />
                        <PrivacyCard
                            icon={<Lock className="w-6 h-6 text-[#2dd4bf]" />}
                            title="Criptografia Ponta-a-Ponta"
                            description="Nem nós temos acesso aos seus registros de dados. Tudo é criptografado antes de sair do seu dispositivo."
                        />
                        <PrivacyCard
                            icon={<EyeOff className="w-6 h-6 text-[#2dd4bf]" />}
                            title="Anonimização de IA"
                            description="Nossos modelos de IA são treinados em dados sintéticos e anonimizados. Zero exposição de dados reais."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 pb-40">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] rounded-[2.5rem] p-12 md:p-16 text-center border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-40 bg-[#2dd4bf]/5 blur-[120px] rounded-full group-hover:bg-[#2dd4bf]/10 transition-all duration-700"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-16 h-16 bg-[#2dd4bf]/10 rounded-2xl flex items-center justify-center mb-8 border border-[#2dd4bf]/20 shadow-[0_0_30px_rgba(45,212,191,0.2)]">
                                <Sparkles className="w-8 h-8 text-[#2dd4bf]" />
                            </div>

                            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">Comece a fazer parte do grupo seleto de impulsionadores!</h2>
                            <p className="text-gray-400 mb-10 max-w-xl mx-auto text-lg">
                                Junte-se a lista de terapeutas visionários que estão definindo o novo padrão de atendimento e produtividade.
                            </p>

                            <button
                                onClick={handleJoinBeta}
                                className="inline-flex items-center gap-2 px-10 py-5 bg-[#2dd4bf] text-[#0f172a] rounded-xl font-bold text-lg hover:bg-[#14b8a6] transition-all hover:scale-105 shadow-[0_4px_20px_rgba(45,212,191,0.3)] mb-8"
                            >
                                Entrar na Lista
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            <span className="text-[#2dd4bf] text-xs font-semibold bg-[#2dd4bf]/10 px-4 py-2 rounded-full border border-[#2dd4bf]/20">
                                ✨ Acesso imediato ao plano Beta Vitalício para os cinco primeiros da lista.
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 text-center border-t border-white/5 bg-[#020617]">
                <p className="text-gray-500 mb-2 text-sm">Feito com <span className="text-[#2dd4bf]">💚</span> para terapeutas inovadores.</p>
                <p className="text-gray-600 text-xs uppercase tracking-wider">&copy; 2026 TeraNexus. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

// Helper Components

const FeatureCard = ({ icon, title, status, description, active }: any) => (
    <div className={`p-6 rounded-2xl border transition-all duration-300 ${active ? 'bg-[#1e293b]/40 border-white/10 hover:bg-[#1e293b]/60' : 'bg-transparent border-white/5 opacity-60'}`}>
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${active ? 'bg-[#2dd4bf]/10' : 'bg-white/5'}`}>
                    {icon}
                </div>
                <h4 className={`font-semibold ${active ? 'text-white' : 'text-gray-300'}`}>{title}</h4>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${active ? 'bg-[#2dd4bf]/20 text-[#2dd4bf]' : 'bg-white/5 text-gray-500'}`}>
                {status}
            </span>
        </div>
        <p className="text-sm text-gray-400 pl-[3.25rem] leading-relaxed">{description}</p>
    </div>
);

const PrivacyCard = ({ icon, title, description }: any) => (
    <div className="bg-[#1e293b]/20 p-8 rounded-3xl border border-white/5 hover:border-[#2dd4bf]/30 transition-all duration-300 group hover:bg-[#1e293b]/40">
        <div className="w-14 h-14 bg-[#0f172a] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform border border-white/5 group-hover:border-[#2dd4bf]/20">
            {icon}
        </div>
        <h3 className="text-lg font-bold mb-4 text-white group-hover:text-[#2dd4bf] transition-colors">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
            {description}
        </p>
    </div>
);

export default BetaLandingPage;
