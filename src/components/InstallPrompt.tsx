import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const location = useLocation();

    // Determine context based on URL path or localStorage
    const isPatientContext = location.pathname.startsWith('/cliente') || 
                             location.pathname.startsWith('/portal-paciente') ||
                             location.pathname.startsWith('/agendar') ||
                             location.pathname.startsWith('/sessao-cliente') ||
                             location.pathname.startsWith('/t/') ||
                             localStorage.getItem('teranexus_app_type') === 'patient';
                             
    const appName = "TeraNexus";
    const description = <>Adicione o aplicativo à tela inicial para acessar suas sessões e agendamentos de forma muito mais rápida.</>;

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, so verify it can't be used again
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-4 right-4 z-[9999] animate-slide-up flex justify-center">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-sm overflow-hidden flex flex-col">

                {/* Header Bar - Highlighted */}
                <div className="bg-primary-600 p-4 flex justify-center items-center relative overflow-hidden">
                    {/* Abstract Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] animate-[shimmer_3s_infinite] pointer-events-none"></div>

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-sm">
                            <img src="/logo-new.jpg" alt="App Icon" className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg leading-tight tracking-tight">{appName}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 bg-primary-300 rounded-full animate-pulse shadow-[0_0_8px_rgba(125,211,252,0.8)]"></div>
                                <p className="text-[11px] font-black text-white/90 tracking-[0.1em] uppercase leading-none">
                                    Instalar no Dispositivo
                                </p>
                            </div>
                        </div>
                    </div>

                    {!isPatientContext && (
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="absolute right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 pt-5 bg-gradient-to-b from-slate-900 to-slate-950">
                    <p className="text-slate-300 text-[15px] leading-relaxed mb-8 font-medium text-center">
                        {description}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleInstallClick}
                            className="w-full bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_8px_20px_rgba(2,132,199,0.3)] transition-all active:scale-[0.97] flex items-center justify-center gap-3 text-base group"
                        >
                            <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                            Instalar Agora
                        </button>

                        {!isPatientContext && (
                            <button
                                onClick={() => setIsVisible(false)}
                                className="w-full bg-slate-800/50 hover:bg-slate-800 active:bg-slate-700 border border-slate-700/50 text-slate-300 font-bold py-3.5 px-6 rounded-2xl transition-all active:scale-[0.97] text-[15px]"
                            >
                                Lembrar mais tarde
                            </button>
                        )}
                    </div>
                </div>

                {/* Bottom Accent */}
                <div className="h-1 bg-primary-600/30 w-full animate-pulse"></div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-12deg); }
                    100% { transform: translateX(200%) skewX(-12deg); }
                }
            `}</style>
        </div>
    );
};

export default InstallPrompt;
