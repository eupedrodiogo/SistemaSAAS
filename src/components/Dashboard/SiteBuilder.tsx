import React, { useState, useEffect } from 'react';
import {
    Layout,
    Palette,
    Type,
    Image as ImageIcon,
    Save,
    Eye,
    Globe,
    CheckCircle2,
    Undo,
    Monitor,
    Smartphone,
    X
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { SiteConfig } from '../PatientBooking/TherapistPersonalPage';
import { supabase } from '../../lib/supabase';

const SiteBuilder: React.FC = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'content' | 'design' | 'domain'>('design');
    const [saving, setSaving] = useState(false);

    // Initial State (Default Config)
    const [config, setConfig] = useState<SiteConfig>({
        theme: {
            primaryColor: '#4F46E5',
            secondaryColor: '#C7D2FE',
            backgroundColor: '#F8FAFC',
            textColor: '#1E293B',
        },
        profile: {
            id: user?.id || 'demo',
            name: user?.name || 'Dr. Ricardo Silva',
            title: 'Psicoterapeuta Especialista em TRG',
            crp: '06/84239',
            location: 'São Paulo, SP (Online)',
            social: {
                instagram: '@dr.ricardo',
                linkedin: 'in/ricardosilva'
            },
            contact: {
                email: user?.email,
            }
        },
        content: {
            hero: {
                title: 'Liberte-se das dores emocionais e viva plenamente.',
                subtitle: 'Terapia especializada em reprocessamento generativo (TRG).',
                ctaText: 'Agendar minha sessão',
                backgroundImageUrl: 'https://images.unsplash.com/photo-1633613286991-611fe299c4be?q=80&w=2070&auto=format&fit=crop'
            },
            about: {
                title: 'Sobre Mim',
                body: 'Minha missão é ajudar pessoas a superarem barreiras emocionais...',
                imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
            },
            benefits: [],
            testimonials: [],
            faq: []
        }
    });
    const [subdomain, setSubdomain] = useState('');
    const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');

    // Fetch existing config
    useEffect(() => {
        if (!user?.id) return;

        const fetchConfig = async () => {
            try {
                const { data, error } = await supabase
                    .from('site_configs')
                    .select('*')
                    .eq('therapist_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                    console.error('Error fetching site config:', error);
                    return;
                }

                if (data) {
                    setConfig({
                        theme: data.theme || config.theme,
                        profile: { ...config.profile, ...data.content?.profile }, // Merge if needed
                        content: data.content || config.content
                    });
                    if (data.subdomain) setSubdomain(data.subdomain);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            }
        };

        fetchConfig();
    }, [user?.id]);

    const checkSubdomain = async (val: string) => {
        if (!val || val.length < 3) {
            setSubdomainStatus('idle');
            return;
        }
        setSubdomainStatus('checking');

        // Check if taken by OTHERS
        const { data, error } = await supabase
            .from('site_configs')
            .select('id')
            .eq('subdomain', val)
            .neq('therapist_id', user?.id || '') // Exclude self
            .single();

        if (data) {
            setSubdomainStatus('unavailable');
        } else {
            setSubdomainStatus('available');
        }
    };

    const handleSave = async () => {
        if (!user?.id) return;
        setSaving(true);

        try {
            const { error } = await supabase
                .from('site_configs')
                .upsert({
                    therapist_id: user.id,
                    subdomain: subdomain || null,
                    theme: config.theme,
                    content: config.content,
                    published: true,
                    updated_at: new Date()
                }, { onConflict: 'therapist_id' });

            if (error) throw error;
            alert('Site salvo e publicado com sucesso!');
        } catch (err) {
            console.error('Error saving site:', err);
            alert('Erro ao salvar o site. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Layout className="w-6 h-6 text-indigo-600" /> Editor do Site
                        </h1>
                        <p className="text-slate-500">Personalize sua página profissional exclusiva.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.open(`/t/${user?.id || 'demo'}`, '_blank')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                        >
                            <Eye className="w-4 h-4" /> Visualizar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70"
                        >
                            {saving ? 'Salvando...' : <><Save className="w-4 h-4" /> Publicar Alterações</>}
                        </button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* LEFT SIDEBAR (Controls) */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Tabs */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-1 flex">
                            <button
                                onClick={() => setActiveTab('design')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'design' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Palette className="w-4 h-4" /> Design
                            </button>
                            <button
                                onClick={() => setActiveTab('content')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'content' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Type className="w-4 h-4" /> Conteúdo
                            </button>
                            <button
                                onClick={() => setActiveTab('domain')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'domain' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Globe className="w-4 h-4" /> Domínio
                            </button>
                        </div>

                        {/* Controls Container */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-[calc(100vh-250px)] overflow-y-auto">

                            {activeTab === 'design' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Cor Principal da Marca</label>
                                        <div className="flex gap-3">
                                            <input
                                                type="color"
                                                value={config.theme.primaryColor}
                                                onChange={(e) => setConfig({ ...config, theme: { ...config.theme, primaryColor: e.target.value } })}
                                                className="h-10 w-10 rounded-lg border-0 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={config.theme.primaryColor}
                                                onChange={(e) => setConfig({ ...config, theme: { ...config.theme, primaryColor: e.target.value } })}
                                                className="flex-1 border border-slate-200 rounded-lg px-3 text-sm text-slate-600 uppercase"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Cor de Fundo</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['#FFFFFF', '#F8FAFC', '#F3F4F6', '#FFFBEB', '#F0F9FF'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setConfig({ ...config, theme: { ...config.theme, backgroundColor: c } })}
                                                    className={`h-10 rounded-lg border ${config.theme.backgroundColor === c ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200'}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Foto de Capa (Hero)</label>
                                        <div className="aspect-video bg-slate-100 rounded-lg relative overflow-hidden group cursor-pointer border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-colors flex items-center justify-center">
                                            {config.content.hero.backgroundImageUrl ? (
                                                <img src={config.content.hero.backgroundImageUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                                    <span className="text-xs text-slate-500">Clique para alterar</span>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="URL da Imagem"
                                            value={config.content.hero.backgroundImageUrl}
                                            onChange={(e) => setConfig({ ...config, content: { ...config.content, hero: { ...config.content.hero, backgroundImageUrl: e.target.value } } })}
                                            className="mt-2 w-full text-xs border border-slate-200 rounded px-2 py-1 text-slate-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'content' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Título Principal</label>
                                        <textarea
                                            value={config.content.hero.title}
                                            onChange={(e) => setConfig({ ...config, content: { ...config.content, hero: { ...config.content.hero, title: e.target.value } } })}
                                            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            rows={2}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Subtítulo</label>
                                        <textarea
                                            value={config.content.hero.subtitle}
                                            onChange={(e) => setConfig({ ...config, content: { ...config.content, hero: { ...config.content.hero, subtitle: e.target.value } } })}
                                            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            rows={3}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Texto do Botão (CTA)</label>
                                        <input
                                            type="text"
                                            value={config.content.hero.ctaText}
                                            onChange={(e) => setConfig({ ...config, content: { ...config.content, hero: { ...config.content.hero, ctaText: e.target.value } } })}
                                            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                    <hr className="border-slate-100" />
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Biografia</label>
                                        <textarea
                                            value={config.content.about.body}
                                            onChange={(e) => setConfig({ ...config, content: { ...config.content, about: { ...config.content.about, body: e.target.value } } })}
                                            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            rows={6}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'domain' && (
                                <div className="space-y-6">
                                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Globe className="w-5 h-5 text-indigo-600" />
                                            <h3 className="font-bold text-indigo-900">Domínio Personalizado</h3>
                                        </div>
                                        <p className="text-xs text-indigo-700 mb-4">
                                            Links personalizados (`seu-nome.teranexus.com.br`) aumentam a autoridade do seu perfil.
                                        </p>

                                        <div className="flex items-center">
                                            <input
                                                type="text"

                                                value={subdomain}
                                                onChange={(e) => {
                                                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                                    setSubdomain(val);
                                                    checkSubdomain(val);
                                                }}
                                                placeholder="seu-nome"
                                                className="flex-1 rounded-l-lg border border-indigo-200 p-2 text-sm text-right bg-white font-medium text-slate-700 focus:outline-none"
                                            />
                                            <span className="bg-slate-100 border border-l-0 border-indigo-200 rounded-r-lg p-2 text-sm text-slate-500 font-medium">.teranexus.com.br</span>
                                        </div>
                                        {subdomainStatus === 'available' && (
                                            <p className="text-[10px] text-green-600 mt-2 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Disponível
                                            </p>
                                        )}
                                        {subdomainStatus === 'unavailable' && (
                                            <p className="text-[10px] text-red-600 mt-2 flex items-center gap-1">
                                                <X className="w-3 h-3" /> Indisponível
                                            </p>
                                        )}
                                    </div>

                                    <button className="w-full py-3 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm font-bold hover:bg-slate-50">
                                        Conectar Domínio Próprio (.com.br)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PREVIEW (Phone Mockup) */}
                    <div className="lg:col-span-2 bg-slate-200 rounded-2xl p-8 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, gray 1px, transparent 0)',
                            backgroundSize: '24px 24px'
                        }}></div>

                        <div className="bg-white rounded-[3rem] border-8 border-slate-800 h-[700px] w-[360px] shadow-2xl overflow-hidden relative">
                            {/* Phone Frame Content Area */}
                            <div className="absolute inset-0 bg-white overflow-y-auto custom-scrollbar">
                                {/* --- MINI PREVIEW IMPLEMENTATION (Reusing logic for visual feedback) --- */}
                                <div className="min-h-full pb-12 transition-colors duration-300" style={{ backgroundColor: config.theme.backgroundColor, color: config.theme.textColor }}>
                                    {/* Header Preview */}
                                    {config.content.hero.backgroundImageUrl && (
                                        <div className="h-48 relative">
                                            <img src={config.content.hero.backgroundImageUrl} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                            <div className="absolute bottom-4 left-4 text-white">
                                                <h2 className="font-bold text-shadow">{config.profile.name}</h2>
                                                <p className="text-xs opacity-90">{config.profile.title}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6">
                                        <h1 className="text-2xl font-bold leading-tight mb-4" style={{ color: config.theme.textColor }}>{config.content.hero.title}</h1>
                                        <p className="text-sm opacity-80 mb-6">{config.content.hero.subtitle}</p>

                                        <button
                                            className="w-full py-3 rounded-full font-bold text-white shadow-lg mb-8"
                                            style={{ backgroundColor: config.theme.primaryColor }}
                                        >
                                            {config.content.hero.ctaText}
                                        </button>

                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <p className="text-xs text-slate-400 uppercase font-bold mb-2">Bio</p>
                                            <p className="text-sm line-clamp-4">{config.content.about.body}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Phone Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-20"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SiteBuilder;
