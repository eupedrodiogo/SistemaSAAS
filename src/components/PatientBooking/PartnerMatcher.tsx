import React, { useState, useEffect } from 'react';
import { User, Star, MapPin, ChevronRight, Loader2 } from 'lucide-react';

interface PartnerMatcherProps {
    sourceTherapistId: string;
    onSelectPartner: (partnerId: string) => void;
    onClose: () => void;
}

interface Therapist {
    id: string;
    name: string;
    specialty: string;
    rating: number;
    city?: string;
}

export const PartnerMatcher: React.FC<PartnerMatcherProps> = ({ sourceTherapistId, onSelectPartner, onClose }) => {
    const [partners, setPartners] = useState<Therapist[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

    useEffect(() => {
        const fetchPartners = async () => {
            setLoading(true);
            try {
                // Fetch partners from API
                const params = new URLSearchParams();
                if (sourceTherapistId) params.append('sourceId', sourceTherapistId);
                if (selectedSpecialty) params.append('specialty', selectedSpecialty);

                const response = await fetch(`/api/network/match?${params.toString()}`);
                if (response.ok) {
                    const data = await response.json();
                    setPartners(data.matches || []);
                }
            } catch (error) {
                console.error("Error fetching partners:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPartners();
    }, [sourceTherapistId, selectedSpecialty]);

    const handleSelect = async (partner: Therapist) => {
        // Create Referral Record
        try {
            await fetch('/api/network/referral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceTherapistId, // The one who is full
                    targetTherapistId: partner.id,
                    patientName: "Paciente (Via Site)", // We might want to pass real name if available in BookingWizard data
                    patientContact: "Pendente",
                    status: 'pending'
                })
            });

            // Proceed to redirect
            onSelectPartner(partner.id);

        } catch (err) {
            console.error("Referral creation failed but proceeding:", err);
            onSelectPartner(partner.id);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Encontrar Terapeuta Parceiro</h2>
                        <p className="text-sm text-slate-500">Nossos parceiros certificados podem atender você.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">✕</button>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {['Ansiedade', 'Depressão', 'Relacionamentos', 'Carreira', 'Traumas'].map(spec => (
                            <button
                                key={spec}
                                onClick={() => setSelectedSpecialty(prev => prev === spec ? '' : spec)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                                    ${selectedSpecialty === spec
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-400'
                                    }`}
                            >
                                {spec}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
                            <p className="text-slate-400">Buscando melhores opções...</p>
                        </div>
                    ) : partners.length > 0 ? (
                        partners.map(partner => (
                            <div key={partner.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/5 transition-all group">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User size={32} className="text-slate-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">{partner.name}</h3>
                                        <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded text-xs font-bold text-amber-600 dark:text-amber-400">
                                            <Star size={12} fill="currentColor" />
                                            {partner.rating.toFixed(1)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{partner.specialty}</p>
                                    {partner.city && (
                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                            <MapPin size={12} />
                                            {partner.city}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleSelect(partner)}
                                    className="px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300 font-bold rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-colors flex items-center gap-2"
                                >
                                    Selecionar
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-slate-500">
                            Nenhum parceiro encontrado com estes filtros.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
