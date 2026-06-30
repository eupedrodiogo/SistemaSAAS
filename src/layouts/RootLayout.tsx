import React from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getSubdomain } from '../utils/subdomain';
import UpdateNotification from '../components/UpdateNotification';
import InstallPrompt from '../components/InstallPrompt';

const TherapistPersonalPage = React.lazy(() => import('../components/PatientBooking/TherapistPersonalPage'));

export function RootLayout() {
  const { isDarkMode } = useTheme();
  const subdomain = getSubdomain();

  // Se houver subdomínio, renderiza a página do terapeuta diretamente,
  // ignorando o roteamento padrão do sistema.
  if (subdomain) {
    return (
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div>}>
        <TherapistPersonalPage directId={subdomain} />
      </React.Suspense>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <UpdateNotification />
      <InstallPrompt />
      <ScrollRestoration />
      
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div>}>
        <Outlet />
      </React.Suspense>
    </div>
  );
}
