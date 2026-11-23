import React from 'react';
import { isTopVentas, getBadgeStyles } from '../utils/croBadges';

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

  // Si es "Top Ventas", renderizamos con el haz de luz único, fino, nítido y a frecuencia constante
  if (isTop) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full select-none shadow-[0_0_10px_rgba(217,166,184,0.35)] ${className}`}
      >
        {/* Halo difuminado exterior suave y refinado */}
        <div
          aria-hidden="true"
          className="absolute -inset-0.5 rounded-full blur-[4px] bg-[#D9A6B8]/35 opacity-90 animate-pulse-subtle pointer-events-none"
        />

        {/* SVG de contorno perimétrico: 1 sola línea nítida y continua a velocidad constante */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none rounded-full"
          style={{ overflow: 'visible' }}
        >
          {/* Borde base sutil rosado */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            rx="9999"
            fill="none"
            stroke="rgba(217, 166, 184, 0.4)"
            strokeWidth="1"
          />

          {/* Único haz de luz cometa fino (1.5px) con núcleo blanco y resplandor rosado */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            rx="9999"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="24 76"
            className="animate-border-beam"
            style={{
              filter:
                'drop-shadow(0 0 2px #FFFFFF) drop-shadow(0 0 5px #D9A6B8) drop-shadow(0 0 9px rgba(217, 166, 184, 0.8))',
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

  // Últimas unidades (Amarillo) y Nuevo (Verde) en su formato original fino de alta distinción
  return (
    <span
      className={`inline-flex items-center ${sizeClasses} rounded-full font-semibold tracking-normal backdrop-blur-md whitespace-nowrap select-none ${getBadgeStyles(
        etiqueta
      )} ${className}`}
    >
      {etiqueta}
    </span>
  );
};
