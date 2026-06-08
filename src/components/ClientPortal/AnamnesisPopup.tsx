import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, X, AlertCircle } from 'lucide-react';

interface AnamnesisPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const AnamnesisPopup: React.FC<AnamnesisPopupProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
                <div className="relative h-32 bg-gradient-to-br from-primary-600 to-primary-800 p-6 flex items-center justify-center">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                        <FileText size={32} className="text-white drop-shadow-md" />
                    </div>
                </div>
                
                <div className="p-8 text-center">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Ficha de Anamnese</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
                        Identificamos que sua ficha de anamnese ainda não foi preenchida. 
                        Este formulário é <strong className="text-primary-600 dark:text-primary-400 font-semibold">essencial</strong> para que seu terapeuta compreenda seu histórico e prepare o melhor atendimento possível para sua sessão.
                    </p>
                    
                    <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-3 rounded-xl flex items-center gap-3 text-left mb-8 border border-amber-200 dark:border-amber-800">
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-xs font-medium">Recomendamos preencher o quanto antes para garantir a efetividade do seu tratamento.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => {
                                onClose();
                                navigate('/portal-paciente/anamnese');
                            }}
                            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-0.5"
                        >
                            Preencher Agora
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all"
                        >
                            Preencher Depois
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnamnesisPopup;
