import React, { createContext, useContext, useState, useCallback } from 'react';
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiX, FiAlertOctagon } from 'react-icons/fi';

const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // 1. Toast logic
  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  // 2. Custom Confirmation Modal logic
  const confirmAction = useCallback(({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm }) => {
    return new Promise((resolve) => {
      setConfirmConfig({
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => {
          setConfirmConfig(null);
          if (onConfirm) onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setConfirmConfig(null);
          resolve(false);
        }
      });
    });
  }, []);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="text-emerald-500 text-lg flex-shrink-0" />;
      case 'error':
        return <FiAlertOctagon className="text-rose-500 text-lg flex-shrink-0" />;
      case 'warning':
        return <FiAlertTriangle className="text-amber-500 text-lg flex-shrink-0" />;
      default:
        return <FiInfo className="text-indigo-500 text-lg flex-shrink-0" />;
    }
  };

  const getToastClasses = (type) => {
    switch (type) {
      case 'success':
        return 'bg-white border-emerald-100 shadow-emerald-100/50';
      case 'error':
        return 'bg-white border-rose-100 shadow-rose-100/50';
      case 'warning':
        return 'bg-white border-amber-100 shadow-amber-100/50';
      default:
        return 'bg-white border-indigo-100 shadow-indigo-100/50';
    }
  };

  return (
    <NotificationContext.Provider value={{ showToast, confirmAction }}>
      {children}

      {/* FLOATING TOAST LIST */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 animate-slide-in-right ${getToastClasses(
              toast.type
            )}`}
          >
            {getToastIcon(toast.type)}
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-800 leading-normal">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-gray-400 hover:text-gray-650 transition-colors"
            >
              <FiX size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmConfig && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-150 transform transition-all duration-300 animate-fade-in">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                  <FiAlertTriangle size={24} />
                </div>
                <h3 className="text-base font-bold text-gray-850">{confirmConfig.title}</h3>
              </div>
              
              <p className="text-xs text-gray-500 leading-relaxed">
                {confirmConfig.message}
              </p>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  onClick={confirmConfig.onCancel}
                  className="px-4 py-2 border border-gray-250 hover:bg-slate-50 text-gray-600 rounded-xl text-xs font-semibold transition-colors"
                >
                  {confirmConfig.cancelText}
                </button>
                <button
                  onClick={confirmConfig.onConfirm}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  {confirmConfig.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
