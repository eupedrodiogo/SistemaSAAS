import React, { useState, useEffect } from 'react';
import { User, Search, Award, Star, MessageSquare, CheckCircle2, ChevronRight, X } from 'lucide-react';

interface Therapist {
    id: string;
    name: string;
    bio: string;
    photo_url: string;
    specialties: string[];
    citrg_code?: string;
    rating?: number;
    review_count?: number;
    appointments_count?: number;
    price?: number;
    currency?: string;
    session_duration?: number;
    is_verified?: boolean;
}

interface TherapistSelectionStepProps {
    onSelect: (therapistId: string) => void;
}

const TherapistAvatar = ({ url, name, iconSize = 48 }: { url?: string, name: string, iconSize?: number }) => {
    const [error, setError] = useState(false);

    if (url && !error) {
        return (
            <img
                src={url}
                alt={name}
                className="w-full h-full object-cover"
                onError={() => setError(true)}
            />
        );
    }

    return (
        <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
            <User size={iconSize} strokeWidth={1.5} />
        </div>
    );
};

const TherapistSelectionStep: React.FC<TherapistSelectionStepProps> = ({ onSelect }) => {
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingProfile, setViewingProfile] = useState<Therapist | null>(null);

    useEffect(() => {
        const fetchTherapists = async () => {
            try {
                const response = await fetch('/api/public/therapists');
                if (response.ok) {
                    const data = await response.json();
                    setTherapists(data.therapists);
                }
            } catch (error) {
                console.error('Error fetching therapists:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTherapists();
    }, []);

    const filteredTherapists = therapists.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.specialties?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Buscando terapeutas disponíveis...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto animate-fade-in p-4">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">Encontre seu Terapeuta Ideal</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                    Nossos profissionais são certificados e especialistas na Metodologia TRG para te ajudar a superar traumas e bloqueios emocionais.
                </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-10 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="text-slate-400" size={20} />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nome, especialidade ou tema..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                />
            </div>

            <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto">
                {filteredTherapists.length > 0 ? (
                    filteredTherapists.map(therapist => (
                        <div
                            key={therapist.id}
                            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 group flex flex-col md:flex-row min-h-[420px]"
                        >
                            {/* Profile Image Column */}
                            <div className="md:w-64 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700">
                                <div className="relative w-40 h-40 rounded-full ring-4 ring-white dark:ring-slate-800 shadow-md mb-4 bg-white dark:bg-slate-800">
                                    <TherapistAvatar url={therapist.photo_url} name={therapist.name} iconSize={48} />
                                    {therapist.is_verified && (
                                        <div className="absolute bottom-1 right-1 bg-green-500 text-white p-1 rounded-full shadow-sm border-2 border-white dark:border-slate-800" title="Terapeuta Verificado">
                                            <CheckCircle2 size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>

                                {therapist.rating && (
                                    <div className="flex items-center gap-1 mb-1">
                                        <div className="flex text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} fill={i < Math.floor(therapist.rating!) ? "currentColor" : "none"} className={i < Math.floor(therapist.rating!) ? "" : "text-slate-300 dark:text-slate-600"} />
                                            ))}
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{therapist.rating.toFixed(1)}</span>
                                    </div>
                                )}

                                {therapist.review_count && (
                                    <span className="text-xs text-slate-400">({therapist.review_count} avaliações)</span>
                                )}
                            </div>

                            {/* Info Column */}
                            <div className="flex-1 p-6 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                            {therapist.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            <span className="font-semibold text-primary-600 dark:text-primary-400">Terapeuta TRG</span>
                                            {therapist.citrg_code && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span>CITRG: {therapist.citrg_code}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4 mt-2">
                                    {therapist.specialties?.map((spec, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg">
                                            {spec}
                                        </span>
                                    ))}
                                </div>

                                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-6 flex-1 leading-relaxed">
                                    {therapist.bio || 'Especialista em reprocessamento generativo, focado em resultados rápidos e duradouros para traumas e bloqueios.'}
                                </p>

                                <div className="pt-6 mt-auto border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex flex-col">
                                        {therapist.appointments_count ? (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                                                <MessageSquare size={14} className="text-slate-400" />
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">{therapist.appointments_count}</span> atendimentos
                                            </div>
                                        ) : null}

                                        {therapist.price ? (
                                            <div className="text-lg font-bold text-slate-800 dark:text-white">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: therapist.currency || 'BRL' }).format(therapist.price)}
                                                <span className="text-xs font-normal text-slate-400 ml-1">/ {therapist.session_duration || 50} min</span>
                                            </div>
                                        ) : (
                                            <div className="text-sm font-medium text-slate-500">Valor sob consulta</div>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={() => setViewingProfile(therapist)}
                                            className="w-full sm:w-auto text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-6 py-3 font-semibold text-sm transition-all border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            Ver Perfil
                                        </button>
                                        <button
                                            onClick={() => window.location.href = `/agendar/${therapist.id}`}
                                            className="w-full sm:w-auto justify-center bg-slate-900 dark:bg-white hover:bg-primary-600 dark:hover:bg-primary-500 text-white dark:text-slate-900 px-8 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-xl active:scale-95"
                                        >
                                            Agendar
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 text-center py-16 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Nenhum terapeuta encontrado</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                            Não encontramos resultados para "{searchTerm}". Tente buscar por outras especialidades ou nomes.
                        </p>
                    </div>
                )}
            </div>


            {/* Full Profile Modal */}
            {
                viewingProfile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <div
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                            onClick={() => setViewingProfile(null)}
                        />
                        <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
                            {/* Modal Header/Cover */}
                            <div className="relative h-32 sm:h-48 bg-[#0f172a] flex items-center justify-center">
                                {/* Enhanced Gradient & Pattern */}
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-slate-900/40"></div>
                                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent"></div>

                                <button
                                    onClick={() => setViewingProfile(null)}
                                    className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-xl z-50 border border-white/20 group shadow-lg"
                                >
                                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="px-6 sm:px-10 pb-12">
                                    {/* Profile Image with Glass Frame */}
                                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 mt-8 mb-12 items-center sm:items-end relative z-30">
                                        <div className="relative flex-shrink-0 group">
                                            <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-[2.5rem] ring-8 ring-white dark:ring-slate-900 shadow-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 transition-transform duration-500 group-hover:scale-[1.02]">
                                                <TherapistAvatar url={viewingProfile.photo_url} name={viewingProfile.name} iconSize={56} />
                                            </div>
                                            {viewingProfile.is_verified && (
                                                <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white dark:border-slate-900" title="Verificado">
                                                    <CheckCircle2 size={18} strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 text-center sm:text-left space-y-2">
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                                                    {viewingProfile.name}
                                                </h3>
                                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1">
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-bold tracking-wide uppercase border border-primary-100/50 dark:border-primary-800/50">
                                                        <Award size={14} />
                                                        Terapeuta TRG Master
                                                    </div>
                                                    {viewingProfile.citrg_code && (
                                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400/80 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                                            CITRG: {viewingProfile.citrg_code}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-center sm:justify-start gap-4">
                                                {viewingProfile.rating && (
                                                    <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-800/30">
                                                        <Star size={14} className="text-amber-500 fill-amber-500" />
                                                        <span className="font-bold text-amber-700 dark:text-amber-400">{viewingProfile.rating.toFixed(1)}</span>
                                                        <span className="text-amber-600/70 dark:text-amber-500/70 text-xs">({viewingProfile.review_count} avaliações)</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm sm:self-center">
                                            <div className="text-center sm:text-right">
                                                {viewingProfile.price ? (
                                                    <div className="space-y-0.5">
                                                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Investimento</div>
                                                        <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: viewingProfile.currency || 'BRL' }).format(viewingProfile.price)}
                                                        </div>
                                                        <div className="text-xs font-semibold text-primary-600 dark:text-primary-400">{viewingProfile.session_duration || 50} min / sessão</div>
                                                    </div>
                                                ) : (
                                                    <div className="text-lg font-bold text-slate-400">Consultar valor</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Content Sections */}
                                    <div className="grid lg:grid-cols-12 gap-10 pt-10 border-t border-slate-100 dark:border-slate-800/80">
                                        <div className="lg:col-span-8 space-y-12">
                                            <section>
                                                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                                    <div className="p-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
                                                        <User size={20} />
                                                    </div>
                                                    Sobre o Terapeuta
                                                </h4>
                                                <div className="max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                                                    <p className="whitespace-pre-line bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                                        {viewingProfile.bio}
                                                    </p>
                                                </div>
                                            </section>

                                            <section>
                                                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                                        <Award size={20} />
                                                    </div>
                                                    Especialidades
                                                </h4>
                                                <div className="flex flex-wrap gap-3">
                                                    {viewingProfile.specialties?.map((spec, i) => (
                                                        <span key={i} className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full text-sm font-semibold shadow-sm hover:border-primary-300 dark:hover:border-primary-800 transition-colors">
                                                            {spec}
                                                        </span>
                                                    ))}
                                                </div>
                                            </section>
                                        </div>

                                        <div className="lg:col-span-4 space-y-6">
                                            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none sticky top-6">
                                                <h4 className="font-bold text-slate-900 dark:text-white mb-6 text-sm uppercase tracking-widest flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                                    Informações
                                                </h4>
                                                <ul className="space-y-6">
                                                    <li className="flex items-start gap-4">
                                                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-xl text-green-600 dark:text-green-400">
                                                            <CheckCircle2 size={20} />
                                                        </div>
                                                        <div className="pt-0.5">
                                                            <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">Profissional Verificado</span>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">Identidade e CITRG validados</span>
                                                        </div>
                                                    </li>
                                                    <li className="flex items-start gap-4">
                                                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl text-amber-600 dark:text-amber-400">
                                                            <Award size={20} />
                                                        </div>
                                                        <div className="pt-0.5">
                                                            <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">Selo TRG Master</span>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">Reconhecimento por excelência</span>
                                                        </div>
                                                    </li>
                                                </ul>

                                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                                                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-4">
                                                        <span>Avaliação Geral</span>
                                                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                                                            <Star size={16} className="fill-current" />
                                                            {viewingProfile.rating?.toFixed(1) || "5.0"}
                                                        </div>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-amber-500 rounded-full w-[98%] shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer with Strong CTA */}
                            <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="hidden sm:block">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Pronto para começar sua jornada de <span className="text-primary-600 dark:text-primary-400 font-bold italic">reprocessamento</span>?
                                    </p>
                                </div>
                                <div className="flex w-full sm:w-auto gap-4">
                                    <button
                                        onClick={() => setViewingProfile(null)}
                                        className="flex-1 sm:flex-none px-8 py-4 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-800 dark:hover:text-white transition-colors"
                                    >
                                        Depois
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (viewingProfile) {
                                                window.location.href = `/agendar/${viewingProfile.id}`;
                                            }
                                        }}
                                        className="flex-[2] sm:flex-none px-10 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-2xl font-black text-lg shadow-2xl shadow-primary-500/30 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 group"
                                    >
                                        Agendar Agora
                                        <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default TherapistSelectionStep;
