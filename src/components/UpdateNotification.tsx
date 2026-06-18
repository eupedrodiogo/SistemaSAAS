import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Gift, ChevronRight, Rocket } from 'lucide-react';
import { APP_VERSION, CHANGELOG } from '../config/version';

const UpdateNotification: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentChangelog, setCurrentChangelog] = useState(CHANGELOG[0]);
    const location = useLocation();

    useEffect(() => {
        if (!location.pathname.startsWith('/dashboard')) return;

        const lastSeenVersion = localStorage.getItem('app_last_seen_version');

        // Show if no version stored OR version is different
        // In a real semver scenario we might want to check if APP_VERSION > lastSeenVersion
        // For simplicity, any change triggers it, ensuring users see new stuff.
        if (!lastSeenVersion || lastSeenVersion !== APP_VERSION) {
            // Find the changelog for the current version
            const log = CHANGELOG.find(c => c.version === APP_VERSION);
            if (log) {
                setCurrentChangelog(log);
                // Small delay to ensure smooth entry animation
                setTimeout(() => setIsOpen(true), 1500);
            }
        }
    }, [location.pathname]);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('app_last_seen_version', APP_VERSION);
    };

    if (!isOpen || !currentChangelog || !location.pathname.startsWith('/dashboard')) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 animate-slide-up transform transition-all">

                {/* Header with decorative background */}
                <div className="relative bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-white/10 w-24 h-24 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-2 -ml-2 bg-primary-500/30 w-16 h-16 rounded-full blur-xl"></div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-white/20 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                                    Novidade
                                </span>
                                <span className="text-primary-100 text-xs font-mono">v{currentChangelog.version}</span>
                            </div>
                            <h2 className="text-xl font-bold leading-tight">{currentChangelog.title}</h2>
                            <p className="text-primary-100 text-sm mt-1">{currentChangelog.date}</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                        >
                            <X size={20} className="text-white" />
                        </button>
                    </div>

                    <div className="absolute -bottom-6 -right-2 transform rotate-12 opacity-10">
                        <Rocket size={100} />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="space-y-4">
                        {currentChangelog.changes.map((change, idx) => (
                            <div key={idx} className="flex gap-3 text-slate-600 dark:text-slate-300">
                                <span className="flex-shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                                    <ChevronRight size={14} strokeWidth={3} />
                                </span>
                                <p className="text-sm leading-relaxed">{change}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={handleClose}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98]"
                        >
                            Entendido, vamos lá!
                        </button>
                        <p className="text-center text-[10px] text-slate-400 mt-3">
                            Continuamos trabalhando para melhorar sua experiência.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateNotification;
