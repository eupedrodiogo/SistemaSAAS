import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../Sidebar';
import { AppView, TherapistPlan } from '../../enums';
// import usePlanAccess from '../../hooks/usePlanAccess'; // INLINED
import { PLAN_FEATURES } from '../../config/planConfig';
import UpgradeModal from '../Shared/UpgradeModal';
import MainDashboardView from '../MainDashboardView';
import PatientsList from '../PatientsList';
import CalendarView from '../Calendar';
import SessionView from '../../features/session/components/SessionView';
import FinancialView from '../FinancialView';
import MarketingView from '../MarketingView';
import ReportsView from '../ReportsView';
import SettingsView from '../SettingsView';
import NetworkView from '../NetworkView';
import { Loader2 } from 'lucide-react';
import PasswordSetupModal from '../Auth/PasswordSetupModal';
import AiAssistant from '../AiAssistant';
import SiteBuilder from '../Dashboard/SiteBuilder';
import InteractiveTour from '../Shared/InteractiveTour';
import { useTour } from '../../hooks/useTour';
import MobileBottomNav from '../MobileBottomNav';


import { useTheme } from '../../contexts/ThemeContext';

// INLINED HELPERS
const PLAN_LABELS: Record<TherapistPlan, string> = {
    [TherapistPlan.TRIAL]: 'Trial (7 dias)',
    [TherapistPlan.INICIANTE]: 'Iniciante',
    [TherapistPlan.PROFISSIONAL]: 'Profissional',
    [TherapistPlan.CLINICA]: 'Clínica',
};

function normalizePlan(rawPlan: string): TherapistPlan {
    const planMap: Record<string, TherapistPlan> = {
        'trial': TherapistPlan.TRIAL,
        'iniciante': TherapistPlan.INICIANTE,
        'profissional': TherapistPlan.PROFISSIONAL,
        'clinica': TherapistPlan.CLINICA,
        'free': TherapistPlan.INICIANTE,
        'pro': TherapistPlan.PROFISSIONAL,
        'enterprise': TherapistPlan.CLINICA,
        'price_1ScuH5KPo7EypB7VQ7epTjiW': TherapistPlan.TRIAL,
        'price_1ScuH5KPo7EypB7VnIs6qfbQ': TherapistPlan.INICIANTE,
        'price_1Sd8DXKPo7EypB7VZwytTUEP': TherapistPlan.PROFISSIONAL,
    };
    return planMap[rawPlan.toLowerCase()] || TherapistPlan.TRIAL;
}

const TherapistDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // INLINED HOOK LOGIC
    const useLocalPlanAccess = () => {
        const therapistData = localStorage.getItem('therapist');
        const therapist = therapistData ? JSON.parse(therapistData) : null;
        const rawPlan = therapist?.plan || 'trial';
        const plan = normalizePlan(rawPlan);
        const allowedViews = PLAN_FEATURES[plan] || PLAN_FEATURES[TherapistPlan.TRIAL];

        const hasAccess = (view: AppView): boolean => {
            return allowedViews.includes(view);
        };

        return { hasAccess, plan };
    };

    const { hasAccess } = useLocalPlanAccess();

    const [currentView, setCurrentView] = useState<AppView>(() => {
        const viewParam = searchParams.get('view');
        // Check if the param is a valid AppView value
        if (viewParam && Object.values(AppView).includes(viewParam as AppView)) {
            return viewParam as AppView;
        }
        return AppView.DASHBOARD;
    });

    // Sync state → URL (sentido único, sem escutar searchParams de volta)
    useEffect(() => {
        setSearchParams({ view: currentView }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentView]);

    // Protect against direct URL access to restricted views
    useEffect(() => {
        if (!hasAccess(currentView)) {
            const viewLabels: Record<AppView, string> = {
                [AppView.DASHBOARD]: 'Painel Geral',
                [AppView.AGENDA]: 'Agenda',
                [AppView.PATIENTS]: 'Clientes',
                [AppView.THERAPY]: 'Sessão TeraNexus',
                [AppView.FINANCIAL]: 'Financeiro',
                [AppView.MARKETING]: 'Marketing & CRM',
                [AppView.REPORTS]: 'Relatórios',
                [AppView.SETTINGS]: 'Configurações',
                [AppView.NETWORK]: 'Rede de Transbordo',
                [AppView.SITE_BUILDER]: 'Construtor de Site',
            };
            setUpgradeModal({ isOpen: true, featureName: viewLabels[currentView] });
            setCurrentView(AppView.DASHBOARD); // Redirect to allowed view
        }
    }, [currentView, hasAccess]);

    const location = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
    const [isTherapySessionActive, setIsTherapySessionActive] = useState(false);
    // const [isDarkMode, setIsDarkMode] = useState(false); // Managed by Context
    const { isDarkMode, toggleTheme, themeMode, setThemeMode } = useTheme();

    // Captura o estado de navegação (ex: ao encerrar sessão, fechar o menu lateral)
    useEffect(() => {
        if (location.state && location.state.sidebarCollapsed !== undefined) {
            setIsDesktopCollapsed(location.state.sidebarCollapsed);
            // Limpa o state para não persistir em re-renders
            window.history.replaceState({}, '');
        }
    }, [location.state]);

    const [therapist, setTherapist] = useState<any>(null);
    const [viewParams, setViewParams] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showPasswordSetup, setShowPasswordSetup] = useState(false);
    const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean; featureName?: string }>({ isOpen: false });

    // ── Tour de Onboarding ───────────────────────────────────────
    const {
        isTourActive,
        activeStepIndex,
        steps: tourSteps,
        handleNext,
        handlePrev,
        handleSkip,
        handleFinish,
    } = useTour();

    // Load therapist data and theme
    const { user } = useAuth();

    // Load therapist data and theme
    useEffect(() => {
        const fetchTherapist = async () => {
            try {
                if (!user) return;

                // Fetch Profile
                const { data: profile, error } = await supabase
                    .from('therapists')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching profile:', error);
                }

                if (profile) {
                    setTherapist(profile);
                    localStorage.setItem('therapist', JSON.stringify(profile));
                } else {
                    // Fallback: create minimal profile from auth data
                    // CRITICAL: always save the user.id so api.patients.list() can query correctly
                    const fallbackProfile = {
                        id: user.id,
                        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Terapeuta',
                        email: user.email,
                        phone: user.user_metadata?.phone || '',
                        subscription_status: 'active',
                        plan: 'trial'
                    };
                    setTherapist(fallbackProfile);
                    localStorage.setItem('therapist', JSON.stringify(fallbackProfile));

                    // Try to create the therapist profile if it doesn't exist
                    try {
                        await supabase.from('therapists').upsert({
                            id: user.id,
                            email: user.email,
                            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Terapeuta',
                            plan: 'trial'
                        }, { onConflict: 'id' });
                    } catch (upsertErr) {
                        console.warn('Could not upsert therapist profile:', upsertErr);
                    }
                }

            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchTherapist();
        } else {
            // If accessed directly without auth (should be caught by ProtectedRoute, but safe fallback)
            setIsLoading(true);
        }

        // Check if user needs to set a password (for Magic Link users)
        if (user && user.user_metadata && !user.user_metadata.has_set_password) {
            // Delay slightly to ensure load
            setTimeout(() => setShowPasswordSetup(true), 1000);
        }

        // Theme check -> NOW HANDLED BY CONTEXT
    }, [user]);

    // Cleanup unused functions/vars for now to avoid linter errors
    const handleNavigateToPatient = (id: string) => {
        // This function allows components to switch to the patient view
        // For now, we just switch to the Patients view, but ideally we would pass the ID
        setCurrentView(AppView.PATIENTS);
        // You might need to add a way to pass the selected patient ID to PatientsList
        // For example, using a context or a separate state variable lifted up here
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="animate-spin text-primary-600" size={40} /></div>;
    }



    const handleDashboardChangeView = (view: AppView, params?: any) => {
        setCurrentView(view);
        if (params) setViewParams(params);
    };

    const renderView = () => {
        switch (currentView) {
            case AppView.DASHBOARD:
                return <MainDashboardView onChangeView={handleDashboardChangeView} therapist={therapist} />;
            case AppView.PATIENTS:
                return <PatientsList 
                    onNavigateToSession={() => setCurrentView(AppView.THERAPY)} 
                    onNavigateToAgenda={(patientId, patientName) => {
                        setViewParams({ action: 'create', patientId, patientName });
                        setCurrentView(AppView.AGENDA);
                    }}
                />;
            case AppView.AGENDA:
                return <CalendarView
                    onNavigateToPatient={handleNavigateToPatient}
                    onNavigateToSession={() => setCurrentView(AppView.THERAPY)}
                    initialAction={viewParams?.action}
                    initialPatientId={viewParams?.patientId}
                    initialPatientName={viewParams?.patientName}
                    onActionConsumed={() => setViewParams(null)}
                />;
            case AppView.THERAPY:
                return <SessionView
                    onSessionActiveChange={setIsTherapySessionActive}
                    onNavigateToReports={(patientId) => {
                        setViewParams({ patientId });
                        setCurrentView(AppView.REPORTS);
                    }}
                />;
            case AppView.FINANCIAL:
                return <FinancialView />;
            case AppView.MARKETING:
                return <MarketingView />;
            case AppView.REPORTS:
                return <ReportsView
                    initialPatientId={viewParams?.patientId}
                    onParamsConsumed={() => setViewParams(null)}
                />;
            case AppView.SETTINGS:
                return <SettingsView />;
            case AppView.NETWORK:
                return <NetworkView />;
            case AppView.SITE_BUILDER:
                return <SiteBuilder />;
            default:
                return <MainDashboardView onChangeView={handleDashboardChangeView} />;
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            localStorage.removeItem('therapist');
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className={`flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300`}>
            {/* Sidebar global — ocultada APENAS durante a Sessão ATIVA */}
            {(currentView !== AppView.THERAPY || !isTherapySessionActive) && (
                <Sidebar
                    isMobileOpen={isMobileOpen}
                    toggleMobile={() => setIsMobileOpen(!isMobileOpen)}
                    isDesktopCollapsed={isDesktopCollapsed}
                    toggleDesktop={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                    currentView={currentView}
                    onChangeView={(view) => {
                        setCurrentView(view);
                        setViewParams(null); // Clear params when using the sidebar
                        setIsMobileOpen(false);
                    }}
                    isDarkMode={isDarkMode}
                    toggleTheme={toggleTheme}
                    themeMode={themeMode}
                    setThemeMode={setThemeMode}
                    onLogout={handleLogout}
                    hasAccess={hasAccess}
                />
            )}

            <main className="flex-1 transition-all duration-300 ease-in-out overflow-x-hidden">
                {/* Mobile Header Spacer */}
                {(currentView !== AppView.THERAPY || !isTherapySessionActive) && <div className="md:hidden h-16" />}

                {/* Mobile Header */}
                {(currentView !== AppView.THERAPY || !isTherapySessionActive) && (
                    <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center px-4 z-30">
                        {/* Empty div for flex spacing balance */}
                        <div className="w-8 h-8" />
                        
                        <div className="flex-1 flex items-center justify-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shadow-lg shadow-primary-500/20">
                                <img src="/logo-new.jpg" alt="TeraNexus" className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Tera<span className="text-primary-600">Nexus</span></span>
                        </div>
                        
                        <button onClick={() => setIsMobileOpen(true)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm active:scale-95 transition-transform">
                             <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                {therapist?.name ? therapist.name.substring(0, 2).toUpperCase() : 'TN'}
                             </span>
                        </button>
                    </header>
                )}

                <div className={currentView === AppView.THERAPY ? "w-full h-full md:h-screen" : "p-4 md:p-8 max-w-[1600px] mx-auto pb-24 md:pb-8"}>
                    {renderView()}
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            {(currentView !== AppView.THERAPY || !isTherapySessionActive) && (
                <MobileBottomNav 
                    currentView={currentView}
                    onChangeView={(view) => {
                        setCurrentView(view);
                        setViewParams(null);
                    }}
                    onOpenMore={() => setIsMobileOpen(!isMobileOpen)}
                    isMoreOpen={isMobileOpen}
                    hasAccess={hasAccess}
                />
            )}

            {/* Mobile Overlay */}
            {isMobileOpen && (currentView !== AppView.THERAPY || !isTherapySessionActive) && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <PasswordSetupModal
                isOpen={showPasswordSetup}
                onSuccess={() => setShowPasswordSetup(false)}
            />

            <AiAssistant currentView={currentView} />

            <UpgradeModal
                isOpen={upgradeModal.isOpen}
                onClose={() => setUpgradeModal({ isOpen: false })}
                featureName={upgradeModal.featureName}
            />

            {/* ── Tour de Onboarding (primeiro login) ── */}
            {isTourActive && (
                <InteractiveTour
                    steps={tourSteps}
                    activeStepIndex={activeStepIndex}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onSkip={handleSkip}
                    onFinish={handleFinish}
                />
            )}
        </div>
    );
};

export default TherapistDashboard;
