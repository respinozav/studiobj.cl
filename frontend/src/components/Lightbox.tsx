import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Producto } from '../types';
import { getColorHex } from '../utils/colorsAndSizes';

interface Props {
  producto: Producto | null;
  initialImageIndex?: number;
  imagenes?: string[];
  colorName?: string;
  onClose: () => void;
}

export const Lightbox: React.FC<Props> = ({
  producto,
  initialImageIndex = 0,
  imagenes = [],
  colorName,
  onClose,
}) => {
  const imageList = imagenes.length > 0 ? imagenes : (producto ? [producto.imagen_base64] : []);
  const [currentIdx, setCurrentIdx] = useState<number>(initialImageIndex);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x por defecto
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Bloquear scroll de la página completa cuando el visor/modal está abierto y restaurar al cerrar
  useEffect(() => {
    if (!producto) return;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('touch-action');
    };
  }, [producto]);

  useEffect(() => {
    setCurrentIdx(initialImageIndex);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  }, [initialImageIndex, imagenes, producto]);

  if (!producto) return null;

  const handleZoomToggle = () => {
    setZoomLevel((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : 1));
    setPosition({ x: 0, y: 0 });
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev > 0 ? prev - 1 : imageList.length - 1));
    setPosition({ x: 0, y: 0 });
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev < imageList.length - 1 ? prev + 1 : 0));
    setPosition({ x: 0, y: 0 });
  };

  // Paneo con mouse / touch
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomLevel <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.current.x,
      y: touch.clientY - dragStart.current.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1C0F18]/95 backdrop-blur-xl animate-fadeIn">
      {/* Barra de Control Superior */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#D9A6B8]/20 bg-[#261521]/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-[#D9A6B8] font-bold">
              Visor de Alta Definición
            </span>
            {colorName && (
              <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-[#311B2B] text-white border border-[#D9A6B8]/30 font-semibold">
                Color: {colorName}
              </span>
            )}
            {imageList.length > 1 && (
              <span className="text-[10px] text-gray-400 font-mono">
                ({currentIdx + 1}/{imageList.length})
              </span>
            )}
          </div>
          <h2 className="font-calibri text-sm sm:text-base text-gray-200 font-normal truncate max-w-xs sm:max-w-md tracking-normal">
            {producto.nombre}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom In / Out */}
          <button
            onClick={handleZoomToggle}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#311B2B] hover:bg-[#D9A6B8] hover:text-[#1C0F18] border border-[#D9A6B8]/30 text-xs font-semibold text-white transition-colors"
            title="Cambiar nivel de zoom"
          >
            {zoomLevel > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            <span>{zoomLevel}x</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-1.5 rounded-full bg-[#311B2B] hover:bg-[#D9A6B8] hover:text-[#1C0F18] border border-[#D9A6B8]/30 text-white transition-colors"
            title="Restablecer posición"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Cerrar */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#311B2B] hover:bg-rose-500 text-white border border-[#D9A6B8]/30 transition-colors ml-2"
            title="Cerrar visor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Área de Visualización y Paneo */}
      <div
        className="flex-1 overflow-hidden relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Flecha Anterior (si tiene múltiples imágenes) */}
        {imageList.length > 1 && (
          <button
            onClick={handlePrevImage}
            className="absolute left-3 sm:left-6 z-20 p-2.5 rounded-full bg-[#1C0F18]/80 hover:bg-[#D9A6B8] text-white hover:text-[#1C0F18] border border-[#D9A6B8]/30 shadow-lg transition-all"
            title="Imagen anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Imagen con zoom y paneo */}
        <div
          className="transition-transform duration-100 ease-out flex items-center justify-center w-full h-full p-4"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
          }}
        >
          <img
            src={imageList[currentIdx]}
            alt={`${producto.nombre} - ${colorName || ''}`}
            className="max-h-[78vh] max-w-[88vw] object-contain rounded-lg shadow-2xl pointer-events-none"
            draggable={false}
          />
        </div>

        {/* Flecha Siguiente (si tiene múltiples imágenes) */}
        {imageList.length > 1 && (
          <button
            onClick={handleNextImage}
            className="absolute right-3 sm:right-6 z-20 p-2.5 rounded-full bg-[#1C0F18]/80 hover:bg-[#D9A6B8] text-white hover:text-[#1C0F18] border border-[#D9A6B8]/30 shadow-lg transition-all"
            title="Siguiente imagen"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Tira de Miniaturas Inferior */}
        {imageList.length > 1 && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 rounded-xl bg-[#1C0F18]/90 backdrop-blur-md border border-[#D9A6B8]/30 shadow-xl">
            {imageList.map((img, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIdx(i);
                  setPosition({ x: 0, y: 0 });
                }}
                className={`relative w-10 h-12 rounded-lg overflow-hidden border transition-all ${
                  currentIdx === i
                    ? 'border-[#D9A6B8] ring-2 ring-[#D9A6B8] scale-105'
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Tag de Color Abajo Lado Izquierdo DENTRO de la Imagen en Visor */}
        {colorName && (
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[#1C0F18]/90 backdrop-blur-md border border-[#D9A6B8]/30 shadow-xl pointer-events-none">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/40 flex-shrink-0"
              style={{ backgroundColor: getColorHex(colorName) }}
            />
            <span className="text-[11px] sm:text-xs font-medium text-white capitalize">
              {colorName}
            </span>
          </div>
        )}

        {/* Guía Flotante Táctil */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#1C0F18]/85 backdrop-blur-md border border-[#D9A6B8]/20 text-[10px] text-gray-300 pointer-events-none hidden sm:block">
          Arrastra para explorar detalles y costuras • Zoom: {zoomLevel}x
        </div>
      </div>
    </div>
  );
};
