import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TourStep {
  /** ID do elemento DOM a ser destacado. Se omitido, exibe modal centralizado. */
  target?: string;
  /** Título do passo */
  title: string;
  /** Descrição / corpo do tooltip */
  description: string;
  /** Ícone opcional (ReactNode) renderizado acima do título */
  icon?: React.ReactNode;
  /** Posição preferida do tooltip em desktop (default: 'bottom') */
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface InteractiveTourProps {
  steps: TourStep[];
  activeStepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const HIGHLIGHT_PADDING = 8; // px de padding ao redor do elemento destacado
const TOOLTIP_WIDTH = 340;   // largura fixa do tooltip em desktop (px)
const TOOLTIP_GAP = 16;      // gap entre o highlight e o tooltip (px)

// ─── Helpers de posição ───────────────────────────────────────────────────────

function calcTooltipStyle(
  rect: TargetRect,
  placement: TourStep['placement'] = 'bottom',
  ww: number,
  wh: number,
): React.CSSProperties {
  const p = HIGHLIGHT_PADDING;
  const g = TOOLTIP_GAP;
  const tw = TOOLTIP_WIDTH;

  // Caixa do highlight
  const hTop  = rect.top  - p;
  const hLeft = rect.left - p;
  const hW    = rect.width  + p * 2;
  const hH    = rect.height + p * 2;

  let top: number | undefined;
  let left: number | undefined;
  let bottom: number | undefined;
  let right: number | undefined;

  switch (placement) {
    case 'top':
      bottom = wh - hTop + g;
      left   = Math.min(Math.max(hLeft + hW / 2 - tw / 2, 12), ww - tw - 12);
      break;
    case 'left':
      top  = Math.min(Math.max(hTop, 12), wh - 300);
      right = ww - hLeft + g;
      break;
    case 'right':
      top  = Math.min(Math.max(hTop, 12), wh - 300);
      left = hLeft + hW + g;
      break;
    case 'bottom':
    default:
      top  = hTop + hH + g;
      left = Math.min(Math.max(hLeft + hW / 2 - tw / 2, 12), ww - tw - 12);
      break;
  }

  return {
    position: 'fixed',
    width: tw,
    ...(top    !== undefined ? { top }    : {}),
    ...(bottom !== undefined ? { bottom } : {}),
    ...(left   !== undefined ? { left }   : {}),
    ...(right  !== undefined ? { right }  : {}),
  };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export const InteractiveTour: React.FC<InteractiveTourProps> = ({
  steps,
  activeStepIndex,
  onNext,
  onPrev,
  onSkip,
  onFinish,
}) => {
  const step = steps[activeStepIndex];
  const isLastStep = activeStepIndex === steps.length - 1;

  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [windowSize, setWindowSize] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth  : 1024,
    h: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const isMobile = windowSize.w < 768;
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Atualiza rect com guard contra infinite loop ─────────────────────────
  const updatePosition = useCallback(() => {
    // Atualiza tamanho da janela somente se mudou
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    setWindowSize(prev =>
      prev.w === ww && prev.h === wh ? prev : { w: ww, h: wh },
    );

    if (!step?.target) {
      setTargetRect(null);
      return;
    }

    const el = document.getElementById(step.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();

    // Infinite loop guard: só atualiza se mudou > 1px
    setTargetRect(prev => {
      if (
        prev &&
        Math.abs(prev.top    - rect.top)    < 1 &&
        Math.abs(prev.left   - rect.left)   < 1 &&
        prev.width  === rect.width &&
        prev.height === rect.height
      ) {
        return prev; // referência estável → React não re-renderiza
      }
      return {
        top:    rect.top,
        left:   rect.left,
        width:  rect.width,
        height: rect.height,
      };
    });
  }, [step]);

  // ── Scroll + focus no elemento alvo com retry ─────────────────────────────
  useEffect(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    const attemptFocus = (retries = 3) => {
      if (!step?.target) {
        updatePosition();
        return;
      }

      const el = document.getElementById(step.target);
      if (el) {
        updatePosition();
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {
          el.scrollIntoView();
        }
        // Atualiza rect após a animação de scroll terminar
        retryTimerRef.current = setTimeout(updatePosition, 400);
      } else if (retries > 0) {
        retryTimerRef.current = setTimeout(() => attemptFocus(retries - 1), 100);
      }
    };

    attemptFocus();

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [activeStepIndex, step, updatePosition]);

  // ── Listeners de resize / scroll ──────────────────────────────────────────
  useEffect(() => {
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition]);

  // ── Fechar com Escape ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
      if (e.key === 'ArrowRight' && !isLastStep) onNext();
      if (e.key === 'ArrowLeft' && activeStepIndex > 0) onPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onSkip, onNext, onPrev, isLastStep, activeStepIndex]);

  if (!step) return null;

  // ── Calcula geometria do highlight ────────────────────────────────────────
  const hasTarget = !!step.target && !!targetRect;
  const p = HIGHLIGHT_PADDING;

  const highlightStyle: React.CSSProperties = hasTarget
    ? {
        position: 'fixed',
        top:    targetRect!.top  - p,
        left:   targetRect!.left - p,
        width:  targetRect!.width  + p * 2,
        height: targetRect!.height + p * 2,
        borderRadius: 12,
        boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)',
        zIndex: 9998,
        pointerEvents: 'none',
        transition: 'top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease',
      }
    : {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        zIndex: 9998,
        pointerEvents: 'none',
      };

  // ── Calcula posição do tooltip ────────────────────────────────────────────
  let tooltipStyle: React.CSSProperties;

  if (isMobile) {
    // Mobile: ancora na parte inferior da tela, desvinculado do elemento
    tooltipStyle = {
      position: 'fixed',
      left: 12,
      right: 12,
      bottom: 24,
      zIndex: 9999,
    };
  } else if (hasTarget) {
    // Desktop + elemento encontrado: flutua ao lado/abaixo do elemento
    tooltipStyle = {
      ...calcTooltipStyle(targetRect!, step.placement, windowSize.w, windowSize.h),
      zIndex: 9999,
    };
  } else {
    // Desktop + sem alvo: modal centralizado
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: TOOLTIP_WIDTH,
      zIndex: 9999,
    };
  }

  return (
    <>
      {/* ── Overlay / Highlight ── */}
      <div style={highlightStyle} aria-hidden="true" />

      {/* ── Tooltip / Balão ── */}
      <div
        style={tooltipStyle}
        role="dialog"
        aria-modal="true"
        aria-label={`Passo ${activeStepIndex + 1} de ${steps.length}: ${step.title}`}
        className="
          bg-white dark:bg-slate-900
          border border-slate-200 dark:border-slate-700
          rounded-2xl shadow-2xl shadow-slate-900/40
          p-6 animate-tour-in
        "
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Badge de passo */}
            <span className="
              inline-flex items-center gap-1.5
              text-xs font-bold text-primary-600 dark:text-primary-400
              bg-primary-50 dark:bg-primary-900/30
              border border-primary-200 dark:border-primary-800
              px-2.5 py-1 rounded-full
            ">
              <Sparkles size={11} />
              {activeStepIndex + 1} / {steps.length}
            </span>
          </div>

          {/* Botão fechar */}
          <button
            onClick={onSkip}
            aria-label="Pular tour"
            className="
              p-1.5 rounded-lg
              text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
              hover:bg-slate-100 dark:hover:bg-slate-800
              transition-colors shrink-0
            "
          >
            <X size={16} />
          </button>
        </div>

        {/* Ícone personalizado */}
        {step.icon && (
          <div className="mb-3 text-primary-600 dark:text-primary-400">
            {step.icon}
          </div>
        )}

        {/* Título */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">
          {step.title}
        </h3>

        {/* Descrição */}
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          {step.description}
        </p>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full mb-5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${((activeStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between gap-3">
          {/* Botão voltar */}
          <button
            onClick={onPrev}
            disabled={activeStepIndex === 0}
            className="
              flex items-center gap-1.5 text-sm font-medium
              text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-colors px-2 py-1.5 rounded-lg
              hover:bg-slate-100 dark:hover:bg-slate-800
            "
          >
            <ArrowLeft size={14} />
            Anterior
          </button>

          <div className="flex items-center gap-2">
            {/* Skip */}
            <button
              onClick={onSkip}
              className="
                text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                transition-colors px-2 py-1.5 rounded-lg
                hover:bg-slate-100 dark:hover:bg-slate-800
              "
            >
              Pular
            </button>

            {/* Próximo / Concluir */}
            {isLastStep ? (
              <button
                onClick={onFinish}
                className="
                  flex items-center gap-2
                  bg-gradient-to-r from-primary-600 to-primary-500
                  hover:from-primary-700 hover:to-primary-600
                  text-white text-sm font-bold
                  px-5 py-2.5 rounded-xl
                  transition-all duration-200
                  shadow-md shadow-primary-500/30
                  hover:shadow-lg hover:shadow-primary-500/40
                  active:scale-95
                "
              >
                <Sparkles size={14} />
                Começar!
              </button>
            ) : (
              <button
                onClick={onNext}
                className="
                  flex items-center gap-2
                  bg-primary-600 hover:bg-primary-700
                  text-white text-sm font-bold
                  px-5 py-2.5 rounded-xl
                  transition-all duration-200
                  shadow-md shadow-primary-500/20
                  hover:shadow-lg hover:shadow-primary-500/30
                  active:scale-95
                "
              >
                Próximo
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pontos de navegação (dots) — apenas desktop */}
      {!isMobile && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            gap: 6,
          }}
        >
          {steps.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === activeStepIndex
                  ? 'w-6 h-2 bg-primary-500'
                  : 'w-2 h-2 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default InteractiveTour;
