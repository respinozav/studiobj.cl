import React, { useState, useEffect, useRef } from 'react';
import { Categoria } from '../types';

interface Props {
  categorias: Categoria[];
  selectedCategoriaId: string | null;
  onSelectCategoria: (id: string | null) => void;
}

export const CategoryFilters: React.FC<Props> = ({
  categorias,
  selectedCategoriaId,
  onSelectCategoria,
}) => {
  const [isSticky, setIsSticky] = useState(false);
  const [headerHeight, setHeaderHeight] = useState<number>(75);
  const filterRef = useRef<HTMLDivElement>(null);
  const chipsRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScrollAndResize = () => {
      const headerEl = document.querySelector('header');
      const hHeight = headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 75;
      setHeaderHeight(hHeight);

      if (!filterRef.current) return;
      const rect = filterRef.current.getBoundingClientRect();
      setIsSticky(rect.top <= hHeight + 1);
    };

    window.addEventListener('scroll', handleScrollAndResize, { passive: true });
    window.addEventListener('resize', handleScrollAndResize);
    handleScrollAndResize();
    return () => {
      window.removeEventListener('scroll', handleScrollAndResize);
      window.removeEventListener('resize', handleScrollAndResize);
    };
  }, []);

  const handleSelect = (id: string | null, e?: React.MouseEvent<HTMLButtonElement>) => {
    // 1. Centrar horizontalmente el chip ÚNICAMENTE dentro de la fila de chips (SIN mover la ventana vertical)
    if (e?.currentTarget && chipsRowRef.current) {
      const container = chipsRowRef.current;
      const btn = e.currentTarget;
      const targetScrollLeft = btn.offsetLeft - container.offsetWidth / 2 + btn.offsetWidth / 2;
      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth',
      });
    }

    // 2. Notificar cambio de categoría
    onSelectCategoria(id);

    // 3. Solo si el usuario está en la parte superior (Hero), deslizamos suavemente al catálogo
    // para que la barra quede perfectamente acoplada al borde inferior del Header (0px separación).
    // Si ya está en el catálogo, NO TOCAMOS window.scrollTo para que no haya saltos ni espacios.
    if (filterRef.current) {
      const headerEl = document.querySelector('header');
      const hHeight = headerEl ? Math.round(headerEl.getBoundingClientRect().height) : headerHeight;
      const filterTop = window.pageYOffset + filterRef.current.getBoundingClientRect().top;
      const targetY = filterTop - hHeight;

      if (window.pageYOffset < targetY - 10) {
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'smooth',
        });
      }
    }
  };

  const formatCategoryTitle = (name: string) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  return (
    <div
      id="catalogo"
      ref={filterRef}
      style={{ top: `${headerHeight}px` }}
      className={`w-full sticky z-30 transition-all duration-150 bg-[#1C0F18] ${
        isSticky
          ? 'py-2 px-4 sm:px-6 lg:px-8 bg-[#1C0F18]/95 backdrop-blur-xl border-b border-[#D9A6B8]/20 shadow-[0_10px_25px_-5px_rgba(15,7,12,0.9),0_0_15px_rgba(217,166,184,0.1)]'
          : 'py-2 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06]'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Barra de chips horizontales estilo Fino Luxury */}
        <div
          ref={chipsRowRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5 flex-1"
        >
          {/* Chip "Todos" */}
          <button
            onClick={(e) => handleSelect(null, e)}
            className={`flex-shrink-0 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95 ${
              selectedCategoriaId === null
                ? 'bg-white text-[#1C0F18] border border-white shadow-md font-semibold'
                : 'bg-[#241120] text-[#D9A6B8] border border-white/10 hover:border-[#D9A6B8]/40 hover:text-white'
            }`}
          >
            Todos
          </button>

          {/* Chips Dinámicos de Categorías Activas */}
          {categorias.map((cat) => {
            const isSelected = selectedCategoriaId === cat.id;
            const displayName = formatCategoryTitle(cat.nombre);
            return (
              <button
                key={cat.id}
                onClick={(e) => handleSelect(cat.id, e)}
                className={`flex-shrink-0 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? 'bg-white text-[#1C0F18] border border-white shadow-md font-semibold'
                    : 'bg-[#241120] text-[#D9A6B8] border border-white/10 hover:border-[#D9A6B8]/40 hover:text-white'
                }`}
              >
                {displayName}
              </button>
            );
          })}
        </div>

        {/* Indicador visual cuando está pegado al header */}
        {isSticky && (
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold text-[#D9A6B8] tracking-widest uppercase flex-shrink-0 pl-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9A6B8] animate-pulse" />
            <span>Filtro de Colección</span>
          </div>
        )}
      </div>
    </div>
  );
};
