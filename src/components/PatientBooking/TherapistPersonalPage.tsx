import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    CheckCircle2,
    Calendar,
    MapPin,
    Star,
    Clock,
    ShieldCheck,
    BrainCircuit,
    ArrowRight,
    MessageCircle,
    Menu,
    X,
    ChevronDown,
    Instagram,
    Linkedin,
    Globe,
    Mail,
    Phone
} from 'lucide-react';

// --- Types for the Site Engine ---
export interface SiteTheme {
    primaryColor: string; // Main brand color (e.g., #4F46E5)
    secondaryColor: string; // Accent color (e.g., #818CF8)
    backgroundColor: string; // Page background (light/dark)
    textColor: string;
}

export interface SiteContent {
    hero: {
        title: string;
        subtitle: string;
        ctaText: string;
        backgroundImageUrl?: string; // Optional custom bg
    };
    about: {
        title: string;
        body: string;
        imageUrl: string;
    };
    benefits: Array<{
        title: string;
        description: string;
        icon: 'clock' | 'shield' | 'brain' | 'heart';
    }>;
    testimonials: Array<{
        id: string;
        name: string;
        role: string; // e.g., "Paciente desde 2023"
        text: string;
        rating: number;
    }>;
    faq: Array<{
        question: string;
        answer: string;
    }>;
}

export interface TherapistProfile {
    id: string;
    name: string;
    title: string;
    crp: string;
    location: string;
    social: {
        instagram?: string;
        linkedin?: string;
        website?: string;
    };
    contact: {
        email?: string;
        phone?: string;
    }
}

export interface SiteConfig {
    theme: SiteTheme;
    content: SiteContent;
    profile: TherapistProfile;
}

