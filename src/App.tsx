import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/react-query';
import { Toaster } from 'sonner';


// Components
// Componentes essenciais e leves (Carregamento Síncrono)
import { getSubdomain } from './utils/subdomain';
import UpdateNotification from './components/UpdateNotification';
import InstallPrompt from './components/InstallPrompt';
import BetaLandingPage from './components/BetaLandingPage';
import BetaLandingPageV2 from './components/BetaLandingPageV2';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import ForgotPasswordPage from './components/Auth/ForgotPasswordPage';
import UpdatePasswordPage from './components/Auth/UpdatePasswordPage';
import PaymentSuccess from './components/PaymentSuccess';
import { ClientProvider } from './components/ClientPortal/ClientContext';
import PatientLandingPage from './components/PatientBooking/PatientLandingPage';

// Componentes pesados de Dashboard e Fluxos (Carregamento Assíncrono - Lazy Loading)
const TherapistDashboard = React.lazy(() => import('./components/TherapistDashboard/TherapistDashboard'));
const BookingWizard = React.lazy(() => import('./components/PatientBooking/BookingWizard'));
const TherapistPersonalPage = React.lazy(() => import('./components/PatientBooking/TherapistPersonalPage'));
const AnjoInvitationPage = React.lazy(() => import('./components/PatientBooking/AnjoInvitationPage'));
const ClientSessionView = React.lazy(() => import('./components/ClientSession/ClientSessionView'));

// Client Portal (Lazy)
const ClientLogin = React.lazy(() => import('./components/ClientPortal/ClientLogin'));
const ClientAuthHandler = React.lazy(() => import('./components/ClientPortal/ClientAuthHandler'));
const ClientDashboard = React.lazy(() => import('./components/ClientPortal/ClientDashboard'));
const ClientAppointments = React.lazy(() => import('./components/ClientPortal/ClientAppointments'));
const ClientResources = React.lazy(() => import('./components/ClientPortal/ClientResources'));
const ClientRecordings = React.lazy(() => import('./components/ClientPortal/ClientRecordings'));
const ClientProfile = React.lazy(() => import('./components/ClientPortal/ClientProfile'));
const ClientRegister = React.lazy(() => import('./components/ClientPortal/ClientRegister'));
const ClientAnamnesis = React.lazy(() => import('./components/ClientPortal/ClientAnamnesis'));

// Validation Module (Lazy)
const ValidatorLayout = React.lazy(() => import('./components/Validator/ValidatorLayout'));
const ValidatorLanding = React.lazy(() => import('./components/Validator/ValidatorLanding'));
const ValidatorSurvey = React.lazy(() => import('./components/Validator/ValidatorSurvey'));
const ValidatorDashboard = React.lazy(() => import('./components/Validator/ValidatorDashboard'));

// Admin (Lazy)
const SystemTest = React.lazy(() => import('./components/Admin/SystemTest'));

// Protected Route Component
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute: Check', { user: user?.email, loading });

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Note: isRecoveryFlow will be handled inside AppContent via onAuthStateChange


function AppContent() {
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const subdomain = getSubdomain();

  if (subdomain) {
    return <TherapistPersonalPage directId={subdomain} />;
  }

  useEffect(() => {
    // No recovery logic needed.
    return () => { };
  }, [location.pathname, navigate]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <UpdateNotification />
      {/* Theme Toggle - Floating Removed (Duplicate) */}

      <InstallPrompt />
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div>}>
        <Routes>
          {/* Public Routes */}
          {/* Pass global theme context down to LandingPage if needed, or update LandingPage to use context too. For now passing props to maintain compatibility. */}
          {/* Using Beta Landing Page for Launch */}
          <Route path="/" element={<BetaLandingPage onLoginClick={() => window.location.href = '/login'} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
          <Route path="/beta-v2" element={<BetaLandingPageV2 />} />
          <Route path="/success" element={<PaymentSuccess />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/agendar" element={<BookingWizard />} />
          <Route path="/agendar/:step" element={<BookingWizard />} />
          <Route path="/agendar/u/:therapistId" element={<BookingWizard />} />
          <Route path="/t/:therapistId" element={<TherapistPersonalPage />} />
          <Route path="/convite-anjo/:therapistId" element={<AnjoInvitationPage />} />
          <Route path="/cliente" element={<PatientLandingPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />

          {/* Validation Module (Stealth Mode) */}
          <Route path="/ajuda" element={<ValidatorLayout />}>
            <Route index element={<ValidatorLanding />} />
            <Route path="pesquisa" element={<ValidatorSurvey />} />
            <Route path="resultados" element={<ValidatorDashboard />} />
          </Route>

          {/* System Test Tool */}
          <Route path="/system-test" element={<SystemTest />} />

          {/* Client Portal Routes */}
          <Route path="/sessao-cliente" element={<ClientProvider><ClientSessionView /></ClientProvider>} />
          <Route path="/sessao-cliente/:id" element={<ClientProvider><ClientSessionView /></ClientProvider>} />

          <Route path="/portal-paciente/login" element={<ClientProvider><ClientLogin /></ClientProvider>} />
          <Route path="/portal-paciente/cadastro" element={<ClientProvider><ClientRegister /></ClientProvider>} />
          <Route path="/portal-paciente/autenticar" element={<ClientProvider><ClientAuthHandler /></ClientProvider>} />
          <Route path="/portal-paciente/autenticar/:id" element={<ClientProvider><ClientAuthHandler /></ClientProvider>} />

          {/* Client Portal Protected Area (Simulated for now, should be real protected route later) */}
          <Route path="/portal-paciente" element={<ClientProvider><Outlet /></ClientProvider>}>
            <Route index element={<ClientDashboard />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="anamnese" element={<ClientAnamnesis />} />
            <Route path="agendamentos" element={<ClientAppointments />} />
            <Route path="recursos" element={<ClientResources />} />
            <Route path="gravacoes" element={<ClientRecordings />} />
            <Route path="perfil" element={<ClientProfile />} />
          </Route>

          {/* Protected Therapist Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<TherapistDashboard />} />
            {/* Add more protected routes here */}
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
              classNames: {
                toast: 'font-sans text-sm',
              },
            }}
          />
        </ThemeProvider>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
