
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
        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 px-3 border-r border-slate-100 dark:border-slate-700">
                <div className="bg-primary-50 dark:bg-primary-900/30 p-2 rounded-lg text-primary-600 dark:text-primary-400">
                    <Clock size={20} />
                </div>
                <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tempo</p>
                    <p className="text-xl font-bold text-slate-700 dark:text-slate-200 tabular-nums leading-none">
                        {formatTime(seconds)}
                    </p>
                </div>
            </div>

            <button
                onClick={onToggle}
                className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all
          ${isActive
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }
        `}
            >
                {isActive ? <PauseCircle size={16} /> : <Play size={16} />}
                {isActive ? 'Pausar' : 'Iniciar'}
            </button>

            <div className="px-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sessão Atual</p>
                <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    #{sessionNumber.toString().padStart(2, '0')}
                </p>
            </div>
        </div>
    );
};
