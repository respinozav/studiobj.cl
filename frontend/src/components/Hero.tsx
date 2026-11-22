import React, { useState, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';
import { HeroTemplate } from '../types';
import { api } from '../services/api';

const DEFAULT_HERO_IMAGES = [
  '/hero/hero-1.webp',
  '/hero/hero-2.webp',
  '/hero/hero-3.webp',
];

const getCachedHero = (): HeroTemplate | null => {
  try {
    const raw = localStorage.getItem('studiobj_active_hero');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

interface HeroProps {
  heroData?: HeroTemplate | null;
}

export const Hero: React.FC<HeroProps> = ({ heroData: propHero }) => {
  const [heroData, setHeroData] = useState<HeroTemplate | null>(() => propHero || getCachedHero());
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (propHero) {
      setHeroData(propHero);
      try {
        localStorage.setItem('studiobj_active_hero', JSON.stringify(propHero));
      } catch {}
    }
  }, [propHero]);

  useEffect(() => {
    let isMounted = true;
    api
      .getPublicHero()
      .then((data) => {
        if (isMounted && data) {
          setHeroData(data);
          try {
            localStorage.setItem('studiobj_active_hero', JSON.stringify(data));
          } catch {}
        }
      })
      .catch((e) => console.warn('Carga dinámica Hero (usando fallback)', e));

    return () => {
      isMounted = false;
    };
  }, []);

  // Lista de imágenes: personalizadas del admin o 3 por defecto
  const images =
    heroData?.imagenes_fondo && heroData.imagenes_fondo.length > 0
      ? heroData.imagenes_fondo
      : DEFAULT_HERO_IMAGES;

  // Rotación suave continua tipo video de fondo (cada 5.5 segundos)
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [images.length]);

  const scrollToCatalog = () => {
    const el = document.getElementById('catalogo-productos') || document.getElementById('catalogo');
    if (el) {
      const headerEl = document.querySelector('header');
      const hHeight = headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 75;
      const elTop = window.pageYOffset + el.getBoundingClientRect().top;
      window.scrollTo({
        top: Math.max(0, elTop - hHeight),
        behavior: 'smooth',
      });
    }
  };

  const tituloLinea1 = heroData?.titulo_linea_1 || 'Moldea tu silueta.';
  const tituloLinea2 = heroData?.titulo_linea_2 || 'Entrena sin límites.';
  const subtitulo =
    heroData?.subtitulo ||
    'Activewear seamless de compresión inteligente y cero transparencia. Pide directo por WhatsApp con despacho rápido a todo Chile.';
  const botonTexto = heroData?.boton_texto || 'Ver Colección';

  return (
    <section className="relative overflow-hidden bg-[#1C0F18] border-b border-[#D9A6B8]/15 min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] flex items-center">
      {/* --- CARRUSEL AMBIENTAL CINEMÁTICO (FONDO CON FUNDIDO CRUZADO Y KEN BURNS) --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {images.map((src, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={`${src}-${idx}`}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={src}
                alt="StudioBJ Colección"
                className={`w-full h-full object-cover object-right md:object-[75%_center] transform transition-transform duration-[6000ms] ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            </div>
          );
        })}

        {/* 1. Capa de fusión tonal Dark Luxury (Ciruela / Vino profundo con modo multiplicar) */}
        <div className="absolute inset-0 bg-[#1C0F18]/45 mix-blend-multiply" />

        {/* 2. Gradiente Horizontal Desktop: Negro sólido cubriendo 100% el texto a la izquierda, desvaneciéndose hacia la derecha */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#1C0F18] via-[#1C0F18]/92 via-45% to-transparent" />

        {/* 3. Gradiente Vertical Móvil: Viñeta completa de alta opacidad para contraste AAA */}
        <div className="md:hidden absolute inset-0 bg-gradient-to-t from-[#1C0F18] via-[#1C0F18]/85 via-50% to-[#1C0F18]/40" />

        {/* 4. Viñeta superior e inferior para integración perfecta con header y filtros */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#1C0F18] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#1C0F18] to-transparent" />
      </div>

      {/* --- CONTENIDO PRINCIPAL: ALINEADO A LA IZQUIERDA (LEFT-ALIGNED LUXURY) --- */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
        <div className="max-w-xl lg:max-w-2xl text-left flex flex-col items-start">
          {/* Título Principal (Línea 1) y Destacado en Cursiva y Rosa (Línea 2) */}
          <h1 className="font-editorial text-3xl sm:text-5xl lg:text-6xl font-light text-white leading-[1.08] tracking-tight drop-shadow-md">
            {tituloLinea1}
            <span className="italic font-normal text-[#D9A6B8] block mt-1 sm:mt-2">
              {tituloLinea2}
            </span>
          </h1>

          {/* Subtítulo Descriptivo */}
          <p className="font-normal text-gray-200 sm:text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-lg mt-4 sm:mt-5 mb-7 sm:mb-8 drop-shadow-sm">
            {subtitulo}
          </p>

          {/* Botón CTA Directo de Alta Gama */}
          <button
            onClick={scrollToCatalog}
            className="group inline-flex items-center gap-2.5 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white text-[#1C0F18] font-bold text-xs sm:text-sm uppercase tracking-wider hover:bg-[#D9A6B8] hover:text-white transition-all duration-300 shadow-xl hover:shadow-[#D9A6B8]/20 active:scale-95"
          >
            <span>{botonTexto}</span>
            <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Indicadores discretos de carrusel en la esquina inferior */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 sm:right-8 flex items-center gap-1.5 z-20">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Ver foto ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === currentSlide ? 'w-6 bg-[#D9A6B8]' : 'w-1.5 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
