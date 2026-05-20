import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((options) => {
    if (!options) return;
    const { type = 'info', title, message, duration = 3000 } = options;
    if (!message) return;

    const id = `${Date.now()}-${toastIdCounter++}`;

    setToasts((prev) => [
      ...prev,
      {
        id,
        type,
        title,
        message,
      },
    ]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const value = {
    showToast,
  };

  const renderIcon = (type) => {
    if (type === 'success') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
    if (type === 'error') {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    if (type === 'warning') {
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
    return <Info className="w-4 h-4 text-blue-500" />;
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          const borderColor = isSuccess
            ? 'border-emerald-500'
            : isError
            ? 'border-red-500'
            : isWarning
            ? 'border-amber-500'
            : 'border-blue-500';

          const bgColor = isSuccess
            ? 'bg-emerald-50'
            : isError
            ? 'bg-red-50'
            : isWarning
            ? 'bg-amber-50'
            : 'bg-blue-50';

          const textColor = isSuccess
            ? 'text-emerald-900'
            : isError
            ? 'text-red-900'
            : isWarning
            ? 'text-amber-900'
            : 'text-blue-900';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border-l-4 ${borderColor} ${bgColor} ${textColor} animate-in fade-in slide-in-from-bottom-2`}
            >
              <div className="mt-0.5">{renderIcon(toast.type)}</div>
              <div className="flex-1">
                {toast.title && (
                  <p className="text-sm font-semibold leading-tight">
                    {toast.title}
                  </p>
                )}
                <p className="text-sm leading-snug">
                  {toast.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {},
    };
  }
  return ctx;
}

