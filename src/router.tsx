import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';

// Layouts
import { RootLayout } from './layouts/RootLayout';
import { ProtectedLayout } from './layouts/ProtectedLayout';

// Components (Synchronous)
import BetaLandingPage from './components/BetaLandingPage';
import BetaLandingPageV2 from './components/BetaLandingPageV2';
import AdsLandingPage from './components/AdsLandingPage';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import ForgotPasswordPage from './components/Auth/ForgotPasswordPage';
import UpdatePasswordPage from './components/Auth/UpdatePasswordPage';
import PaymentSuccess from './components/PaymentSuccess';
import PatientLandingPage from './components/PatientBooking/PatientLandingPage';
import { ClientProvider } from './components/ClientPortal/ClientContext';

// Lazy loaded components
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

// Admin
const SystemTest = React.lazy(() => import('./components/Admin/SystemTest'));

import { useTheme } from './contexts/ThemeContext';

// This wrapper injects window.location to simulate onLoginClick
const BetaLandingWrapper = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  return <BetaLandingPage onLoginClick={() => window.location.href = '/login'} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
};

const PatientLandingWrapper = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  return <PatientLandingPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <BetaLandingWrapper /> },
      { path: 'beta-v2', element: <BetaLandingPageV2 /> },
      { path: 'lp', element: <AdsLandingPage /> },
      { path: 'success', element: <PaymentSuccess /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'update-password', element: <UpdatePasswordPage /> },
      { path: 'register', element: <RegisterPage /> },
      
      { path: 'agendar', element: <BookingWizard /> },
      { path: 'agendar/:step', element: <BookingWizard /> },
      { path: 'agendar/u/:therapistId', element: <BookingWizard /> },
      
      { path: 't/:therapistId', element: <TherapistPersonalPage /> },
      { path: 'convite-anjo/:therapistId', element: <AnjoInvitationPage /> },
      { path: 'cliente', element: <PatientLandingWrapper /> },
      
      {
        path: 'ajuda',
        element: <ValidatorLayout />,
        children: [
          { index: true, element: <ValidatorLanding /> },
          { path: 'pesquisa', element: <ValidatorSurvey /> },
          { path: 'resultados', element: <ValidatorDashboard /> },
        ]
      },
      
      { path: 'system-test', element: <SystemTest /> },
      
      // Client Portal Routes
      { path: 'sessao-cliente', element: <ClientProvider><ClientSessionView /></ClientProvider> },
      { path: 'sessao-cliente/:id', element: <ClientProvider><ClientSessionView /></ClientProvider> },
      
      { path: 'portal-paciente/login', element: <ClientProvider><ClientLogin /></ClientProvider> },
      { path: 'portal-paciente/cadastro', element: <ClientProvider><ClientRegister /></ClientProvider> },
      { path: 'portal-paciente/autenticar', element: <ClientProvider><ClientAuthHandler /></ClientProvider> },
      { path: 'portal-paciente/autenticar/:id', element: <ClientProvider><ClientAuthHandler /></ClientProvider> },
      
      {
        path: 'portal-paciente',
        element: <ClientProvider><Outlet /></ClientProvider>,
        children: [
          { index: true, element: <ClientDashboard /> },
          { path: 'dashboard', element: <ClientDashboard /> },
          { path: 'anamnese', element: <ClientAnamnesis /> },
          { path: 'agendamentos', element: <ClientAppointments /> },
          { path: 'recursos', element: <ClientResources /> },
          { path: 'gravacoes', element: <ClientRecordings /> },
          { path: 'perfil', element: <ClientProfile /> },
        ]
      },

      // Protected Therapist Routes
      {
        element: <ProtectedLayout />,
        children: [
          { path: 'dashboard', element: <TherapistDashboard /> },
          // Add other protected routes here
        ]
      },

      // Fallback
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
]);
