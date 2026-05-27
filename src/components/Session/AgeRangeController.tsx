
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface AgeRangeControllerProps {
    ranges: string[];
    selectedRange: string;
    onRangeChange: (range: string) => void;
}

export const AgeRangeController: React.FC<AgeRangeControllerProps> = ({
    ranges,
    selectedRange,
    onRangeChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentIndex = ranges.indexOf(selectedRange);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === ranges.length - 1;

    const handlePrev = () => {
        if (!isFirst) onRangeChange(ranges[currentIndex - 1]);
    };

    const handleNext = () => {
        if (!isLast) onRangeChange(ranges[currentIndex + 1]);
    };

    const handleSelect = (range: string) => {
        onRangeChange(range);
        setIsOpen(false);
    };

    // Fecha o dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        // Wrapper relativo para ancorar o dropdown
        <div ref={containerRef} className="relative">
            {/* Barra de controle — flex row, itens alinhados ao centro */}
            <div className="flex items-center gap-1 bg-slate-900/80 rounded-t-xl px-2 py-1.5">

                {/* Botão PREV — área de toque mínima 44x44 */}
                <button
                    onClick={handlePrev}
                    disabled={isFirst}
                    aria-label="Faixa etária anterior"
                    className={`
                        flex items-center justify-center
                        w-11 h-11 rounded-lg
                        transition-all duration-150
                        ${isFirst
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white active:scale-95'
                        }
                    `}
                >
                    <ChevronLeft size={20} strokeWidth={2.5} />
                </button>

                {/* Texto central clicável — ocupa o espaço restante */}
                <button
                    onClick={() => setIsOpen((v) => !v)}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    className="
                        flex-1 flex items-center justify-center gap-1.5
                        min-h-[44px] px-2
                        text-sm font-bold text-white
                        rounded-lg transition-all duration-150
                        hover:bg-slate-700 active:scale-[0.98]
                        select-none
                    "
                >
                    <span className="truncate">{selectedRange}</span>
                    <ChevronDown
                        size={15}
                        strokeWidth={2.5}
                        className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Botão NEXT */}
                <button
                    onClick={handleNext}
                    disabled={isLast}
                    aria-label="Próxima faixa etária"
                    className={`
                        flex items-center justify-center
                        w-11 h-11 rounded-lg
                        transition-all duration-150
                        ${isLast
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white active:scale-95'
                        }
                    `}
                >
                    <ChevronRight size={20} strokeWidth={2.5} />
                </button>
            </div>

            {/*
             * Dropdown da lista de faixas etárias.
             *
             * Estratégia responsiva:
             * — Mobile (< sm): posição fixed centralizado na tela, largura quase total
             *   → evita ser cortado pelas bordas.
             * — Desktop (sm+): posição absolute abaixo do controlador, largura mínima
             *   do próprio elemento.
             *
             * Implementado com classes Tailwind usando o breakpoint `sm`:
             *   fixed / sm:absolute  →  posicionamento muda conforme viewport
             *   inset-x-4 / sm:inset-x-auto  →  margem horizontal em mobile
             *   top-[auto] / sm:top-full  →  ancoragem vertical
             *   bottom-20 / sm:bottom-auto  →  sobe em mobile para não sumir atrás do teclado
             */}
            {isOpen && (
                <ul
                    role="listbox"
                    aria-label="Selecionar faixa etária"
                    className="
                        z-50 overflow-hidden
                        rounded-xl border border-slate-700 bg-slate-800 shadow-2xl shadow-black/40
                        py-1

                        /* Mobile: fixo na tela, centralizado */
                        fixed bottom-24 left-4 right-4

                        /* Desktop (sm+): absoluto ancorado abaixo do controle */
                        sm:absolute sm:bottom-auto sm:left-0 sm:right-0 sm:top-full sm:mt-1
                    "
                >
                    {ranges.map((range) => {
                        const isSelected = range === selectedRange;
                        return (
                            <li key={range}>
                                <button
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => handleSelect(range)}
                                    className={`
                                        w-full text-left px-4 py-3 text-sm font-semibold
                                        transition-colors duration-100
                                        ${isSelected
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                        }
                                    `}
                                >
                                    {range}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
