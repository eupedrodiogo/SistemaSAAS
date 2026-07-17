import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
    Star,
    Gift,
    BrainCircuit,
    HeartHandshake,
    Smartphone,
    BadgeDollarSign,
    AlarmClock,
    FileText
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_live_51MPKq2Lz0qOQeXyX0B9gZ5q5q5q5q5q5');

const BetaLandingPage: React.FC<any> = ({ onLoginClick, isDarkMode, toggleTheme }) => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    useEffect(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
        const appType = localStorage.getItem('teranexus_app_type');

        if (isStandalone && appType === 'patient') {
            navigate('/cliente', { replace: true });
            return;
        }

        if (!loading && user) {
            navigate('/dashboard', { replace: true });
            return;
        }
        
        localStorage.setItem('teranexus_app_type', 'therapist');
    }, [user, loading, navigate]);

    const handleCheckout = async (priceId: string) => {
        // Basic checkout redirection logic (simplified for restoration)
        try {
            const response = await fetch('/api/payments?action=checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId,
                    mode: 'subscription', // Planos Iniciante/Profissional são mensais recorrentes
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
            <nav className="fixed w-full z-50 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-900/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo-new.jpg" alt="TeraNexus Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-blue-500/10" />
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Tera<span className="text-blue-500">Nexus</span></span>
                            <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md uppercase tracking-wider">BETA</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/register')}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-bold transition-all hover:scale-105 shadow-lg shadow-emerald-500/30">
                            <Gift size={14} /> Testar Grátis
                        </button>
                        <button onClick={() => navigate('/login')} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Entrar</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-24 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-8">
                        <Gift size={15} />
                        Experimente grátis por 30 dias — sem cartão de crédito
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                        Pare de ser secretário(a) <br /> <span className="text-blue-600 dark:text-blue-500">da sua própria carreira.</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
                        O primeiro sistema de gestão focado em devolver o tempo do Terapeuta TRG. Agendamento, Pagamento e Registro de dados no piloto automático.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/register')}
                            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-lg shadow-xl shadow-emerald-500/30 transition-all hover:scale-105"
                        >
                            Começar Grátis — 30 dias
                        </button>
                        <button
                            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 border border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl font-semibold text-lg transition-all hover:scale-105"
                        >
                            Ver todos os planos
                        </button>
                    </div>
                    <p className="text-slate-600 dark:text-slate-500 text-sm mt-5">Sem cartão de crédito · Cancele quando quiser</p>

                    {/* Client Ecosystem Banner */}
                    <div className="mt-16 max-w-2xl mx-auto text-left">
                        {/* Client Side */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900/40 border border-blue-200 dark:border-blue-800/50 backdrop-blur-md relative overflow-hidden shadow-lg shadow-blue-900/5 group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
                                <HeartHandshake size={80} />
                            </div>
                            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                                <div className="flex-1">
                                    <span className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full mb-4">
                                        PARA CLIENTES
                                    </span>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Busca por Ajuda?</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 sm:mb-0 leading-relaxed">
                                        Você que busca um terapeuta para resolver suas dores emocionais pode acessar nossa área dedicada a clientes e agendar sua sessão agora mesmo.
                                    </p>
                                </div>
                                <div className="shrink-0">
                                    <button
                                        onClick={() => navigate('/cliente')}
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all hover:scale-105 inline-flex items-center gap-2 whitespace-nowrap"
                                    >
                                        Ir para a Área do Cliente
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Storytelling: A Origem */}
            <section className="py-20 px-6 bg-slate-50 dark:bg-[#020617]">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1">
                        <div className="inline-block px-4 py-2 rounded-2xl bg-amber-100 dark:bg-[#3b2a20] text-amber-700 dark:text-[#d4996a] text-sm font-bold mb-6">A Origem</div>
                        <h2 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white">"E para a minha área?"</h2>
                        <div className="space-y-6 text-slate-700 dark:text-slate-300 italic border-l-4 border-blue-600 pl-8 py-2">
                            <p className="text-lg leading-relaxed">
                                "Sou o Pedro Diogo, Engenheiro de Produto. Tudo começou quando minha esposa — futura Terapeuta TRG — me viu criando um sistema genérico e perguntou: <strong className="text-slate-900 dark:text-white">'Por que não algo específico para nós?'</strong>"
                            </p>
                            <p className="text-lg leading-relaxed">
                                "Aceitei o desafio. Estudei a rotina, o TRG Club, e vi que faltava o elo perdido: <strong className="text-slate-900 dark:text-white">a Gestão do dia a dia.</strong> O Tera Nexus nasce para ser esse braço direito."
                            </p>
                        </div>
                    </div>
                    <div className="w-full md:w-1/3 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 rotate-3 hover:rotate-0 transition-all duration-500">
                        <img
                            src="/origem-photo-final.jpg"
                            alt="Foto dos Bastidores: A Origem"
                            className="w-full h-auto object-cover"
                        />
                    </div>
                </div>
            </section>

            {/* === SEÇÃO DE DORES === */}
            <section className="py-24 px-6 bg-slate-100 dark:bg-[#0a0a0f]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-block px-4 py-2 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-bold mb-6 border border-red-200 dark:border-red-800/50">A Realidade de Quem Está no Mercado</div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-5 leading-tight">
                            Você se reconhece <br /><span className="text-red-500 dark:text-red-400">nessas situações?</span>
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                            Antes de criar o TeraNexus, minha esposa me descreveu o dia a dia real de uma Terapeuta TRG recém-formada:
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <AlarmClock size={28} />,
                                title: '"Meu domingo vai embora respondendo mensagem"',
                                desc: 'Confirmações de horário, remarcações, dúvidas sobre pagamento. Tudo no seu WhatsApp pessoal, invadindo seu descanso.'
                            },
                            {
                                icon: <BadgeDollarSign size={28} />,
                                title: '"Cliente "esquece" de pagar e eu me desgasto cobrando"',
                                desc: 'A cobrança manual gera desconforto e, muitas vezes, prejuízo. É difícil ser terapeuta e cobrador ao mesmo tempo.'
                            },
                            {
                                icon: <FileText size={28} />,
                                title: '"Meus registros de dados são cadernos espalhados"',
                                desc: 'Anotar a evolução de cada cliente em papel é lento, inseguro e impossível de acessar de qualquer lugar.'
                            },
                            {
                                icon: <Calendar size={28} />,
                                title: '"Já tive duplo-agendamento duas vezes esse mês"',
                                desc: 'Sem uma agenda automatizada, erros acontecem. Cancelar um cliente de última hora é péssimo para a reputação. Além disso, gera transtornos e atrapalha o progresso do cliente.'
                            },
                            {
                                icon: <Smartphone size={28} />,
                                title: '"Uso 5 apps diferentes e perco tempo integrando tudo"',
                                desc: 'Google Agenda, planilha de finanças, WhatsApp para cobrar, Notion para anotações... A gestão consome mais energia do que a terapia.'
                            },
                            {
                                icon: <BrainCircuit size={28} />,
                                title: '"Sinto que poderia atender mais, mas não consigo organizar"',
                                desc: 'O limite não é a sua capacidade como terapeuta. É o caos operacional que impede sua agenda de crescer de forma saudável.'
                            },
                        ].map((pain, i) => (
                            <div key={i} className="p-6 rounded-2xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-red-950/20 hover:border-red-300 dark:hover:border-red-700/60 shadow-sm dark:shadow-none transition-all duration-300 group">
                                <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/40 flex items-center justify-center text-red-500 dark:text-red-400 mb-5 group-hover:bg-red-100 dark:group-hover:bg-red-900/60 transition-all">
                                    {pain.icon}
                                </div>
                                <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-base leading-snug italic">{pain.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{pain.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-14 text-center">
                        <p className="text-slate-700 dark:text-slate-300 text-lg font-medium">
                            Se você marcou mentalmente algum desses pontos... <br />
                            <span className="text-slate-900 dark:text-white font-bold">o TeraNexus foi criado exatamente para você.</span>
                        </p>
                        <div className="mt-2 text-3xl">👇</div>
                    </div>
                </div>
            </section>

            {/* === SEÇÃO DE SOLUÇÃO === */}
            <section className="py-24 px-6 bg-gradient-to-b from-white to-blue-50 dark:from-[#020617] dark:to-[#0c1a33]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-block px-4 py-2 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-bold mb-6 border border-blue-200 dark:border-blue-800/50">A Solução Completa</div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-5 leading-tight">
                            Tudo que você precisa. <br /><span className="text-blue-600 dark:text-blue-400">Em um só lugar.</span>
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                            O TeraNexus substitui a pilha de apps e te devolve o mais precioso: o seu tempo.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            {
                                icon: <Calendar size={24} className="text-blue-600 dark:text-blue-400" />,
                                badge: 'Agenda Inteligente',
                                title: 'Clientes agendam sozinhos, 24h por dia',
                                desc: 'Seu link de agendamento personalizado funciona enquanto você atende, dorme ou descansa. Sem trocas de mensagem, sem conflitos de horário.'
                            },
                            {
                                icon: <BadgeDollarSign size={24} className="text-blue-600 dark:text-blue-400" />,
                                badge: 'Cobrança Automática',
                                title: 'Receba em dia, sem constrangimento',
                                desc: 'Cobranças configuradas uma vez e enviadas automaticamente. Evite a inadimplência e receba em dia, sem desgastar a relação ou perder o cliente.'
                            },
                            {
                                icon: <FileText size={24} className="text-blue-600 dark:text-blue-400" />,
                                badge: 'Registro de Dados Digital',
                                title: 'Evolução de cada cliente na palma da mão',
                                desc: 'Registre sessões, protocolos e observações de qualquer dispositivo. Seguro, organizado e sempre disponível.'
                            },
                            {
                                icon: <Clock size={24} className="text-blue-600 dark:text-blue-400" />,
                                badge: 'Histórico de Sessões',
                                title: 'A linha do tempo do cliente organizada',
                                desc: 'Consulte atendimentos passados em segundos. Tenha um histórico de sessões estruturado e acessível para guiar sua próxima evolução técnica.'
                            },
                        ].map((sol, i) => (
                            <div key={i} className="flex gap-5 p-6 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-white dark:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-600/50 shadow-md dark:shadow-none transition-all duration-300 group">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 transition-all">
                                    {sol.icon}
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider">{sol.badge}</span>
                                    <h3 className="font-bold text-slate-800 dark:text-white text-lg mt-1 mb-2">{sol.title}</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{sol.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-14 text-center">
                        <button
                            onClick={() => navigate('/register')}
                            className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xl shadow-2xl shadow-blue-500/30 transition-all hover:scale-105">
                            <HeartHandshake size={22} />
                            Quero meu sistema funcionando agora
                        </button>
                        <p className="text-slate-600 dark:text-slate-500 text-sm mt-4">Comece grátis por 30 dias. Sem burocracia.</p>
                    </div>
                </div>
            </section>


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
            <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white relative overflow-hidden">
                {/* Abstract BG */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-20"></div>

                <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Escolha o seu plano</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-12 max-w-xl mx-auto">
                        Pague apenas pelos módulos que usar. Comece grátis por 30 dias com acesso total — sem cartão de crédito.
                    </p>

                    {/* Pricing Clarification Alert */}
                    <div className="max-w-4xl mx-auto mb-14 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 text-left relative overflow-hidden shadow-sm dark:shadow-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent skew-x-12 translate-x-full group-hover:animate-shimmer" />
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                            <Shield size={32} />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Transparência total: Zero taxas por sessão</h4>
                            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No TeraNexus, <strong>nós NÃO cobramos por sessão</strong>. Seus clientes não pagam taxa alguma para a plataforma — pagam apenas pela consulta diretamente a você. O terapeuta assina um plano único mensal e usa o sistema à vontade. Simples, justo e transparente.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 text-left">

                        {/* ── Teste Gratuito ─────────────────────────────── */}
                        <div className="relative mt-3 rounded-3xl border-2 border-emerald-500 bg-white dark:bg-emerald-950/20 shadow-xl dark:shadow-emerald-500/10">
                            {/* top badge */}
                            <div className="absolute top-0 left-0 right-0 flex justify-center -translate-y-1/2 z-10 pointer-events-none">
                                <span className="bg-emerald-500 text-white text-xs font-bold px-5 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                                    <Gift size={12} /> Comece Aqui — Grátis
                                </span>
                            </div>
                            <div className="flex flex-col md:flex-row rounded-3xl overflow-hidden">
                                {/* Left: price panel */}
                                <div className="md:w-64 shrink-0 bg-emerald-50 dark:bg-emerald-900/30 p-8 flex flex-col justify-center items-start gap-3 border-b md:border-b-0 md:border-r border-emerald-200 dark:border-emerald-800/50">
                                    <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-4 md:mt-0">Teste Gratuito</h3>
                                    <div className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-semibold px-3 py-1 rounded-full">
                                        ✦ Igual ao Profissional Beta
                                    </div>
                                    <div>
                                        <span className="text-5xl font-extrabold text-emerald-500 dark:text-emerald-400">R$ 0</span>
                                        <span className="text-slate-500 dark:text-slate-400 text-sm ml-1">/30 dias</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Sem cartão de crédito • Sem limitações</p>
                                    <button
                                        onClick={() => navigate('/register')}
                                        className="mt-2 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-lg transition-all hover:shadow-emerald-500/40 hover:scale-105 text-sm">
                                        Experimentar Grátis →
                                    </button>
                                    <p className="text-xs text-slate-400 text-center w-full">Sem compromisso — continue só se quiser.</p>
                                </div>
                                {/* Right: features */}
                                <div className="flex-1 p-8">
                                    <div className="mb-5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-sm text-blue-700 dark:text-blue-300">
                                        🚀 Você experimenta <strong>tudo</strong> do Profissional Beta por 30 dias: clientes ilimitados, agenda completa, módulo financeiro, sessões com escala de desconforto, landing page e muito mais.
                                    </div>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-emerald-500 shrink-0 mt-0.5" /> <strong className="text-slate-800 dark:text-white">Acesso total</strong> — igual ao Profissional Beta</li>
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Nada é cobrado automaticamente</li>
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Lembrete por e-mail antes de acabar</li>
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Ao fim dos 30 dias, você escolhe se continua</li>
                                    </ul>
                                    <div className="mt-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-700 dark:text-emerald-300">
                                        Enviaremos um lembrete por e-mail quando o período estiver acabando. Nada é cobrado sem você escolher um plano — sem cartão, sem cobrança automática.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Iniciante Beta ─────────────────────────────── */}
                        <div className="relative rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-md overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                                {/* Left: price panel */}
                                <div className="md:w-64 shrink-0 bg-slate-50 dark:bg-slate-800 p-8 flex flex-col justify-center items-start gap-3 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700">
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Iniciante Beta</h3>
                                    <div>
                                        <span className="text-5xl font-extrabold text-slate-900 dark:text-white">R$ 47</span>
                                        <span className="text-slate-500 text-sm ml-1">/mês</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Ideal para quem está começando</p>
                                    <button
                                        onClick={() => handleCheckout('price_1ScuH5KPo7EypB7VnIs6qfbQ')}
                                        className="mt-2 w-full py-3 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold transition-all text-sm text-slate-800 dark:text-slate-200">
                                        Garantir Vaga
                                    </button>
                                </div>
                                {/* Right: features */}
                                <div className="flex-1 p-8">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">O que está incluído</p>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-slate-400 shrink-0 mt-0.5" /> Até 10 Clientes</li>
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-slate-400 shrink-0 mt-0.5" /> Agenda Básica</li>
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-slate-400 shrink-0 mt-0.5" /> Registro de Dados Simples</li>
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-slate-400 shrink-0 mt-0.5" /> Suporte via chat e e-mail após às 18h</li>
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-slate-400 shrink-0 mt-0.5" /> Lista de espera</li>
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-slate-400 shrink-0 mt-0.5" /> Rede de transbordo</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* ── Profissional Beta ──────────────────────────── */}
                        <div className="relative rounded-3xl border-2 border-blue-500 bg-white dark:bg-slate-800 shadow-xl dark:shadow-blue-500/10 overflow-hidden">
                            {/* "Mais Escolhido" badge */}
                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">
                                Mais Escolhido
                            </div>
                            <div className="flex flex-col md:flex-row">
                                {/* Left: price panel */}
                                <div className="md:w-64 shrink-0 bg-blue-50 dark:bg-blue-900/20 p-8 flex flex-col justify-center items-start gap-3 border-b md:border-b-0 md:border-r border-blue-200 dark:border-blue-800/50">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Profissional Beta</h3>
                                    <div>
                                        <span className="text-5xl font-extrabold text-blue-600 dark:text-blue-400">R$ 97</span>
                                        <span className="text-slate-500 text-sm ml-1">/mês</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Tudo do Iniciante, mais recursos avançados</p>
                                    <button
                                        onClick={() => handleCheckout('price_1Sd8DXKPo7EypB7VZwytTUEP')}
                                        className="mt-2 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg transition-all hover:shadow-blue-500/40 text-sm">
                                        Assinar Profissional
                                    </button>
                                    <p className="text-xs text-slate-400 text-center w-full">Oferta limitada aos primeiros 50 inscritos.</p>
                                </div>
                                {/* Right: features */}
                                <div className="flex-1 p-8">
                                    <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-4">Tudo do Iniciante +</p>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-slate-700 dark:text-slate-200">
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-blue-500 shrink-0 mt-0.5" /> <strong>Clientes Ilimitados</strong></li>
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-blue-500 shrink-0 mt-0.5" /> Atendimento via WhatsApp das 9h às 22h</li>
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-blue-500 shrink-0 mt-0.5" /> Módulo Sessão com notas e escala de desconforto</li>
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-blue-500 shrink-0 mt-0.5" /> Agenda Completa</li>
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-blue-500 shrink-0 mt-0.5" /> Módulo Financeiro</li>
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-blue-500 shrink-0 mt-0.5" /> Rede de transbordo</li>
                                        <li className="flex gap-2 items-start"><Check size={15} className="text-blue-500 shrink-0 mt-0.5" /> Landing page profissional exclusiva</li>
                                    </ul>
                                </div>
                            </div>
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
