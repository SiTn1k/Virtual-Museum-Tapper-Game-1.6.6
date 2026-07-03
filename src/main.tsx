import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App.tsx';
import './index.css';

// Initialize Sentry only if DSN is available
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
  });
}

// Custom error fallback with better error display
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div style={{
      padding: '20px',
      textAlign: 'center',
      background: '#1a1a2e',
      color: '#ffffff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>❌ Сталася помилка</h1>
      <p style={{ color: '#888', marginBottom: '20px' }}>Спробуйте перезапустити додаток</p>
      <details style={{ 
        background: '#2a2a3e', 
        padding: '16px', 
        borderRadius: '8px', 
        maxWidth: '500px',
        textAlign: 'left',
        marginBottom: '20px'
      }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
          Деталі помилки (для розробників)
        </summary>
        <pre style={{ 
          fontSize: '12px', 
          overflow: 'auto', 
          color: '#ef4444',
          wordBreak: 'break-all'
        }}>
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
      </details>
      <button
        onClick={resetError}
        style={{
          background: '#fbbf24',
          color: '#000',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Перезапустити
      </button>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
);
