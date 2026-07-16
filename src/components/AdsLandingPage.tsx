import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LegalModal from './Legal/LegalModal';
import {
    Check,
    X,
    Clock,
    Shield,
    Zap,
    Calendar,
    Gift,
    BrainCircuit,
    Smartphone,
    BadgeDollarSign,
    AlarmClock,
    FileText
} from 'lucide-react';

/**
 * Landing page dedicada para tráfego pago (Google Ads).
 * Diferenças em relação à BetaLandingPage:
 * - Sem menu de navegação, login ou seção de clientes (rotas de fuga reduzidas)
 * - Título alinhado ao texto do anúncio (message match)
 * - CTA único: cadastro no teste grátis, preservando query string (gclid/UTM)
 */
const AdsLandingPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading } = useAuth();
    const [legalModal, setLegalModal] = useState<null | 'terms' | 'privacy'>(null);

    useEffect(() => {
        document.title = 'TeraNexus — Sistema de Gestão para Terapeutas TRG';
        if (!loading && user) {
            navigate('/dashboard', { replace: true });
            return;
        }
        localStorage.setItem('teranexus_app_type', 'therapist');
    }, [user, loading, navigate]);

    const goToRegister = () => navigate(`/register${location.search}`);

    const ctaButton = (label: string = 'Começar Grátis — 30 dias', large: boolean = false) => (
        <button
            onClick={goToRegister}
            className={`bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 ${large ? 'px-10 py-5 text-xl' : 'px-8 py-4 text-lg'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 font-sans">

            {/* Header mínimo: só logo + CTA, sem rotas de fuga */}
            <nav className="fixed w-full z-50 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-900/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo-new.jpg" alt="TeraNexus Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-blue-500/10" />
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Tera<span className="text-blue-500">Nexus</span></span>
                            <span className="hidden sm:inline-block text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md uppercase tracking-wider">BETA</span>
                        </div>
                    </div>
                    <button
                        onClick={goToRegister}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-bold transition-all hover:scale-105 shadow-lg shadow-emerald-500/30">
                        <Gift size={14} /> Testar Grátis
                    </button>
                </div>
            </nav>

            {/* Hero — título alinhado ao anúncio */}
            <section className="pt-32 pb-24 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-8">
                        <Gift size={15} />
                        Experimente grátis por 30 dias — sem cartão de crédito
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                        O sistema de gestão feito <br /> <span className="text-blue-600 dark:text-blue-500">para Terapeutas TRG.</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
                        Agenda com autoagendamento, registro de sessões, lembretes automáticos e controle financeiro — tudo em um só lugar, no piloto automático.
                    </p>
                    <div className="flex flex-col items-center justify-center gap-4">
                        {ctaButton()}
                        <p className="text-slate-600 dark:text-slate-500 text-sm">Sem cartão de crédito · Cancele quando quiser</p>
                    </div>
                </div>
            </section>

            {/* Dores */}
            <section className="py-24 px-6 bg-slate-100 dark:bg-[#0a0a0f]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-block px-4 py-2 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-bold mb-6 border border-red-200 dark:border-red-800/50">A Realidade de Quem Está no Mercado</div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-5 leading-tight">
                            Você se reconhece <br /><span className="text-red-500 dark:text-red-400">nessas situações?</span>
                        </h2>
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
                                desc: 'Sem uma agenda automatizada, erros acontecem. Cancelar um cliente de última hora é péssimo para a reputação.'
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
                    </div>
                </div>
            </section>

            {/* Solução */}
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
                        {ctaButton('Quero meu sistema funcionando agora', true)}
                        <p className="text-slate-600 dark:text-slate-500 text-sm mt-4">Comece grátis por 30 dias. Sem burocracia.</p>
                    </div>
                </div>
            </section>

            {/* Comparação: Secretária vs TeraNexus */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Você realmente precisa de uma secretária?</h2>
                        <p className="text-slate-500">Vamos aos fatos e números.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
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

            {/* Planos (resumo) — todos os CTAs levam ao teste grátis */}
            <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Planos simples e transparentes</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-xl mx-auto">
                        <strong>Zero taxas por sessão.</strong> Você assina um plano único mensal e usa o sistema à vontade.
                    </p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold mb-14">
                        Todos começam com 30 dias grátis de acesso total — sem cartão de crédito.
                    </p>

                    <div className="grid md:grid-cols-3 gap-6 text-left">
                        <div className="p-8 rounded-3xl border-2 border-emerald-500 bg-white dark:bg-emerald-950/20 shadow-xl dark:shadow-emerald-500/10 flex flex-col">
                            <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">Teste Gratuito</h3>
                            <div className="mb-4">
                                <span className="text-4xl font-extrabold text-emerald-500 dark:text-emerald-400">R$ 0</span>
                                <span className="text-slate-500 text-sm ml-1">/30 dias</span>
                            </div>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 mb-6 flex-1">
                                <li className="flex gap-2 items-start"><Check size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Acesso total ao Profissional Beta</li>
                                <li className="flex gap-2 items-start"><Check size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Clientes ilimitados</li>
                                <li className="flex gap-2 items-start"><Check size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Sem cartão de crédito</li>
                            </ul>
                            <button
                                onClick={goToRegister}
                                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-lg transition-all hover:shadow-emerald-500/40 hover:scale-105 text-sm">
                                Experimentar Grátis →
                            </button>
                        </div>

                        <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-md flex flex-col">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Iniciante Beta</h3>
                            <div className="mb-4">
                                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">R$ 47</span>
                                <span className="text-slate-500 text-sm ml-1">/mês</span>
                            </div>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 mb-6 flex-1">
                                <li className="flex gap-2 items-start"><Check size={15} className="text-slate-400 shrink-0 mt-0.5" /> Até 10 clientes</li>
                                <li className="flex gap-2 items-start"><Check size={15} className="text-slate-400 shrink-0 mt-0.5" /> Agenda básica</li>
                                <li className="flex gap-2 items-start"><Check size={15} className="text-slate-400 shrink-0 mt-0.5" /> Registro de dados simples</li>
                            </ul>
                            <button
                                onClick={goToRegister}
                                className="w-full py-3 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold transition-all text-sm text-slate-800 dark:text-slate-200">
                                Começar pelo teste grátis
                            </button>
                        </div>

                        <div className="p-8 rounded-3xl border-2 border-blue-500 bg-white dark:bg-slate-800 shadow-xl dark:shadow-blue-500/10 relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">
                                Mais Escolhido
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Profissional Beta</h3>
                            <div className="mb-4">
                                <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">R$ 97</span>
                                <span className="text-slate-500 text-sm ml-1">/mês</span>
                            </div>
                            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200 mb-6 flex-1">
                                <li className="flex gap-2 items-start"><Check size={15} className="text-blue-500 shrink-0 mt-0.5" /> <strong>Clientes ilimitados</strong></li>
                                <li className="flex gap-2 items-start"><Check size={15} className="text-blue-500 shrink-0 mt-0.5" /> Módulo financeiro completo</li>
                                <li className="flex gap-2 items-start"><Check size={15} className="text-blue-500 shrink-0 mt-0.5" /> Landing page profissional exclusiva</li>
                            </ul>
                            <button
                                onClick={goToRegister}
                                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg transition-all hover:shadow-blue-500/40 text-sm">
                                Começar pelo teste grátis
                            </button>
                        </div>
                    </div>

                    <div className="max-w-3xl mx-auto mt-10 flex items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <Shield size={16} className="shrink-0 text-blue-500" />
                        <span>Plataforma segura, pronta para a LGPD. Seus clientes não pagam taxa alguma.</span>
                    </div>
                </div>
            </section>

            {/* CTA final */}
            <section className="py-24 px-6 text-center bg-gradient-to-b from-white to-emerald-50 dark:from-slate-950 dark:to-emerald-950/20">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
                        Devolva seu tempo <br /><span className="text-emerald-500">para o que importa: seus clientes.</span>
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-10">
                        Configure sua agenda em minutos e experimente todos os recursos por 30 dias, sem compromisso.
                    </p>
                    {ctaButton('Começar Grátis — 30 dias', true)}
                    <p className="text-slate-600 dark:text-slate-500 text-sm mt-5">Sem cartão de crédito · Cancele quando quiser</p>
                </div>
            </section>

            {/* Footer com links legais (exigência de aprovação do Google Ads) */}
            <footer className="py-12 text-center text-slate-500 text-sm border-t border-slate-200 dark:border-slate-800">
                <p>&copy; 2026 Tera Nexus. Feito com ❤️ para Terapeutas.</p>
                <div className="mt-4 flex items-center justify-center gap-6">
                    <button onClick={() => setLegalModal('terms')} className="hover:text-slate-800 dark:hover:text-slate-300 underline underline-offset-4 transition-colors">Termos de Uso</button>
                    <button onClick={() => setLegalModal('privacy')} className="hover:text-slate-800 dark:hover:text-slate-300 underline underline-offset-4 transition-colors">Política de Privacidade</button>
                </div>
            </footer>

            <LegalModal
                isOpen={legalModal !== null}
                onClose={() => setLegalModal(null)}
                type={legalModal ?? 'terms'}
            />
        </div>
    );
};

export default AdsLandingPage;
