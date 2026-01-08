import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FlaskConical, MessageCircle, ArrowRight } from 'lucide-react';

export default function ValidatorLanding() {
    const navigate = useNavigate();

    const handleWhatsApp = () => {
        // Substituir pelo número real se disponível, usando placeholder por enquanto
        window.open('https://wa.me/5511999999999?text=Olá,%20Pedro!%20Vi%20sua%20página%20sobre%20o%20futuro%20da%20TRG.', '_blank');
    };

    return (
        <div className="max-w-2xl w-full text-center space-y-12 animate-fade-in">

            {/* Icon/Avatar */}
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-full border border-slate-700 flex items-center justify-center shadow-2xl ring-1 ring-white/10">
                    <span className="text-4xl">👨‍💻</span>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-900 text-xs font-bold px-2 py-1 rounded-full border border-slate-900 flex items-center gap-1 shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping absolute opacity-70"></div>
                    <div className="w-2 h-2 bg-white rounded-full relative"></div>
                    Dev
                </div>
            </div>

            {/* Hero Text */}
            <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                    Ajude a construir o futuro da <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Terapia TRG</span>
                </h1>
                <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-xl mx-auto">
                    Sou o Pedro, desenvolvedor de software. Percebi que muitos terapeutas sofrem para organizar prontuários e evoluções.
                    Estou construindo uma solução e preciso da sua opinião para não criar algo inútil.
                </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                    onClick={() => navigate('pesquisa')}
                    className="w-full sm:w-auto px-8 py-4 bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-1 flex items-center justify-center gap-2 group"
                >
                    Responder Pesquisa Rápida
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                    onClick={handleWhatsApp}
                    className="w-full sm:w-auto px-8 py-4 bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    <MessageCircle className="w-5 h-5" />
                    Falar no WhatsApp
                </button>
            </div>

            {/* Social Proof / Trust Indicators (Optional placeholder) */}
            <div className="pt-8 flex items-center justify-center gap-8 text-slate-600 grayscale opacity-50">
                {/* Add logos if needed later */}
            </div>

        </div>
    );
}
