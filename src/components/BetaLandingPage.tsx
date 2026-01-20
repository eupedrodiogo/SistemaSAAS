import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Check,
    X,
    Clock,
    Shield,
    Zap,
    MessageCircle,
    Calendar,
    ChevronDown,
    ArrowRight,
    Star
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_live_51MPKq2Lz0qOQeXyX0B9gZ5q5q5q5q5q5');

const BetaLandingPage: React.FC<any> = ({ onLoginClick, isDarkMode, toggleTheme }) => {
    const navigate = useNavigate();

    const handleCheckout = async (priceId: string) => {
        // Basic checkout redirection logic (simplified for restoration)
        try {
            const response = await fetch('/api/payments?action=checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId,
                    mode: 'payment',
                    successUrl: window.location.origin + '/success',
                    cancelUrl: window.location.origin + '/'
                })
            });
            const data = await response.json();
            if (data.url) window.location.href = data.url;
            else navigate('/register'); // Fallback
        } catch (e) {
            console.error("Checkout error", e);
            navigate('/register');
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 font-sans">

            {/* Header */}
            <nav className="fixed w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo-new.jpg" alt="TeraNexus Logo" className="w-8 h-8 rounded-lg object-cover" />
                        <span className="text-xl font-bold">Tera<span className="text-blue-600 dark:text-blue-400">Nexus</span></span>
                        <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">BETA</span>
                    </div>
                    <button onClick={() => navigate('/login')} className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">Entrar</button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                        Pare de ser secretário(a) <br /> <span className="text-blue-600 dark:text-blue-500">da sua própria carreira.</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
                        O primeiro sistema de gestão focado em devolver o tempo do Terapeuta TRG. Agendamento, Pagamento e Prontuário no piloto automático.
                    </p>
                    <button
                        onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/30 transition-all hover:scale-105"
                    >
                        Quero meu Assistente 24h
                    </button>
                </div>
            </section>

            {/* Storytelling: A Origem */}
            <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1">
                        <div className="inline-block px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm font-bold mb-4">A Origem</div>
                        <h2 className="text-3xl font-bold mb-6">"E para a minha área?"</h2>
                        <div className="space-y-4 text-slate-600 dark:text-slate-300 italic border-l-4 border-blue-500 pl-6">
                            <p>
                                "Sou o Pedro Diogo, desenvolvedor. Tudo começou quando minha esposa — futura Terapeuta TRG — me viu criando um sistema genérico e perguntou: <strong>'Por que não algo específico para nós?'</strong>"
                            </p>
                            <p>
                                "Aceitei o desafio. Estudei a rotina, o TRG Club, e vi que faltava o elo perdido: <strong>a Gestão do dia a dia.</strong> O Tera Nexus nasce para ser esse braço direito."
                            </p>
                        </div>
                    </div>
                    <div className="w-full md:w-1/3 aspect-square bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500">
                        {/* Placeholder for "couple/working" photo */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
                        <p className="text-center p-4 text-xs text-slate-400 uppercase tracking-widest font-bold z-10">Foto dos Bastidores</p>
                    </div>
                </div>
            </section>

            {/* Comparison: O Mito da Secretária */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Você realmente precisa de uma secretária?</h2>
                        <p className="text-slate-500">Vamos aos fatos e números.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Secretária Humana */}
                        <div className="p-8 rounded-3xl border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl text-red-600 dark:text-red-400">
                                    <Clock size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-red-700 dark:text-red-400">Secretária Humana</h3>
                            </div>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3 text-red-800 dark:text-red-300">
                                    <X className="shrink-0 mt-1" size={18} />
                                    <span><strong>Custo Alto:</strong> Salário + Encargos (~R$ 2.500/mês)</span>
                                </li>
                                <li className="flex items-start gap-3 text-red-800 dark:text-red-300">
                                    <X className="shrink-0 mt-1" size={18} />
                                    <span><strong>Horário Limitado:</strong> Só atende horário comercial.</span>
                                </li>
                                <li className="flex items-start gap-3 text-red-800 dark:text-red-300">
                                    <X className="shrink-0 mt-1" size={18} />
                                    <span><strong>Erros Humanos:</strong> Esquecimentos e falhas na agenda.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Tera Nexus */}
                        <div className="p-8 rounded-3xl border border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">RECOMENDADO</div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl text-green-600 dark:text-green-400">
                                    <Zap size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-green-700 dark:text-green-400">Tera Nexus</h3>
                            </div>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3 text-green-800 dark:text-green-300">
                                    <Check className="shrink-0 mt-1" size={18} />
                                    <span><strong>Custo Acessível:</strong> Menos que uma pizza/mês.</span>
                                </li>
                                <li className="flex items-start gap-3 text-green-800 dark:text-green-300">
                                    <Check className="shrink-0 mt-1" size={18} />
                                    <span><strong>24h/7d:</strong> Agenda e cobra enquanto você dorme.</span>
                                </li>
                                <li className="flex items-start gap-3 text-green-800 dark:text-green-300">
                                    <Check className="shrink-0 mt-1" size={18} />
                                    <span><strong>Zero Erros:</strong> Automação precisa e links automáticos.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-slate-900 text-white relative overflow-hidden">
                {/* Abstract BG */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Oferta Vitalícia Beta</h2>
                    <p className="text-slate-400 mb-12 max-w-xl mx-auto">
                        Ajude a validar o sistema e garanta acesso vitalício por um valor único. Sem mensalidades para sempre (apenas para este lote).
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* Iniciante */}
                        <div className="p-8 rounded-3xl border border-slate-700 hover:border-slate-500 transition-colors bg-slate-800/50">
                            <h3 className="text-xl font-bold text-slate-300">Iniciante Beta</h3>
                            <div className="my-6">
                                <span className="text-4xl font-extrabold">R$ 47</span>
                                <span className="text-slate-500 text-sm">/único</span>
                            </div>
                            <ul className="space-y-3 mb-8 text-left text-sm text-slate-300">
                                <li className="flex gap-2"><Check size={16} /> Até 10 Clientes</li>
                                <li className="flex gap-2"><Check size={16} /> Agenda Básica</li>
                                <li className="flex gap-2"><Check size={16} /> Prontuário Simples</li>
                            </ul>
                            <button
                                onClick={() => handleCheckout('price_1ScuH5KPo7EypB7VnIs6qfbQ')}
                                className="w-full py-3 rounded-xl border border-slate-600 hover:bg-slate-700 font-semibold transition-all">
                                Garantir Vaga
                            </button>
                        </div>

                        {/* Profissional */}
                        <div className="p-8 rounded-3xl border-2 border-blue-500 bg-slate-800 relative shadow-2xl shadow-blue-500/20 transform md:scale-105">
                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Mais Escolhido</div>
                            <h3 className="text-xl font-bold text-white">Profissional Beta</h3>
                            <div className="my-6">
                                <span className="text-5xl font-extrabold text-blue-400">R$ 97</span>
                                <span className="text-slate-500 text-sm">/único</span>
                            </div>
                            <ul className="space-y-3 mb-8 text-left text-sm text-slate-200">
                                <li className="flex gap-2"><Check size={16} className="text-blue-400" /> <strong>Clientes Ilimitados</strong></li>
                                <li className="flex gap-2"><Check size={16} className="text-blue-400" /> Protocolos Exclusivos</li>
                                <li className="flex gap-2"><Check size={16} className="text-blue-400" /> Relatórios com IA</li>
                                <li className="flex gap-2"><Check size={16} className="text-blue-400" /> Acesso Vitalício</li>
                            </ul>
                            <button
                                onClick={() => handleCheckout('price_1Sd8DXKPo7EypB7VZwytTUEP')}
                                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg transition-all hover:shadow-blue-500/50">
                                Quero Acesso Vitalício
                            </button>
                            <p className="text-xs text-slate-500 mt-4">Oferta limitada aos primeiros 50 inscritos.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 text-center text-slate-500 text-sm border-t border-slate-200 dark:border-slate-800">
                <p>&copy; 2026 Tera Nexus. Feito com ❤️ para Terapeutas.</p>
            </footer>

        </div>
    );
};

export default BetaLandingPage;
