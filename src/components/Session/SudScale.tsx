
import React, { useState, useEffect } from 'react';

interface SudScaleProps {
    value: number;
    onChange: (v: number) => void;
    label?: string;
    scaleType?: 'distress' | 'positive';
}

export const SudScale: React.FC<SudScaleProps> = ({ value, onChange, label, scaleType = 'distress' }) => {
    const [isMobile, setIsMobile] = useState(true);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const getLabel = (v: number) => {
        if (scaleType === 'positive') {
            // VOC - Validity of Cognition style or Positive Affect
            if (v === 0) return "Neutro";
            if (v <= 2) return "Levemente Positivo";
            if (v <= 4) return "Positivo";
            if (v <= 6) return "Muito Positivo";
            if (v <= 8) return "Excelente";
            return "Extremamente Positivo / Pleno";
        }
        // Distress
        if (v === 0) return "Neutro / Paz";
        if (v <= 2) return "Desconforto Mínimo";
        if (v <= 4) return "Desconforto Leve";
        if (v <= 6) return "Desconforto Moderado";
        if (v <= 8) return "Desconforto Alto";
        return "Desconforto Extremo";
    };

    const getColorClasses = (v: number) => {
        if (scaleType === 'positive') {
            // Low = Gray/Neutral, High = Blue/Green/Vibrant
            if (v === 0) return { bg: 'bg-slate-400', text: 'text-slate-500', border: 'border-slate-400', ring: 'ring-slate-400/30' };
            if (v <= 3) return { bg: 'bg-indigo-300', text: 'text-indigo-500', border: 'border-indigo-300', ring: 'ring-indigo-300/30' };
            if (v <= 7) return { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500', ring: 'ring-blue-500/30' };
            return { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-500', ring: 'ring-emerald-500/30' };
        }

        // Distress: Low = Green, High = Red
        if (v === 0) return { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-500', ring: 'ring-emerald-500/30' };
        if (v <= 3) return { bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-500', ring: 'ring-cyan-500/30' };
        if (v <= 7) return { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-500', ring: 'ring-amber-500/30' };
        return { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', ring: 'ring-rose-600/30' };
    };

    const colors = getColorClasses(value);

    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        {label || "SUD (Nível de Perturbação)"}
                    </h3>
                    <p className={`text-lg font-bold mt-1 transition-colors ${colors.text} dark:${colors.text}`}>
                        {value} - {getLabel(value)}
                    </p>
                </div>
                {!isMobile && (
                    <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-600">
                            {scaleType === 'positive'
                                ? "0 = Neutro | 10 = Totalmente Positivo"
                                : "0 = Sem Queixa | 10 = O Pior Possível"}
                        </span>
                    </div>
                )}
            </div>

            {isMobile ? (
                <div>
                    <div className="flex gap-4 items-center">
                        <div className="relative flex-1">
                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={value}
                                onChange={(e) => onChange(Number(e.target.value))}
                                className={`w-full h-3 rounded-lg appearance-none cursor-pointer transition-all
                  bg-gradient-to-r ${scaleType === 'positive' ? 'from-slate-200 via-blue-200 to-emerald-200' : 'from-emerald-200 via-amber-200 to-rose-200'}
                  dark:${scaleType === 'positive' ? 'from-slate-900/30 via-blue-900/30 to-emerald-900/30' : 'from-emerald-900/30 via-amber-900/30 to-rose-900/30'}
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-8
                  [&::-webkit-slider-thumb]:h-8
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:ring-4
                  [&::-webkit-slider-thumb]:${colors.ring}
                  [&::-webkit-slider-thumb]:border-4
                  [&::-webkit-slider-thumb]:${colors.border}
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:transition-all
                  [&::-webkit-slider-thumb]:hover:scale-110
                `}
                            />
                            <div className="flex justify-between mt-2 px-1">
                                {[0, 2, 4, 6, 8, 10].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => onChange(num)}
                                        className={`text-xs font-bold transition-all ${value === num
                                            ? `${colors.text} scale-125`
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={`flex-shrink-0 w-20 h-20 rounded-2xl ${colors.bg} text-white flex items-center justify-center shadow-lg ring-4 ${colors.ring}`}>
                            <span className="text-3xl font-bold">{value}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-11 gap-1 mt-5">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                            const btnColors = getColorClasses(num);
                            return (
                                <button
                                    key={num}
                                    onClick={() => onChange(num)}
                                    className={`h-9 rounded-lg text-xs font-bold transition-all ${value === num
                                        ? `${btnColors.bg} text-white shadow-md scale-110`
                                        : 'bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700'
                                        }`}
                                >
                                    {num}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-700 -translate-y-1/2 rounded-full -z-0"></div>
                    <div className="flex justify-between items-center gap-2 relative z-10">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                            const isActive = value === num;
                            const isLower = num < value;
                            const btnColors = getColorClasses(num);

                            return (
                                <button
                                    key={num}
                                    onClick={() => onChange(num)}
                                    className={`
                    relative flex flex-col items-center justify-center transition-all duration-300 group
                    ${isActive ? 'flex-1 scale-110' : 'w-10 hover:scale-105'}
                  `}
                                >
                                    <div className={`
                    w-10 h-14 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm transition-all
                    ${isActive
                                            ? `${btnColors.bg} text-white shadow-lg ring-4 ${btnColors.ring} -translate-y-2`
                                            : `bg-white dark:bg-slate-800 border-2 ${isLower ? 'border-primary-100 dark:border-slate-700/50 text-slate-400' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400'} hover:border-primary-300 dark:hover:border-primary-700 hover:-translate-y-1`
                                        }
                  `}>
                                        {num}
                                    </div>
                                    {isActive && <div className={`absolute -bottom-2 w-1 h-1 rounded-full ${btnColors.bg}`}></div>}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
