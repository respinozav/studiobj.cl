import React from 'react';
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

  // Si es "Top Ventas", renderizamos con el haz de cometa de alta intensidad y brillo perimétrico constante
  if (isTop) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full select-none shadow-[0_0_16px_rgba(217,166,184,0.65),0_0_6px_rgba(255,255,255,0.4)] ${className}`}
      >
        {/* Halo difuminado exterior de alta intensidad tipo loading */}
        <div
          aria-hidden="true"
          className="absolute -inset-1 rounded-full blur-[6px] bg-[#D9A6B8]/55 opacity-90 animate-pulse-subtle pointer-events-none"
        />

        {/* SVG de contorno perimétrico a velocidad y frecuencia 100% constantes sin desvanecimiento en bordes */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none rounded-full"
          style={{ overflow: 'visible' }}
        >
          {/* Borde base nítido del contorno */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            rx="9999"
            fill="none"
            stroke="rgba(217, 166, 184, 0.45)"
            strokeWidth="1.5"
          />

          {/* 1. Capa de resplandor difuso exterior (Cola y Halo) - Intenso rosado #D9A6B8 */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            rx="9999"
            fill="none"
            stroke="#D9A6B8"
            strokeWidth="4.5"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="36 64"
            className="animate-border-beam"
            style={{
              filter: 'drop-shadow(0 0 6px #D9A6B8) drop-shadow(0 0 12px rgba(217, 166, 184, 0.85))',
              opacity: 0.95,
            }}
          />

          {/* 2. Cuerpo del cometa - Rosa claro luminoso #F2D3DF */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            rx="9999"
            fill="none"
            stroke="#F2D3DF"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="22 78"
            className="animate-border-beam"
            style={{
              filter: 'drop-shadow(0 0 4px #F2D3DF)',
              opacity: 1,
            }}
          />

          {/* 3. Cabeza del cometa - Luz blanca pura brillante #FFFFFF de máxima intensidad */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            rx="9999"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="10 90"
            className="animate-border-beam"
            style={{
              filter: 'drop-shadow(0 0 4px #FFFFFF) drop-shadow(0 0 8px rgba(255, 255, 255, 0.95))',
              opacity: 1,
            }}
          />
        </svg>

        {/* Núcleo interior del Badge en dark luxury rosado */}
        <span
          className={`relative z-10 ${sizeClasses} rounded-full bg-[#261521] text-[#E8B2C4] font-semibold tracking-normal whitespace-nowrap backdrop-blur-md flex items-center justify-center`}
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
