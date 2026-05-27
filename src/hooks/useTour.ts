import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { TourStep } from '../components/Shared/InteractiveTour';
import {
  LayoutDashboard,
  Calendar,
  Users,
  BrainCircuit,
  Wallet,
  Sparkles,
} from 'lucide-react';
import React from 'react';

// ─── Chave local para fallback offline ───────────────────────────────────────
const TOUR_SEEN_KEY = 'teranexus_tour_seen_v1';

// ─── Passos do Tour ───────────────────────────────────────────────────────────
//
// IMPORTANTE: os `target` IDs devem existir nos componentes da Sidebar/Dashboard.
// Adicione `id="tour-*"` nos elementos correspondentes se ainda não existirem.
//
export const TOUR_STEPS: TourStep[] = [
  {
    // Sem target → modal centralizado de boas-vindas
    title: 'Bem-vindo ao TeraNexus! 🎉',
    description:
      'Ficamos felizes em ter você aqui. Em menos de 2 minutos vamos te mostrar as funcionalidades que vão transformar o seu consultório. Vamos lá?',
    icon: React.createElement(Sparkles, { size: 28 }),
  },
  {
    target: 'tour-sidebar-dashboard',
    title: 'Painel Geral',
    description:
      'Aqui está a sua central de controle. Veja métricas de sessões, faturamento e os próximos agendamentos em um só lugar.',
    icon: React.createElement(LayoutDashboard, { size: 24 }),
    placement: 'right',
  },
  {
    target: 'tour-sidebar-agenda',
    title: 'Agenda Inteligente',
    description:
      'Gerencie suas sessões, bloqueios e disponibilidade. Seus pacientes podem agendar online pelo link exclusivo que você compartilha.',
    icon: React.createElement(Calendar, { size: 24 }),
    placement: 'right',
  },
  {
    target: 'tour-sidebar-patients',
    title: 'Gestão de Clientes',
    description:
      'Cadastre pacientes, registre evoluções, organize documentos e acompanhe o histórico completo de cada pessoa com segurança.',
    icon: React.createElement(Users, { size: 24 }),
    placement: 'right',
  },
  {
    target: 'tour-sidebar-therapy',
    title: 'Sessão TeraNexus',
    description:
      'O diferencial da plataforma: conduza sessões online com recursos de videochamada integrada, anotações em tempo real e IA assistente.',
    icon: React.createElement(BrainCircuit, { size: 24 }),
    placement: 'right',
  },
  {
    target: 'tour-sidebar-financial',
    title: 'Controle Financeiro',
    description:
      'Registre pagamentos, emita cobranças via Pix ou cartão e acompanhe o faturamento do seu consultório sem complicação.',
    icon: React.createElement(Wallet, { size: 24 }),
    placement: 'right',
  },
  {
    // Sem target → modal centralizado de conclusão
    title: 'Você está pronto! 🚀',
    description:
      'Agora é com você! Comece adicionando seu primeiro paciente ou configurando sua agenda. Qualquer dúvida, use o assistente de IA no canto inferior direito.',
    icon: React.createElement(Sparkles, { size: 28 }),
  },
];

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseTourReturn {
  isTourActive: boolean;
  activeStepIndex: number;
  steps: TourStep[];
  handleNext: () => void;
  handlePrev: () => void;
  handleSkip: () => void;
  handleFinish: () => void;
  startTour: () => void; // Para reabrir manualmente
}

export function useTour(): UseTourReturn {
  const { user } = useAuth();
  const [isTourActive, setIsTourActive] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // ── Detecta primeiro login ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const checkFirstLogin = async () => {
      // 1. Verifica localStorage primeiro (evita flash)
      const seenLocally = localStorage.getItem(TOUR_SEEN_KEY);
      if (seenLocally === user.id) return;

      try {
        // 2. Verifica na tabela therapists (coluna `onboarding_completed`)
        const { data, error } = await supabase
          .from('therapists')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (error || data?.onboarding_completed) {
          // Já fez onboarding → marca local e sai
          localStorage.setItem(TOUR_SEEN_KEY, user.id);
          return;
        }

        // 3. É o primeiro login → inicia o tour
        // Pequeno delay para a UI terminar de renderizar
        setTimeout(() => setIsTourActive(true), 800);
      } catch {
        // Fallback: se Supabase falhar, confia no localStorage
        localStorage.setItem(TOUR_SEEN_KEY, user.id);
      }
    };

    checkFirstLogin();
  }, [user]);

  // ── Marca onboarding como concluído (Supabase + localStorage) ────────────
  const markCompleted = useCallback(async () => {
    if (!user) return;

    localStorage.setItem(TOUR_SEEN_KEY, user.id);

    try {
      await supabase
        .from('therapists')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
    } catch (err) {
      console.warn('[Tour] Não foi possível salvar onboarding_completed:', err);
    }
  }, [user]);

  // ── Handlers de navegação ─────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    setActiveStepIndex(prev => Math.min(prev + 1, TOUR_STEPS.length - 1));
  }, []);

  const handlePrev = useCallback(() => {
    setActiveStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const handleSkip = useCallback(async () => {
    setIsTourActive(false);
    setActiveStepIndex(0);
    await markCompleted();
  }, [markCompleted]);

  const handleFinish = useCallback(async () => {
    setIsTourActive(false);
    setActiveStepIndex(0);
    await markCompleted();
  }, [markCompleted]);

  const startTour = useCallback(() => {
    setActiveStepIndex(0);
    setIsTourActive(true);
  }, []);

  return {
    isTourActive,
    activeStepIndex,
    steps: TOUR_STEPS,
    handleNext,
    handlePrev,
    handleSkip,
    handleFinish,
    startTour,
  };
}
