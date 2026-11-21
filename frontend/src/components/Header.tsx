import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Header: React.FC = () => {
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full transition-all">
      {/* Header Fijo Glassmorphism */}
      <div className="glass-header px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Monograma y Logo Editorial Oficial - Destacado y en Alta Resolución */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3.5 group text-left"
          title="Ir al inicio"
        >
          <div className="relative flex items-center justify-center">
            {/* Halo de luz Luxury */}
            <div className="absolute -inset-1 bg-[#D9A6B8]/30 rounded-full blur-sm group-hover:bg-[#D9A6B8]/50 transition-all duration-300" />
            <img
              src="/logo-128.png"
              srcSet="/logo-128.png 1x, /logo-256.png 2x, /logo.png 3x"
              alt="StudioBJ Logo"
              className="relative w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-full border border-[#D9A6B8]/60 shadow-[0_0_15px_rgba(217,166,184,0.35)] group-hover:scale-105 group-hover:shadow-[0_0_22px_rgba(217,166,184,0.55)] transition-all duration-300"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-editorial text-lg sm:text-xl font-medium tracking-[0.2em] text-white/90 uppercase leading-none group-hover:text-white transition-colors">
              Studio<span className="text-[#D9A6B8] font-semibold">BJ</span>
            </span>
            <span className="text-[8px] sm:text-[9px] tracking-[0.22em] text-[#D9A6B8]/80 uppercase font-sans font-medium mt-0.5">
              Fitness & Fashion
            </span>
          </div>
        </button>

        {/* Botón Carrito / Bolso con Contador en Tiempo Real */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative p-2.5 rounded-full bg-[#261521]/80 hover:bg-[#311B2B] border border-[#D9A6B8]/30 hover:border-[#D9A6B8] transition-all duration-300 flex items-center justify-center text-white"
          aria-label="Ver carrito de compras"
        >
          <ShoppingBag className="w-5 h-5 text-[#D9A6B8]" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#D9A6B8] text-[#1C0F18] text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-pulse font-sans">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
