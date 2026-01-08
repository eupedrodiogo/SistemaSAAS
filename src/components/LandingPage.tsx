import React from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  Users,
  BarChart3,
  Calendar,
  Lock,
  Star,
  ChevronDown,
  PlayCircle,
  Sun,
  Moon,
  FileText
} from 'lucide-react';
import LegalModal from './Legal/LegalModal';

interface LandingPageProps {
  onLoginClick: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, isDarkMode, toggleTheme }) => {
  const [legalModal, setLegalModal] = React.useState<{ isOpen: boolean; type: 'terms' | 'privacy' }>({
    isOpen: false,
    type: 'terms'
  });

  const openLegal = (type: 'terms' | 'privacy') => {
    setLegalModal({ isOpen: true, type });
  };
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCheckout = async (priceId: string, mode: 'payment' | 'subscription', couponId?: string) => {
    try {
      if (priceId.includes('WAITING_FOR_USER')) {
        alert('Configuração pendente: STRIPE_SECRET_KEY ausente ou produtos não criados.');
        return;
      }

      let btnId = 'btn-subscribe-pro';
      if (priceId === 'price_1ScuH5KPo7EypB7VQ7epTjiW') btnId = 'btn-subscribe-estagio';
      else if (priceId === 'price_1ScuH5KPo7EypB7VnIs6qfbQ') btnId = 'btn-subscribe-starter';
      else if (priceId === 'price_1ScuH5KPo7EypB7VZwytTUEP') btnId = 'btn-subscribe-pro';

      const btn = document.getElementById(btnId);
      if (btn) {
        btn.innerText = 'Redirecionando...';
        btn.setAttribute('disabled', 'true');
      }

      const response = await fetch('/api/payments?action=checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          mode,
          couponId,
          successUrl: window.location.origin + '/success?price_id=' + priceId,
          cancelUrl: window.location.origin + '/'
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: 'Erro desconhecido no servidor' }));
        throw new Error(errData.message || `Erro ${response.status}: Falha no checkout`);
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (e: any) {
      console.error('Checkout Error:', e);
      alert(`Erro: ${e.message || 'Erro de conexão.'}`);
      // Reset button state (simplified)
      const btns = document.querySelectorAll('button');
      btns.forEach(b => {
        if (b.innerText === 'Redirecionando...') {
          // Restore original text based on ID or simplistic check
          if (b.id === 'btn-subscribe-estagio') b.innerText = 'Começar';
          else if (b.id === 'btn-subscribe-starter') b.innerText = 'Começar Agora';
          else if (b.id === 'btn-subscribe-pro') b.innerText = 'Assinar Agora';
          else b.innerText = 'Assinar';

          b.removeAttribute('disabled');
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-primary-500 selection:text-white overflow-x-hidden">

      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <BrainCircuit size={24} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              Tera<span className="text-primary-400">Nexus</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-sm font-semibold text-slate-100 hover:text-white hover:underline underline-offset-4 transition-all">Funcionalidades</button>
            <button onClick={() => scrollToSection('benefits')} className="text-sm font-semibold text-slate-100 hover:text-white hover:underline underline-offset-4 transition-all">Benefícios</button>
            <button onClick={() => scrollToSection('pricing')} className="text-sm font-semibold text-slate-100 hover:text-white hover:underline underline-offset-4 transition-all">Planos</button>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              aria-label="Alternar tema"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="text-sm font-bold text-white hover:text-primary-400 transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={() => window.location.href = '/register?plan=trial'}
              className="hidden sm:flex bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all active:scale-95 hover:shadow-primary-500/50"
            >
              Começar Agora
            </button>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-36 pb-20 lg:pt-52 lg:pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full z-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-600 mb-8 animate-fade-in shadow-lg backdrop-blur-sm">
            <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></span>
            <span className="text-xs font-extrabold text-white uppercase tracking-widest">Disponível para Terapeutas TRG</span>
          </div>

          {/* Main Headline: Removed gradient clip-text for maximum visibility */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-8 max-w-5xl mx-auto drop-shadow-xl">
            A Revolução na Gestão para <br />
            <span className="text-primary-400">Terapeutas de Resultado</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-100 max-w-3xl mx-auto mb-12 leading-relaxed font-medium drop-shadow-md">
            Abandone as planilhas. O <span className="text-white font-bold">TeraNexus</span> é a primeira plataforma all-in-one desenhada especificamente para o protocolo de Reprocessamento Generativo. Segurança, organização e performance clínica.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button
              onClick={() => window.location.href = '/register?plan=trial'}
              className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary-500/40 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 ring-2 ring-primary-400/50"
            >
              Quero Testar Gratuitamente <ArrowRight size={20} />
            </button>
            <button
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-4 bg-slate-800/80 hover:bg-slate-700 text-white rounded-2xl font-bold text-lg border border-slate-600 transition-all flex items-center justify-center gap-2 group backdrop-blur-sm hover:border-slate-500"
            >
              <PlayCircle size={20} className="text-primary-400 group-hover:scale-110 transition-transform" />
              Ver Demonstração
            </button>
          </div>

          {/* Dashboard Preview */}
          <div id="demo" className="mt-24 relative max-w-5xl mx-auto group animate-slide-up delay-200">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-secondary-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl shadow-black/50 overflow-hidden ring-1 ring-white/10">
              <img
                src="https://placehold.co/1200x700/1e293b/cbd5e1?text=Dashboard+TRG+Nexus+Preview"
                alt="Plataforma TeraNexus - Visão Geral"
                className="rounded-xl w-full opacity-100 transform transition-transform duration-700 group-hover:scale-[1.01]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-24 bg-slate-900/80 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg">Tudo o que você precisa em um só lugar</h2>
            <p className="text-lg text-slate-200 max-w-2xl mx-auto font-medium">O TeraNexus foi criado por terapeutas para terapeutas, cobrindo cada etapa do seu fluxo de trabalho com precisão.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: BrainCircuit, title: "Protocolo Guiado", desc: "Navegue pelas fases (Cronológico, Somático, Temático) com scripts integrados e registro de ciclos." },
              { icon: BarChart3, title: "Métricas Clínicas", desc: "Visualize a evolução do seu cliente com gráficos de redução do SUD (Unidades Subjetivas de Desconforto)." },
              { icon: Shield, title: "Segurança Total", desc: "Prontuários criptografados e acesso seguro. Seus dados e de seus clientes estão protegidos." },
              { icon: Zap, title: "Gestão Financeira", desc: "Controle pagamentos, emita recibos profissionais e reduza a inadimplência com lembretes automáticos." },
              { icon: Calendar, title: "Agenda Inteligente", desc: "Sistema de agendamento com confirmação automática via WhatsApp e bloqueio de horários." },
              { icon: Users, title: "Portal do Cliente", desc: "Envie anamneses digitais para serem preenchidas antes da sessão, otimizando seu tempo." },
            ].map((feature, idx) => (
              <div key={idx} className="bg-slate-800/60 border border-slate-700 p-8 rounded-3xl hover:bg-slate-800 hover:border-primary-500/50 transition-all group shadow-lg hover:shadow-2xl hover:shadow-primary-500/10">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-600 group-hover:border-primary-500 text-white shadow-md">
                  <feature.icon size={28} className="text-primary-400 group-hover:text-primary-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-300 transition-colors">{feature.title}</h3>
                <p className="text-slate-200 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- BENEFITS / SOCIAL PROOF --- */}
      <section id="benefits" className="py-24 overflow-hidden bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight drop-shadow-md">
                Foque no que importa: <br />
                <span className="text-primary-400">O resultado do seu cliente.</span>
              </h2>
              <div className="space-y-6">
                {[
                  "Elimine a papelada e anotações dispersas.",
                  "Tenha acesso ao histórico completo em segundos.",
                  "Profissionalize sua entrega com relatórios visuais.",
                  "Aumente sua taxa de retenção e indicação."
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-2 rounded-lg hover:bg-slate-900/50 transition-colors">
                    <div className="mt-1 bg-green-500/20 p-1.5 rounded-full border border-green-500/50">
                      <CheckCircle2 size={20} className="text-green-400" />
                    </div>
                    <p className="text-xl text-slate-100 font-medium">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-10 border-t border-slate-800 grid grid-cols-3 gap-8">
                <div>
                  <p className="text-4xl font-bold text-white">1.5k+</p>
                  <p className="text-sm text-slate-400 uppercase tracking-wider mt-2 font-semibold">Terapeutas</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-white">120k+</p>
                  <p className="text-sm text-slate-400 uppercase tracking-wider mt-2 font-semibold">Sessões</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-white">4.9</p>
                  <div className="flex text-yellow-400 mt-2 gap-1"><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /></div>
                  <p className="text-sm text-slate-400 uppercase tracking-wider mt-1 font-semibold">Avaliação</p>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="absolute -inset-4 bg-primary-500/30 rounded-full blur-3xl"></div>
              <div className="relative bg-slate-900 border border-slate-700 rounded-3xl p-10 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-slate-700 rounded-full overflow-hidden ring-2 ring-primary-500">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">Dra. Juliana M.</p>
                    <p className="text-sm text-primary-400 font-bold uppercase tracking-wide">Terapeuta Ouro</p>
                  </div>
                </div>
                <p className="text-slate-100 text-xl italic mb-8 leading-relaxed font-medium">
                  "O TeraNexus mudou minha vida. Antes eu perdia horas organizando fichas. Hoje, com um clique, tenho tudo pronto e ainda consigo mostrar graficamente a evolução para meus clientes. Indispensável!"
                </p>
                <div className="flex items-center gap-2 text-sm font-bold text-green-400 bg-green-950/30 px-4 py-2 rounded-full w-fit border border-green-900">
                  <Lock size={16} /> Depoimento Verificado
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="py-24 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-md">Investimento que se paga</h2>
            <p className="text-lg text-slate-200 font-medium">Escolha o plano ideal para o seu momento profissional.</p>

            <div className="mt-8 mb-12">
              <button
                onClick={() => window.location.href = '/register?plan=trial'}
                className="px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl font-bold text-xl shadow-2xl shadow-primary-500/30 hover:scale-105 transition-transform flex items-center gap-3 mx-auto ring-4 ring-primary-500/20"
              >
                <Zap size={24} className="fill-yellow-300 text-yellow-300" />
                Experimente Grátis por 7 Dias
                <ArrowRight size={24} />
              </button>
              <p className="text-slate-400 text-sm mt-3 font-medium">Sem compromisso. Não precisa de cartão de crédito.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Estágio */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col hover:border-slate-600 transition-colors">
              <h3 className="text-xl font-bold text-slate-200 mb-2">Estágio</h3>
              <p className="text-slate-400 text-xs mb-6 font-medium">Para estudantes (Ambiente de Teste).</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">R$ 0,50</span>
                <span className="text-slate-500 text-sm font-medium">/único</span>
              </div>
              <button
                onClick={() => handleCheckout('price_1ScuH5KPo7EypB7VQ7epTjiW', 'payment')}
                id="btn-subscribe-estagio"
                className="w-full py-3 rounded-xl border border-slate-700 text-white font-bold hover:bg-slate-800 transition-all mb-6 text-base"
              >
                Testar Agora
              </button>
            </div>

            {/* Starter */}
            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 flex flex-col hover:border-slate-600 transition-colors">
              <h3 className="text-2xl font-bold text-slate-200 mb-2">Iniciante</h3>
              <p className="text-slate-400 text-sm mb-8 font-medium">Para quem está começando (Ambiente de Teste).</p>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">R$ 47,00</span>
                  <span className="text-green-400 text-xs font-bold bg-green-900/30 px-2 py-1 rounded-full">Oferta Lançamento</span>
                </div>
                <p className="text-slate-500 text-sm mt-1">Pagamento Único</p>
              </div>
              <button
                // price_1ScuH5KPo7EypB7VnIs6qfbQ corresponds to 47.00 Iniciante
                onClick={() => handleCheckout('price_1ScuH5KPo7EypB7VnIs6qfbQ', 'payment')}
                id="btn-subscribe-starter"
                className="w-full py-4 rounded-xl border-2 border-slate-700 text-white font-bold hover:bg-slate-800 hover:border-slate-600 transition-all mb-8 text-lg"
              >
                Testar Agora
              </button>
              <ul className="space-y-5 flex-1">
                {['Até 10 Clientes', 'Agenda Básica', 'Prontuário Simples', 'Suporte por Email'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                    <CheckCircle2 size={18} className="text-slate-500" /> {feat}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="bg-slate-900 p-8 rounded-3xl border-2 border-primary-500 relative flex flex-col shadow-2xl shadow-primary-500/20 transform md:-translate-y-6 z-10">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white px-6 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide shadow-lg">
                Mais Popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Profissional</h3>
              <p className="text-primary-200 text-sm mb-8 font-medium">Para terapeutas em crescimento (Ambiente de Teste).</p>
              <div className="mb-8">
                <span className="text-5xl font-extrabold text-white">R$ 97,00</span>
                <span className="text-slate-400 text-xl font-medium">/único</span>
              </div>
              <button
                // Using the actual Pro ID from your environment or the most reliable active ID
                onClick={() => handleCheckout('price_1Sd8DXKPo7EypB7VZwytTUEP', 'payment')}
                id="btn-subscribe-pro"
                className="w-full py-4 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-500 transition-all mb-8 shadow-lg hover:shadow-primary-500/40 text-lg ring-offset-2 ring-offset-slate-900 focus:ring-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Testar Agora
              </button>
              <ul className="space-y-5 flex-1">
                {['Clientes Ilimitados', 'Protocolos TRG Completos', 'Financeiro + Recibos', 'Relatórios com IA', 'Suporte Prioritário'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white font-medium">
                    <CheckCircle2 size={20} className="text-primary-400" /> {feat}
                  </li>
                ))}
              </ul>
            </div>

            {/* Enterprise */}
            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 flex flex-col hover:border-slate-600 transition-colors">
              <h3 className="text-2xl font-bold text-slate-200 mb-2">Clínica</h3>
              <p className="text-slate-400 text-sm mb-8 font-medium">Para múltiplos profissionais.</p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-white">Sob Consulta</span>
              </div>
              <button onClick={onLoginClick} className="w-full py-4 rounded-xl border-2 border-slate-700 text-white font-bold hover:bg-slate-800 hover:border-slate-600 transition-all mb-8 text-lg">Falar com Vendas</button>
              <ul className="space-y-5 flex-1">
                {['Múltiplos Usuários', 'Gestão de Acessos', 'API Personalizada', 'Gerente de Conta', 'Treinamento Equipe'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                    <CheckCircle2 size={18} className="text-slate-500" /> {feat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- Security & Trust Section --- */}
      <section className="py-20 bg-slate-900/30 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 text-primary-400 text-sm font-bold mb-8">
            <Shield size={16} />
            <span>Privacidade e Segurança em Primeiro Lugar</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Sua prática protegida e em conformidade</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-12">
            O TeraNexus foi construído seguindo as diretrizes da LGPD para garantir que os dados de seus pacientes estejam sempre seguros e sob seu controle.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <button
              onClick={() => openLegal('terms')}
              className="flex items-center gap-3 px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 transition-all font-bold group"
            >
              <FileText size={20} className="text-primary-500 group-hover:scale-110 transition-transform" />
              Ver Termos de Uso
            </button>
            <button
              onClick={() => openLegal('privacy')}
              className="flex items-center gap-3 px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 transition-all font-bold group"
            >
              <Shield size={20} className="text-primary-500 group-hover:scale-110 transition-transform" />
              Ver Política de Privacidade
            </button>
          </div>
        </div>
      </section >

      {/* --- FAQ --- */}
      < section className="py-24" >
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16 drop-shadow-md">Perguntas Frequentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { q: "Preciso instalar algo no meu computador?", a: "Não. O TeraNexus é 100% online e funciona em qualquer navegador, seja no computador, tablet ou celular." },
              { q: "Meus dados estão seguros?", a: "Sim. Utilizamos criptografia de ponta a ponta e servidores seguros com backups diários para garantir total sigilo." },
              { q: "Posso exportar meus dados se cancelar?", a: "Com certeza. Seus dados são seus. Você pode exportar a base de clientes e prontuários a qualquer momento em formato JSON ou PDF." },
              { q: "Funciona para outros tipos de terapia?", a: "Embora o sistema seja otimizado para o protocolo TRG, muitos recursos (agenda, financeiro, anamnese) servem perfeitamente para qualquer terapeuta." }
            ].map((faq, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 hover:bg-slate-900 transition-colors">
                <h4 className="font-bold text-white mb-3 text-lg">{faq.q}</h4>
                <p className="text-slate-200 text-base leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* --- FOOTER --- */}
      < footer className="bg-slate-950 border-t border-slate-900 py-16" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <BrainCircuit size={24} className="text-white" />
            </div>
            <span className="font-bold text-2xl text-white tracking-tight">TeraNexus</span>
          </div>
          <div className="text-slate-400 text-sm font-medium">
            © 2023 TeraNexus Technology. Todos os direitos reservados.
          </div>
          <div className="flex gap-8">
            <button onClick={() => openLegal('terms')} className="text-slate-300 hover:text-white text-sm font-bold transition-colors">Termos</button>
            <button onClick={() => openLegal('privacy')} className="text-slate-300 hover:text-white text-sm font-bold transition-colors">Privacidade</button>
            <a href="mailto:contato@teranexus.com" className="text-slate-300 hover:text-white text-sm font-bold transition-colors">Contato</a>
          </div>
        </div>
      </footer >

      <LegalModal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
        type={legalModal.type}
      />

    </div >
  );
};

export default LandingPage;