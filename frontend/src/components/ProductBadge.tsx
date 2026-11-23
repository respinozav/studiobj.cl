import React, { useId } from 'react';
import { isTopVentas } from '../utils/croBadges';

interface ProductBadgeProps {
  etiqueta?: string | null;
  className?: string;
  size?: 'sm' | 'md';
}

export const ProductBadge: React.FC<ProductBadgeProps> = ({
  etiqueta,
  className = '',
  size = 'md',
}) => {
  if (!etiqueta) return null;

  const isTop = isTopVentas(etiqueta);
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-0.5 text-[10px] sm:text-[11px]';

  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const gradientId = `beam_${safeId}`;
  const glowFilterId = `glow_${safeId}`;

  // Si es "Top Ventas", renderizamos con el haz de luz de frecuencia constante alrededor de todo el contorno
  if (isTop) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full select-none ${className}`}
      >
        {/* Halo difuminado exterior suave */}
        <div
          aria-hidden="true"
          className="absolute -inset-0.5 rounded-full blur-[4px] bg-[#D9A6B8]/35 pointer-events-none"
        />

        {/* SVG de contorno perimétrico a velocidad y frecuencia 100% constantes */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible rounded-full"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="30%" stopColor="#E5C7A3" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#D9A6B8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#D9A6B8" stopOpacity="0" />
            </linearGradient>
            <filter id={glowFilterId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Borde base sutil del contorno */}
          <rect
            x="0.75"
            y="0.75"
            style={{ width: 'calc(100% - 1.5px)', height: 'calc(100% - 1.5px)' }}
            rx="9999"
            fill="none"
            stroke="rgba(217, 166, 184, 0.45)"
            strokeWidth="1"
          />

          {/* Halo difuso que recorre el contorno a velocidad constante */}
          <rect
            x="0.75"
            y="0.75"
            style={{ width: 'calc(100% - 1.5px)', height: 'calc(100% - 1.5px)' }}
            rx="9999"
            fill="none"
            stroke="#D9A6B8"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter={`url(#${glowFilterId})`}
            pathLength="100"
            strokeDasharray="28 72"
            className="animate-border-beam"
            opacity="0.85"
          />

          {/* Haz cometa nítido que recorre el contorno a velocidad constante */}
          <rect
            x="0.75"
            y="0.75"
            style={{ width: 'calc(100% - 1.5px)', height: 'calc(100% - 1.5px)' }}
            rx="9999"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="1.5"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="24 76"
            className="animate-border-beam"
          />
        </svg>

        {/* Núcleo interior del Badge en dark luxury rosado */}
        <span
          className={`relative z-10 ${sizeClasses} rounded-full bg-[#261521]/95 text-[#E8B2C4] font-semibold tracking-normal whitespace-nowrap backdrop-blur-md flex items-center justify-center`}
        >
          {etiqueta}
        </span>
      </div>
    );
  }

  // Todas las demás etiquetas (Últimas unidades, Nuevo, etc.) comparten el mismo diseño y color base
  return (
    <span
      className={`inline-flex items-center ${sizeClasses} rounded-full bg-[#311B2B]/90 text-[#E8B2C4] border border-[#D9A6B8]/50 font-semibold tracking-normal backdrop-blur-md shadow-[0_2px_8px_rgba(217,166,184,0.15)] whitespace-nowrap select-none ${className}`}
    >
      {etiqueta}
    </span>
  );
};
