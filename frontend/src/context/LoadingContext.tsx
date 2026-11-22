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

const DELAY_MS = 120; // Tiempo de espera antes de mostrar para evitar parpadeos en llamadas ultra-rápidas
const MIN_VISIBLE_MS = 280; // Tiempo mínimo de permanencia para una animación suave y perceptible

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('Cargando...');

  const pendingCount = useRef(0);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showStartTime = useRef<number | null>(null);

  const showLoading = useCallback((msg?: string) => {
    pendingCount.current += 1;
    if (msg) setMessage(msg);

    // Si ya está visible, solo actualizamos el mensaje
    if (showStartTime.current !== null) {
      return;
    }

    // Si aún no está programado, programamos la aparición con retardo anti-parpadeo
    if (!delayTimer.current) {
      delayTimer.current = setTimeout(() => {
        showStartTime.current = Date.now();
        setIsVisible(true);
        delayTimer.current = null;
      }, DELAY_MS);
    }
  }, []);

  const hideLoading = useCallback(() => {
    pendingCount.current = Math.max(0, pendingCount.current - 1);

    if (pendingCount.current === 0) {
      // Si aún no se había mostrado porque la llamada terminó antes de DELAY_MS, cancelamos el timer
      if (delayTimer.current) {
        clearTimeout(delayTimer.current);
        delayTimer.current = null;
      }

      // Si ya está visible en pantalla, aseguramos que cumpla el tiempo mínimo para evitar flash
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
    async <T,>(promise: Promise<T>, msg?: string): Promise<T> => {
      showLoading(msg);
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
