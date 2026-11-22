import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isOpen,
  message = 'Cargando contenido...',
}) => {
  const [mounted, setMounted] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  // Asegurar que el portal se monte solo en el navegador (cliente)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Controlar la animación de entrada y salida suave (200ms)
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    } else {
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Bloquear scroll del documento mientras el loading esté activo
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.removeProperty('overflow');
        document.documentElement.style.removeProperty('overflow');
        document.body.style.removeProperty('touch-action');
      };
    }
  }, [isOpen]);

  if (!mounted || !isRendered) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-busy={isOpen}
      className={`fixed inset-0 z-[100] h-[100dvh] w-screen flex flex-col items-center justify-center bg-[#1C0F18]/65 backdrop-blur-md select-none transition-opacity duration-200 ease-out ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex flex-col items-center justify-center p-4">
        {/* Anillo de Brillo Orbital con Logo StudioBJ */}
        <div className="relative flex items-center justify-center p-[2.5px] rounded-full overflow-hidden shadow-[0_0_35px_rgba(217,166,184,0.25)]">
          {/* Capa de Halo Difuminado Detrás (Glow) */}
          <div
            aria-hidden="true"
            className="absolute inset-[-60%] animate-spin-orbital rounded-full blur-md opacity-55 pointer-events-none"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, transparent 220deg, rgba(217, 166, 184, 0.15) 260deg, #D9A6B8 315deg, #E5C7A3 345deg, #FFFFFF 360deg)',
            }}
          />

          {/* Haz de Luz Nítido (Borde Fino tipo Cometa) */}
          <div
            aria-hidden="true"
            className="absolute inset-[-60%] animate-spin-orbital rounded-full pointer-events-none"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, transparent 220deg, rgba(217, 166, 184, 0.15) 260deg, #D9A6B8 315deg, #E5C7A3 345deg, #FFFFFF 360deg)',
            }}
          />

          {/* Anillo base estático sutil */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-[#D9A6B8]/20 pointer-events-none"
          />

          {/* Círculo Central Oscuro Dark Luxury con el Logo */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#261521] flex items-center justify-center p-2.5 shadow-2xl z-10 animate-pulse-subtle">
            <img
              src="/logo-128.png"
              srcSet="/logo-128.png 1x, /logo-256.png 2x, /logo.png 3x"
              alt="StudioBJ"
              className="w-full h-full object-contain rounded-full select-none pointer-events-none drop-shadow-[0_0_10px_rgba(217,166,184,0.3)]"
              draggable={false}
            />
          </div>
        </div>

        {/* Mensaje Contextual Discreto */}
        {message && (
          <p className="mt-4 text-xs sm:text-sm font-medium tracking-wide text-[#D9A6B8] animate-fadeIn text-center max-w-xs drop-shadow-sm">
            {message}
          </p>
        )}

        {/* Texto accesible para lectores de pantalla */}
        <span className="sr-only">{message || 'Cargando información de StudioBJ...'}</span>
      </div>
    </div>,
    document.body
  );
};
