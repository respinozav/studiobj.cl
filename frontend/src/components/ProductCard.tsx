import React, { useState } from 'react';
import { Search, ShoppingBag, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Producto, ProductoVariante } from '../types';
import { useCart } from '../context/CartContext';
import { STANDARD_SIZES, getColorHex } from '../utils/colorsAndSizes';

interface Props {
  producto: Producto;
  onOpenLightbox: (
    producto: Producto,
    imagenes: string[],
    colorName: string,
    initialIndex: number
  ) => void;
}

export const ProductCard: React.FC<Props> = ({ producto, onOpenLightbox }) => {
  const { addToCart } = useCart();

  // Variantes por color del producto
  const variantes: ProductoVariante[] =
    producto.variantes && producto.variantes.length > 0
      ? producto.variantes
      : [
          {
            color: producto.color,
            color_hex: getColorHex(producto.color),
            imagenes: [producto.imagen_base64],
            tallas: producto.talla,
          },
        ];

  // Color seleccionado inicialmente
  const [selectedColor, setSelectedColor] = useState<string>(variantes[0]?.color || producto.color);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);

  // Variante activa según el color seleccionado
  const activeVariant =
    variantes.find((v) => v.color.toLowerCase() === selectedColor.toLowerCase()) || variantes[0];

  // Imágenes para este color específico
  const currentImages =
    activeVariant.imagenes && activeVariant.imagenes.length > 0
      ? activeVariant.imagenes
      : [producto.imagen_base64];
  const currentImage = currentImages[activeImageIdx] || currentImages[0] || producto.imagen_base64;

  // Tallas disponibles para este color específico
  const availableSizesForColor = activeVariant.tallas
    ? activeVariant.tallas.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean)
    : ['S'];

  const isUnica = availableSizesForColor.some((t) => t.includes('ÚNICA') || t.includes('UNICA'));
  const isCustomOnly =
    isUnica ||
    (availableSizesForColor.length > 0 &&
      availableSizesForColor.every((t) => !STANDARD_SIZES.includes(t as any)));
  const sizesToDisplay = isUnica ? ['ÚNICA'] : isCustomOnly ? availableSizesForColor : STANDARD_SIZES;

  // Talla seleccionada para este color
  const [selectedTalla, setSelectedTalla] = useState<string>(
    isUnica
      ? 'ÚNICA'
      : availableSizesForColor.find((s) => sizesToDisplay.includes(s as any)) ||
          availableSizesForColor[0] ||
          'S'
  );

  // Al cambiar el color, ajustar imagen y tallas correspondientes
  const handleSelectColor = (col: string) => {
    setSelectedColor(col);
    setActiveImageIdx(0);
    const v = variantes.find((item) => item.color.toLowerCase() === col.toLowerCase());
    if (v) {
      const newSizes = v.tallas.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
      const isNewUnica = newSizes.some((t) => t.includes('ÚNICA') || t.includes('UNICA'));
      if (isNewUnica) {
        setSelectedTalla('ÚNICA');
      } else if (!newSizes.includes(selectedTalla)) {
        setSelectedTalla(newSizes[0] || 'S');
      }
    }
  };

  const [isAdded, setIsAdded] = useState(false);

  const formatCLP = (val: number) => {
    return '$' + val.toLocaleString('es-CL');
  };

  // Cálculo de porcentaje de descuento
  const discountPct =
    producto.precio_anterior && producto.precio_anterior > producto.precio
      ? Math.round(((producto.precio_anterior - producto.precio) / producto.precio_anterior) * 100)
      : null;

  const handleAddToCart = () => {
    addToCart(producto, selectedTalla, selectedColor);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1400);
  };

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden border border-white/[0.08] bg-[#1E0F1B] transition-all duration-300 hover:border-[#D9A6B8]/30 shadow-xl">
      {/* 1. Contenedor Imagen Aspecto Vertical 3:4 */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#160B14]">
        <img
          src={currentImage}
          alt={`${producto.nombre} - ${selectedColor}`}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out cursor-pointer"
          loading="lazy"
          onClick={() => onOpenLightbox(producto, currentImages, selectedColor, activeImageIdx)}
        />

        {/* Badge CRO Superior Izquierda (Top Ventas, Últimas unidades, Nuevo) */}
        {producto.etiqueta && (
          <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-0.5 rounded-full bg-[#1C0F18]/80 backdrop-blur-md border border-white/10 text-[10px] sm:text-[11px] font-medium text-white shadow-md">
            {producto.etiqueta}
          </div>
        )}

        {/* Botón Lupa Superior Derecha */}
        <button
          onClick={() => onOpenLightbox(producto, currentImages, selectedColor, activeImageIdx)}
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1C0F18]/80 hover:bg-[#311B2B] text-white/90 hover:text-white border border-white/10 backdrop-blur-md shadow-md flex items-center justify-center transition-all duration-200 active:scale-95"
          title="Ver detalle en alta resolución"
          aria-label="Abrir lupa de detalle"
        >
          <Search className="w-3.5 h-3.5 stroke-[2]" />
        </button>

        {/* Swatches de Color Circulares DENTRO DE LA IMAGEN (esquina inferior izquierda) */}
        <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5 drop-shadow-md">
          {variantes.map((v, idx) => {
            const isColSelected = selectedColor.toLowerCase() === v.color.toLowerCase();
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectColor(v.color);
                }}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-200 ${
                  isColSelected
                    ? 'ring-2 ring-white scale-110 shadow-lg'
                    : 'border border-white/40 hover:scale-105 opacity-90'
                }`}
                style={{ backgroundColor: v.color_hex || getColorHex(v.color) }}
                title={`${v.color}`}
              />
            );
          })}
        </div>

        {/* Navegador de fotos si tiene más de 1 imagen en este color */}
        {currentImages.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-0.5 bg-[#1C0F18]/85 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/15 text-[9px] text-gray-300 shadow-md">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : currentImages.length - 1));
              }}
              className="hover:text-white p-0.5 active:scale-90"
              title="Foto anterior"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="font-mono text-[9px] font-bold text-white px-0.5">
              {activeImageIdx + 1}/{currentImages.length}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIdx((prev) => (prev < currentImages.length - 1 ? prev + 1 : 0));
              }}
              className="hover:text-white p-0.5 active:scale-90"
              title="Foto siguiente"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Cuerpo de Información de la Tarjeta */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-2.5 bg-[#1E0F1B]">
        {/* Fila: Categoría (izq) y Color (der) */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray-400 font-normal">
          <span>{producto.categoria_nombre || 'Activewear'}</span>
          <span className="capitalize">{selectedColor}</span>
        </div>

        {/* Nombre del Producto */}
        <h3 className="font-calibri text-xs sm:text-sm font-normal text-white line-clamp-1 leading-snug tracking-normal -mt-0.5">
          {producto.nombre}
        </h3>

        {/* Fila de Precios y Descuento */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm sm:text-base font-bold text-white tracking-tight">
            {formatCLP(producto.precio)}
          </span>
          {producto.precio_anterior && producto.precio_anterior > producto.precio && (
            <>
              <span className="text-[11px] text-gray-500 line-through">
                {formatCLP(producto.precio_anterior)}
              </span>
              {discountPct && (
                <span className="text-[11px] text-[#D9A6B8] font-bold">
                  -{discountPct}%
                </span>
              )}
            </>
          )}
        </div>

        {/* Selector de Tallas Horizontal: Más Rectangular y Más Compacto */}
        <div className="flex items-center gap-1 w-full">
          {sizesToDisplay.map((t) => {
            const isAvailable = availableSizesForColor.includes(t);
            const isSelected = selectedTalla === t;
            return (
              <button
                key={t}
                type="button"
                disabled={!isAvailable}
                onClick={() => isAvailable && setSelectedTalla(t)}
                className={`flex-1 h-6 sm:h-7 rounded-[4px] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider transition-all duration-150 flex items-center justify-center ${
                  isSelected
                    ? 'bg-[#D9A6B8] text-[#1C0F18] font-bold shadow-sm'
                    : isAvailable
                    ? 'bg-[#281423] text-gray-300 border border-white/5 hover:border-[#D9A6B8]/30 hover:text-white'
                    : 'bg-[#180C15] text-gray-600 border border-white/5 cursor-not-allowed line-through opacity-30'
                }`}
                title={
                  isAvailable
                    ? `Talla ${t} disponible en ${selectedColor}`
                    : `Talla ${t} agotada en ${selectedColor}`
                }
              >
                <span>{t}</span>
              </button>
            );
          })}
        </div>

        {/* Botón AGREGAR AL CARRITO: Más Rectangular, Texto de una sola línea sin desborde */}
        <button
          onClick={handleAddToCart}
          disabled={isAdded}
          className={`w-full h-8 sm:h-9 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap overflow-hidden ${
            isAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-white hover:bg-gray-100 text-[#1C0F18] active:scale-[0.98]'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[2.5] flex-shrink-0" />
              <span className="truncate">Agregado al Carrito</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5 stroke-[2] flex-shrink-0" />
              <span className="truncate">Agregar al Carrito</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
