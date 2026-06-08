import React from 'react';
import { BrainCircuit, CheckCircle2, ArrowRight, Star, ShieldCheck, Clock, Heart, Users, Sun, Moon, PlayCircle, X } from 'lucide-react';

interface PatientLandingPageProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const PatientLandingPage: React.FC<PatientLandingPageProps> = ({ isDarkMode, toggleTheme }) => {
    const handleBooking = () => {
        // Extract therapistId from URL /paciente/:id
        const pathParts = window.location.pathname.split('/');
        const therapistId = pathParts[2]; // /paciente/123 -> 123

        if (therapistId) {
            window.location.href = `/agendar/${therapistId}`;
        } else {
            window.location.href = '/agendar';
        }
    };

    const [showVideoModal, setShowVideoModal] = React.useState(false);

    React.useEffect(() => {
        localStorage.setItem('teranexus_app_type', 'patient');
    }, []);


    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">

            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-primary-500/20">
                            <img src="/logo-new.jpg" alt="TeraNexus" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">
                            Tera<span className="text-primary-500">Nexus</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors hidden sm:block"
                        >
                            Sou Terapeuta
                        </button>
                        <button
                            onClick={() => window.location.href = '/portal-paciente/login'}
                            className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors hidden sm:block"
                        >
                            Área do Cliente
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button
                            onClick={handleBooking}
                            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-full transition-all shadow-lg shadow-primary-500/20 active:scale-95 hidden md:block"
                        >
                            Agendar Sessão
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 to-transparent dark:from-primary-900/10 dark:to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-bold text-sm mb-8 animate-fade-in">
                            <Star size={16} className="fill-current" /> Terapia de Reprocessamento Generativo
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 animate-slide-up">
                            Liberte-se dos seus <span className="text-primary-600">Traumas Emocionais</span>
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed animate-slide-up delay-100">
                            A TRG é uma terapia breve e focada em resultados. Reprocesse as dores do passado que impedem sua felicidade no presente. Recupere o controle da sua vida emocional.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-200">
                            <button
                                onClick={handleBooking}
                                className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white text-lg font-bold rounded-xl transition-all shadow-xl shadow-primary-500/30 active:scale-95 flex items-center justify-center gap-2"
                            >
                                Quero Agendar Minha Sessão <ArrowRight size={20} />
                            </button>
                            <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white text-lg font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                                Saiba Mais
                            </button>
                        </div>
                        <div className="mt-12 flex items-center justify-center gap-8 text-slate-500 dark:text-slate-400 text-sm font-medium animate-fade-in delay-300">
                            <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-green-500" /> 100% Confidencial</span>
                            <span className="flex items-center gap-2"><Clock size={18} className="text-blue-500" /> Terapia Breve</span>
                            <span className="flex items-center gap-2"><Users size={18} className="text-amber-500" /> +5.000 Vidas Transformadas</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* What is TRG */}
            <section className="py-20 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
                        {/* Left Column: Text */}
                        <div className="order-2 lg:order-1">
                            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-slate-800 dark:text-white">O que é a TRG?</h2>
                            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                                A Terapia de Reprocessamento Generativo (TRG) é uma metodologia revolucionária que atua diretamente na raiz dos problemas emocionais. Diferente de terapias tradicionais que podem levar anos, a TRG foca em reestruturar o psiquismo de forma objetiva.
                            </p>
                            <ul className="space-y-4 mb-8">
                                {[
                                    'Focada na causa raiz do problema',
                                    'Resultados perceptíveis desde a primeira sessão',
                                    'Não precisa reviver a dor intensamente',
                                    'Método estruturado e seguro'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                                        <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={14} strokeWidth={3} />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => setShowVideoModal(true)}
                                className="w-fit px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
                            >
                                <PlayCircle size={20} />
                                Conhecer a Metodologia
                            </button>
                        </div>

                        {/* Right Column: Image */}
                        <div className="relative order-1 lg:order-2">
                            <div className="absolute -inset-4 bg-primary-100 dark:bg-primary-900/20 rounded-3xl transform rotate-3" />
                            <img
                                src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                alt="Sessão de Terapia"
                                className="relative rounded-2xl shadow-2xl w-full object-cover h-[500px]"
                            />
                        </div>
                    </div>

                    {/* Bottom Row: Video */}
                    <div className="w-full max-w-5xl mx-auto">
                        <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-900/10 dark:ring-white/10 w-full">
                            <div className="relative pb-[56.25%] h-0 bg-black">
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src="https://www.youtube.com/embed/11pswl7LyZ4?si=LVVdX6OGO0UV10GU&controls=0"
                                    title="TRG Methodology"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="py-20 bg-slate-50 dark:bg-slate-950">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-slate-800 dark:text-white">Para quem é a TRG?</h2>
                        <p className="text-slate-600 dark:text-slate-400">Se você se identifica com algum destes sintomas, a TRG pode transformar sua vida.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: 'Ansiedade e Pânico', desc: 'Para quem vive em constante estado de alerta, medo ou preocupação excessiva.', icon: Clock },
                            { title: 'Depressão e Tristeza', desc: 'Para quem sente um vazio, falta de energia ou desesperança constante.', icon: Heart },
                            { title: 'Traumas de Infância', desc: 'Para quem carrega marcas do passado que ainda doem no presente.', icon: BrainCircuit },
                            { title: 'Fobias Específicas', desc: 'Medos irracionais que paralisam e impedem de viver plenamente.', icon: ShieldCheck },
                            { title: 'Luto não Processado', desc: 'Dificuldade em aceitar perdas e seguir em frente.', icon: Star },
                            { title: 'Baixa Autoestima', desc: 'Sentimento de inferioridade e incapacidade de ver seu próprio valor.', icon: Users },
                        ].map((card, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600 mb-6">
                                    <card.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-white">{card.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">Sua nova vida começa hoje</h2>
                    <p className="text-primary-100 text-xl mb-10 max-w-2xl mx-auto">
                        Não adie mais a sua felicidade. Dê o primeiro passo rumo à liberdade emocional que você merece.
                    </p>
                    <button
                        onClick={handleBooking}
                        className="px-10 py-5 bg-white text-primary-700 font-bold text-xl rounded-2xl shadow-2xl hover:bg-slate-50 transition-all transform hover:scale-105"
                    >
                        Agendar Minha Primeira Sessão
                    </button>
                    <p className="mt-6 text-primary-200 text-sm">Vagas limitadas para este mês.</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                            <img src="/logo-new.jpg" alt="TeraNexus" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-xl text-white">
                            Tera<span className="text-primary-500">Nexus</span>
                        </span>
                    </div>
                    <div className="text-sm">
                        © {new Date().getFullYear()} TeraNexus. Todos os direitos reservados.
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Instagram</a>
                        <a href="#" className="hover:text-white transition-colors">WhatsApp</a>
                        <a href="#" className="hover:text-white transition-colors">Email</a>
                    </div>
                </div>
            </footer>

            {/* Video Modal */}
            {showVideoModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowVideoModal(false)}>
                    <div className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowVideoModal(false)}
                            className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                        >
                            <X size={24} />
                        </button>
                        <div className="relative pb-[56.25%] h-0">
                            <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src="https://www.youtube.com/embed/11pswl7LyZ4?si=LVVdX6OGO0UV10GU&autoplay=1"
                                title="TRG Methodology Fullscreen"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientLandingPage;
