
import React from 'react';
import { Clock, Play, PauseCircle } from 'lucide-react';

interface SessionTimerProps {
    seconds: number;
    isActive: boolean;
    onToggle: () => void;
    sessionNumber: number;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({
    seconds,
    isActive,
    onToggle,
    sessionNumber
}) => {
    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-1.5 sm:gap-4 bg-white dark:bg-slate-800 p-1 sm:p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-1.5 sm:gap-3 px-1 sm:px-3 border-r border-slate-100 dark:border-slate-700">
                <div className="hidden xs:block bg-primary-50 dark:bg-primary-900/30 p-1.5 sm:p-2 rounded-lg text-primary-600 dark:text-primary-400 shrink-0">
                    <Clock size={16} className="sm:w-5 sm:h-5" />
                </div>
                <div>
                    <p className="hidden xs:block text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Tempo</p>
                    <p className="text-sm sm:text-xl font-bold text-slate-700 dark:text-slate-200 tabular-nums leading-none">
                        {formatTime(seconds)}
                    </p>
                </div>
            </div>

            <button
                onClick={onToggle}
                className={`
                    flex items-center gap-1 sm:gap-2 p-1.5 sm:px-4 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-all shrink-0
                    ${isActive
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }
                `}
            >
                {isActive ? <PauseCircle size={14} className="sm:w-4 sm:h-4" /> : <Play size={14} className="sm:w-4 sm:h-4" />}
                <span className="hidden xs:inline">{isActive ? 'Pausar' : 'Iniciar'}</span>
            </button>

            <div className="hidden sm:block px-4 shrink-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sessão Atual</p>
                <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    #{sessionNumber.toString().padStart(2, '0')}
                </p>
            </div>
        </div>
    );
};
