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

  // Si es "Top Ventas", renderizamos con el efecto de halo luminoso orbital del LoadingOverlay
  if (isTop) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full select-none ${className}`}
      >
        {/* Halo difuminado exterior alrededor del badge (como en el loading de la página) */}
        <div
          aria-hidden="true"
          className="absolute -inset-0.5 rounded-full blur-[4px] bg-[#D9A6B8]/45 opacity-80 pointer-events-none animate-pulse-subtle"
        />

        {/* Contenedor del borde con haz de luz orbital rotatorio tipo cometa */}
        <div className="relative inline-flex items-center justify-center rounded-full p-[1.5px] overflow-hidden shadow-[0_0_12px_rgba(217,166,184,0.4)]">
          {/* Haz de luz continuo rotatorio (conic-gradient exacto del loading) */}
          <div
            aria-hidden="true"
            className="absolute -inset-[200%] pointer-events-none animate-spin-orbital"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, transparent 180deg, rgba(217, 166, 184, 0.25) 240deg, #D9A6B8 290deg, #E5C7A3 335deg, #FFFFFF 360deg)',
              animation: 'spin-orbital 1.8s linear infinite',
              WebkitAnimation: 'spin-orbital 1.8s linear infinite',
            }}
          />

          {/* Núcleo interior del Badge en dark luxury rosado */}
          <span
            className={`relative z-10 ${sizeClasses} rounded-full bg-[#261521] text-[#E8B2C4] font-semibold tracking-normal whitespace-nowrap backdrop-blur-md flex items-center justify-center`}
          >
            {etiqueta}
          </span>
        </div>
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
