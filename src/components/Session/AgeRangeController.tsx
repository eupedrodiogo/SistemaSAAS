
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    // Valor local do input — suporta texto livre digitado pelo terapeuta
    const [inputValue, setInputValue] = useState(selectedRange);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sincroniza o input quando o range muda via setas (vem de fora)
    useEffect(() => {
        setInputValue(selectedRange);
    }, [selectedRange]);

    const currentIndex = ranges.indexOf(selectedRange);
    const isFirst = currentIndex === 0 || currentIndex === -1; // -1 = valor livre
    const isLast  = currentIndex === ranges.length - 1;

    const handlePrev = () => {
        if (currentIndex > 0) {
            onRangeChange(ranges[currentIndex - 1]);
        } else if (currentIndex === -1) {
            // Volta para o primeiro do array
            onRangeChange(ranges[0]);
        }
    };

    const handleNext = () => {
        if (currentIndex >= 0 && currentIndex < ranges.length - 1) {
            onRangeChange(ranges[currentIndex + 1]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    // Ao perder foco: propaga o valor digitado como faixa etária personalizada
    const handleInputBlur = () => {
        const trimmed = inputValue.trim();
        if (trimmed) {
            onRangeChange(trimmed);
        } else {
            // Se apagou tudo, volta para o selectedRange anterior
            setInputValue(selectedRange);
        }
    };

    // Enter confirma sem precisar clicar fora
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            inputRef.current?.blur();
        }
        if (e.key === 'Escape') {
            setInputValue(selectedRange);
            inputRef.current?.blur();
        }
    };

    return (
        <div className="flex items-center gap-1 bg-slate-900/80 rounded-t-xl px-2 py-1.5">

            {/* Botão PREV */}
            <button
                onClick={handlePrev}
                disabled={isFirst && currentIndex !== -1}
                aria-label="Faixa etária anterior"
                className={`
                    flex items-center justify-center
                    w-11 h-11 rounded-lg shrink-0
                    transition-all duration-150
                    ${(isFirst && currentIndex !== -1)
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white active:scale-95'
                    }
                `}
            >
                <ChevronLeft size={20} strokeWidth={2.5} />
            </button>

            {/* Input editável central — ocupa todo o espaço restante */}
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                aria-label="Faixa etária (editável)"
                title="Clique para digitar uma faixa personalizada ou use as setas"
                className="
                    flex-1 min-h-[44px] px-2
                    bg-transparent border-none outline-none ring-0
                    text-sm font-bold text-white text-center
                    placeholder:text-slate-500
                    hover:bg-slate-700/40 focus:bg-slate-700/60
                    rounded-lg transition-colors duration-150
                    cursor-text select-all
                    [appearance:none]
                "
            />

            {/* Botão NEXT */}
            <button
                onClick={handleNext}
                disabled={isLast}
                aria-label="Próxima faixa etária"
                className={`
                    flex items-center justify-center
                    w-11 h-11 rounded-lg shrink-0
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
    );
};
