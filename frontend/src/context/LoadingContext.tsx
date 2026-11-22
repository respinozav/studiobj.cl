import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { LoadingOverlay } from '../components/LoadingOverlay';

interface LoadingContextType {
  isLoading: boolean;
  message: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  withLoading: <T>(promise: Promise<T>, message?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LOADING_MESSAGES = [
  'Un momento, estamos activando tu estilo…',
  'Cargando actitud…',
  'Ready to move…',
  'Elevando tu estilo…',
  'Entrando en modo fitness…',
  'Tu próxima versión comienza aquí…',
];

export const getRandomLoadingMessage = (): string => {
  const index = Math.floor(Math.random() * LOADING_MESSAGES.length);
  return LOADING_MESSAGES[index];
};

const MIN_VISIBLE_MS = 320; // Tiempo mínimo para que la rotación se aprecie con suavidad sin destellos

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState<string>(() => getRandomLoadingMessage());

  const pendingCount = useRef(0);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showStartTime = useRef<number | null>(null);

  const showLoading = useCallback((msg?: string) => {
    pendingCount.current += 1;
    setMessage(msg && msg !== 'Loading...' ? msg : getRandomLoadingMessage());

    // Si ya está visible, aseguramos estado
    if (showStartTime.current !== null) {
      return;
    }

    // Activación inmediata
    showStartTime.current = Date.now();
    setIsVisible(true);
  }, []);

  const hideLoading = useCallback(() => {
    pendingCount.current = Math.max(0, pendingCount.current - 1);

    if (pendingCount.current === 0) {
      if (delayTimer.current) {
        clearTimeout(delayTimer.current);
        delayTimer.current = null;
      }

      if (showStartTime.current !== null) {
        const elapsed = Date.now() - showStartTime.current;
        const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

        if (minTimer.current) clearTimeout(minTimer.current);

        minTimer.current = setTimeout(() => {
          setIsVisible(false);
          showStartTime.current = null;
          minTimer.current = null;
        }, remaining);
      }
    }
  }, []);

  const withLoading = useCallback(
    async <T,>(promise: Promise<T>, _msg?: string): Promise<T> => {
      showLoading('Loading...');
      try {
        return await promise;
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading]
  );

  return (
    <LoadingContext.Provider
      value={{
        isLoading: isVisible,
        message,
        showLoading,
        hideLoading,
        withLoading,
      }}
    >
      {children}
      <LoadingOverlay isOpen={isVisible} message={message} />
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading debe ser utilizado dentro de un LoadingProvider');
  }
  return context;
};
