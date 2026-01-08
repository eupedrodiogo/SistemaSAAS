import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#ef4444',background:'#0f172a'}}>Falha ao inicializar o aplicativo. Recarregue a página.</div>}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

window.addEventListener('error', () => {
  // noop: ErrorBoundary above will render fallback
});
window.addEventListener('unhandledrejection', () => {
  // noop: ErrorBoundary above will render fallback
});
