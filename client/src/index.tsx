import React from 'react';
import { createRoot } from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';

import RoutesComponent from "./app.tsx";
import './index.css';

const CLIENT_BASE_PATH = process.env.CLIENT_BASE_PATH || '/';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-destructive">出错了</h2>
        <p className="text-muted-foreground text-sm">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm"
        >
          重试
        </button>
      </div>
    </div>
  );
}

const MainApp = () => {
  return (
    <BrowserRouter basename={CLIENT_BASE_PATH}>
      <ErrorBoundary fallbackRender={ErrorFallback}>
        <RoutesComponent />
        <Toaster position="top-center" richColors />
      </ErrorBoundary>
    </BrowserRouter>
  );
};

createRoot(document.getElementById("root")!).render(<MainApp />);
