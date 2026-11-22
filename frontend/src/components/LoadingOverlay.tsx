import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isOpen,
  message = 'Un momento, estamos activando tu estilo…',
}) => {
  const [mounted, setMounted] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  // Asegurar que el portal se monte solo en el cliente
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
      className={`fixed inset-0 z-[100] h-[100dvh] w-screen flex flex-col items-center justify-center bg-[#1C0F18]/70 backdrop-blur-md select-none transition-opacity duration-200 ease-out ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex flex-col items-center justify-center p-4">
        {/* Anillo de Brillo Orbital con Logo StudioBJ */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
          {/* Capa 1: Halo Difuminado Detrás (Glow) con rotación continua acelerada por GPU */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full blur-[6px] opacity-75 pointer-events-none animate-spin-orbital"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, transparent 180deg, rgba(217, 166, 184, 0.25) 240deg, #D9A6B8 290deg, #E5C7A3 335deg, #FFFFFF 360deg)',
              animation: 'spin-orbital 1.8s linear infinite',
              WebkitAnimation: 'spin-orbital 1.8s linear infinite',
            }}
          />

          {/* Capa 2: Haz de Luz Nítido tipo Cometa */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full pointer-events-none animate-spin-orbital"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, transparent 180deg, rgba(217, 166, 184, 0.25) 240deg, #D9A6B8 290deg, #E5C7A3 335deg, #FFFFFF 360deg)',
              animation: 'spin-orbital 1.8s linear infinite',
              WebkitAnimation: 'spin-orbital 1.8s linear infinite',
            }}
          />

          {/* Anillo base estático sutil */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-[#D9A6B8]/20 pointer-events-none shadow-[0_0_20px_rgba(217,166,184,0.15)]"
          />

          {/* Círculo Central Oscuro Dark Luxury que cubre el interior y deja visible el aro perimetral */}
          <div
            className="absolute inset-[2.5px] rounded-full bg-[#261521] flex items-center justify-center p-2.5 shadow-2xl z-10 animate-pulse-subtle"
            style={{
              animation: 'pulse-subtle 3s ease-in-out infinite',
              WebkitAnimation: 'pulse-subtle 3s ease-in-out infinite',
            }}
          >
            <img
              src="/logo-128.png"
              srcSet="/logo-128.png 1x, /logo-256.png 2x, /logo.png 3x"
              alt="StudioBJ"
              className="w-full h-full object-contain rounded-full select-none pointer-events-none drop-shadow-[0_0_12px_rgba(217,166,184,0.35)]"
              draggable={false}
            />
          </div>
        </div>

        {/* Mensaje dinámico motivacional StudioBJ */}
        <p className="mt-4 text-xs sm:text-sm font-medium tracking-wide text-[#D9A6B8] animate-fadeIn text-center drop-shadow-sm px-4">
          {message}
        </p>

        {/* Texto accesible para lectores de pantalla */}
        <span className="sr-only">{message}</span>
      </div>
    </div>,
    document.body
  );
};
