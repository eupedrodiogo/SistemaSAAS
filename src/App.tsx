import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
// Auth Context is now Firebase only

// Components
import BookingWizard from './components/PatientBooking/BookingWizard';
import TherapistPersonalPage from './components/PatientBooking/TherapistPersonalPage';
import PatientLandingPage from './components/PatientBooking/PatientLandingPage';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import TherapistDashboard from './components/TherapistDashboard/TherapistDashboard';
// import LandingPage from './components/LandingPage'; // Using Beta Landing Page now
import BetaLandingPage from './components/BetaLandingPage';
import BetaLandingPageV2 from './components/BetaLandingPageV2';
import InstallPrompt from './components/InstallPrompt';
import PaymentSuccess from './components/PaymentSuccess';
import ClientSessionView from './components/ClientSession/ClientSessionView';
import { ClientProvider } from './components/ClientPortal/ClientContext';
import ClientLogin from './components/ClientPortal/ClientLogin';
import ClientAuthHandler from './components/ClientPortal/ClientAuthHandler';
import ClientDashboard from './components/ClientPortal/ClientDashboard';
import ClientAppointments from './components/ClientPortal/ClientAppointments';
import ClientResources from './components/ClientPortal/ClientResources';
import ClientRecordings from './components/ClientPortal/ClientRecordings';
import ClientProfile from './components/ClientPortal/ClientProfile';
import ClientRegister from './components/ClientPortal/ClientRegister';
import ValidatorLayout from './components/Validator/ValidatorLayout';
import ValidatorLanding from './components/Validator/ValidatorLanding';
import ValidatorSurvey from './components/Validator/ValidatorSurvey';
import ValidatorDashboard from './components/Validator/ValidatorDashboard';
import ForgotPasswordPage from './components/Auth/ForgotPasswordPage';
import UpdatePasswordPage from './components/Auth/UpdatePasswordPage';
import SystemTest from './components/Admin/SystemTest';
import { getSubdomain } from './utils/subdomain';
import UpdateNotification from './components/UpdateNotification';

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
    // Recovery logic for Firebase can be added later if needed.
    // Supabase recovery logic removed as project is migrated.
    return () => { };
  }, [location, navigate]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <UpdateNotification />
      {/* Theme Toggle - Floating Removed (Duplicate) */}

      <InstallPrompt />
      <Routes>
        {/* Public Routes */}
        {/* Pass global theme context down to LandingPage if needed, or update LandingPage to use context too. For now passing props to maintain compatibility. */}
        {/* Using Beta Landing Page for Launch */}
        <Route path="/" element={<BetaLandingPage onLoginClick={() => window.location.href = '/login'} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
        <Route path="/beta-v2" element={<BetaLandingPageV2 onLoginClick={() => window.location.href = '/login'} />} />
        <Route path="/success" element={<PaymentSuccess />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/agendar" element={<BookingWizard />} />
        <Route path="/agendar/:step" element={<BookingWizard />} />
        <Route path="/agendar/u/:therapistId" element={<BookingWizard />} />
        <Route path="/t/:therapistId" element={<TherapistPersonalPage />} />
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
    </div>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
