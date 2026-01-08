import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

export default function ValidatorLayout() {

    // Stealth Mode: Alterar título e favicon da aba para não revelar "TeraNexus"
    useEffect(() => {
        const originalTitle = document.title;
        document.title = "Pesquisa: Futuro da Terapia"; // Título genérico

        // Opcional: Tentar mascarar o favicon se necessário (avançado)
        // const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        // link.type = 'image/x-icon';
        // link.rel = 'shortcut icon';
        // link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧪</text></svg>';
        // document.getElementsByTagName('head')[0].appendChild(link);

        return () => {
            document.title = originalTitle; // Restaurar ao sair
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans selection:bg-emerald-500/30">
            <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg tracking-tight text-white/90">SaaS Validator AI</span>
                </div>
                <div className="flex gap-4 text-sm text-slate-400">
                    <div className="hidden md:block">Device: Desktop</div>
                    <div className="hidden md:block">v2.1 (Stealth)</div>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <Outlet />
            </main>

            <footer className="p-8 text-center text-slate-500 text-sm max-w-7xl mx-auto w-full space-y-2">
                <p>Feito com código e café. Sem fins comerciais (por enquanto).</p>
                <a href="/login" className="text-slate-600 hover:text-slate-400 text-xs uppercase tracking-widest flex items-center justify-center gap-1 transition-colors opacity-0 hover:opacity-100">
                    <span className="w-2 h-2 rounded-full border border-current"></span>
                    Acesso Admin
                </a>
            </footer>
        </div>
    );
}