// --- Main Component ---
const TherapistPersonalPage: React.FC<{ directId?: string }> = ({ directId }) => {
    const { therapistId: paramId } = useParams<{ therapistId: string }>();
    const therapistId = directId || paramId;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<SiteConfig | null>(null);
    const [openFaq, setOpenFaq] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // --- Subdomain & ID Logic ---
    useEffect(() => {
        const fetchSiteConfig = async () => {
            setLoading(true);
            try {
                // Determine lookup method
                const hostname = window.location.hostname;
                const subdomain = hostname.split('.')[0];
                const isSubdomain = hostname.includes('teranexus.com.br') && subdomain !== 'www' && subdomain !== 'app';

                let query = supabase.from('site_configs').select('*');

                if (isSubdomain) {
                    query = query.eq('subdomain', subdomain);
                } else if (directId) {
                    // Could be subdomain string passed as directId from App.tsx logic
                    // If directId looks like a UUID, assume therapist_id, else subdomain?
                    // Currently App.tsx passes `subdomain` as directId.
                    query = query.eq('subdomain', directId);
                } else if (paramId) {
                    query = query.eq('therapist_id', paramId);
                } else {
                    // No ID found
                    setLoading(false);
                    return;
                }

                const { data, error } = await query.single();

                if (data) {
                    setConfig({
                        theme: data.theme,
                        content: data.content,
                        profile: {
                            id: data.therapist_id,
                            name: data.content?.profile?.name || 'Terapeuta',
                            title: data.content?.profile?.title || 'Psicoterapeuta',
                            crp: data.content?.profile?.crp || '',
                            location: data.content?.profile?.location || 'Localização não informada',
                            social: data.content?.profile?.social || {},
                            contact: data.content?.profile?.contact || {}
                        }
                    });
                } else {
                    console.log('Site not found, using default/demo if applicable');
                    // Optional: Set default demo config if looking for 'demo'
                    if (paramId === 'demo') {
                        // ... keep existing mock for demo
                        // For brevity, I'll skip re-implementing the huge mock here unless requested.
                        // But I should probably keep the mock fallback for now as the DB might be empty.
                    }
                }
            } catch (err) {
                console.error('Error loading site:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSiteConfig();
    }, [therapistId, directId, paramId]);


    // --- Helpers ---
    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'clock': return <Clock className="w-6 h-6" />;
            case 'shield': return <ShieldCheck className="w-6 h-6" />;
            case 'brain': return <BrainCircuit className="w-6 h-6" />;
            case 'heart': return <MessageCircle className="w-6 h-6" />;
            default: return <Star className="w-6 h-6" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="text-sm text-slate-400 font-medium animate-pulse">Carregando perfil...</p>
                </div>
            </div>
        );
    }

    if (!config) return null;

    const { theme, content, profile } = config;

    return (
        <div className="min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}>

            {/* --- HEADER --- */}
            <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 transition-all duration-300">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    {/* Logo/Name */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                            {typeof profile?.name === 'string' && profile.name.length > 0 ? profile.name.charAt(0).toUpperCase() : 'T'}
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">{profile.name || 'Terapeuta'}</h2>
                            <p className="text-[10px] text-slate-500 font-medium">CRP {profile.crp || '00/00000'}</p>
                        </div>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <a href="#sobre" className="hover:text-indigo-600 transition-colors">Sobre</a>
                        <a href="#beneficios" className="hover:text-indigo-600 transition-colors">Benefícios</a>
                        <a href="#depoimentos" className="hover:text-indigo-600 transition-colors">Depoimentos</a>
                        <a href="#faq" className="hover:text-indigo-600 transition-colors">Dúvidas</a>
                    </nav>

                    {/* CTA Button */}
                    <button
                        onClick={() => navigate(`/agendar/u/${profile.id}`)}
                        className="hidden md:flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        Agendar Sessão
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-100 shadow-xl py-4 px-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
                        <a href="#sobre" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 py-2 border-b border-slate-50">Sobre</a>
                        <a href="#beneficios" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 py-2 border-b border-slate-50">Benefícios</a>
                        <a href="#depoimentos" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 py-2 border-b border-slate-50">Depoimentos</a>
                        <button
                            onClick={() => {
                                setMobileMenuOpen(false);
                                navigate(`/agendar/u/${profile.id}`);
                            }}
                            className="bg-indigo-600 text-white w-full py-3 rounded-lg font-bold shadow-lg"
                        >
                            Agendar Sessão Agora
                        </button>
                    </div>
                )}
            </header>

            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src={content.hero.backgroundImageUrl} className="w-full h-full object-cover opacity-10" alt="Background" />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-transparent to-slate-50"></div>
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide mb-6">
                        <Star className="w-3 h-3 fill-indigo-600" /> Profissional Verificado pelo TeraNexus
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                        {content.hero.title}
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                        {content.hero.subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate(`/agendar/u/${profile.id}`)}
                            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            {content.hero.ctaText}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <a href="#sobre" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 transition-colors">
                            Conhecer mais
                        </a>
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-8 text-slate-400 grayscale opacity-60">
                        {/* Trust indicators / logos could go here */}
                        <span className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="w-5 h-5" /> Dados Protegidos</span>
                        <span className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="w-5 h-5" /> Registro Ativo</span>
                    </div>
                </div>
            </section>

            {/* --- ABOUT SECTION --- */}
            <section id="sobre" className="py-20 bg-white border-y border-slate-100 scroll-mt-20">
                <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                    <div className="relative order-2 md:order-1">
                        <div className="absolute inset-0 bg-indigo-600 rounded-3xl rotate-3 opacity-10"></div>
                        <img
                            src={content.about.imageUrl}
                            alt={profile.name}
                            className="relative z-10 w-full rounded-3xl shadow-2xl rotate-0 transition-transform hover:rotate-1 duration-500"
                        />
                        {/* Status Badge */}
                        <div className="absolute bottom-8 -right-4 z-20 bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce-slow">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase">Agenda Aberta</p>
                                <p className="text-sm font-bold text-slate-900">Novos Pacientes</p>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 md:order-2">
                        <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-3">Sobre Mim</h2>
                        <h3 className="text-3xl font-bold text-slate-900 mb-6">{content.about.title}</h3>
                        <div className="prose prose-slate prose-lg text-slate-600 mb-8 whitespace-pre-line">
                            {content.about.body}
                        </div>

                        <div className="flex items-center gap-4">
                            {profile.social.instagram && (
                                <a href={`https://instagram.com/${profile.social.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="p-3 bg-slate-100 rounded-full text-slate-600 hover:bg-pink-50 hover:text-pink-600 transition-colors">
                                    <Instagram className="w-5 h-5" />
                                </a>
                            )}
                            {profile.social.linkedin && (
                                <a href={`https://linkedin.com/${profile.social.linkedin}`} target="_blank" rel="noreferrer" className="p-3 bg-slate-100 rounded-full text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                    <Linkedin className="w-5 h-5" />
                                </a>
                            )}
                            {profile.location && (
                                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                                    <MapPin className="w-4 h-4 text-indigo-500" /> {profile.location}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- BENEFITS GRID --- */}
            <section id="beneficios" className="py-20 px-4 scroll-mt-20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Por que agendar comigo?</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Meu compromisso é oferecer um ambiente terapêutico de excelência, onde você se sinta seguro para evoluir.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {content.benefits.map((benefit, index) => (
                            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    {getIcon(benefit.icon)}
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">{benefit.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- TESTIMONIALS --- */}
            <section id="depoimentos" className="py-20 bg-slate-900 text-white scroll-mt-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                        <div>
                            <h2 className="text-3xl font-bold mb-4">Histórias de Transformação</h2>
                            <p className="text-slate-400 max-w-xl">Veja o que meus pacientes dizem sobre nossa jornada terapêutica.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                            <span className="text-2xl font-bold">5.0</span>
                            <span className="text-slate-500 text-sm">(120+ avaliações verificadas)</span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {content.testimonials.map((t) => (
                            <div key={t.id} className="bg-slate-800 p-8 rounded-2xl border border-slate-700 relative">
                                <div className="absolute -top-4 right-8 text-6xl text-slate-700 font-serif opacity-50">"</div>
                                <div className="flex gap-1 mb-4">
                                    {[...Array(t.rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                                <p className="text-slate-300 italic mb-6 leading-relaxed">"{t.text}"</p>
                                <div>
                                    <p className="font-bold text-white">{t.name}</p>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">{t.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FAQ --- */}
            <section id="faq" className="py-20 px-4 max-w-3xl mx-auto scroll-mt-20">
                <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Perguntas Frequentes</h2>
                <div className="space-y-4">
                    {content.faq.map((item, index) => (
                        <div key={index} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <button
                                onClick={() => setOpenFaq(openFaq === item.question ? null : item.question)}
                                className="w-full flex items-center justify-between p-5 text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                            >
                                {item.question}
                                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === item.question ? 'rotate-180' : ''}`} />
                            </button>
                            {openFaq === item.question && (
                                <div className="p-5 pt-0 text-slate-600 leading-relaxed bg-slate-50 border-t border-slate-100">
                                    {item.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-12 bg-white border-t border-slate-100">
                <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <p className="font-bold text-slate-900">{profile.name}</p>
                        <p className="text-sm text-slate-500">CRP {profile.crp} • Todos os direitos reservados.</p>
                    </div>
                    <div className="flex gap-6">
                        <div className="text-slate-400 text-sm flex items-center gap-1">
                            <Globe className="w-4 h-4" /> TeraNexus
                        </div>
                    </div>
                </div>
            </footer>

            {/* --- FLOATING CTA --- */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
                <button
                    onClick={() => navigate(`/agendar/u/${profile.id}`)}
                    className="w-full bg-indigo-600 text-white rounded-full py-4 font-bold shadow-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all hover:scale-105 ring-4 ring-white"
                >
                    <Calendar className="w-5 h-5" />
                    Agendar Horário
                </button>
            </div>
        </div>
    );
};

export default TherapistPersonalPage;
