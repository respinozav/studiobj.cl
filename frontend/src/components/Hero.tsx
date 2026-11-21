import React, { useState, useEffect } from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';
import { HeroTemplate } from '../types';
import { api } from '../services/api';

export const Hero: React.FC = () => {
  const [heroData, setHeroData] = useState<HeroTemplate | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .getPublicHero()
      .then((data) => {
        if (isMounted && data) {
          setHeroData(data);
        }
      })
      .catch((e) => console.warn('Carga dinámica Hero (usando fallback)', e));

    return () => {
      isMounted = false;
    };
  }, []);

  const scrollToCatalog = () => {
    const el = document.getElementById('catalogo');
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

  const tag = heroData?.tag || 'Fitness & Fashion';
  const tituloLinea1 = heroData?.titulo_linea_1 || 'Esculpe Tu Fuerza Con';
  const tituloLinea2 = heroData?.titulo_linea_2 || 'Elegancia Exclusiva';
  const subtitulo =
    heroData?.subtitulo ||
    'Prendas deportivas de compresión premium, tejidos transpirables y diseño sofisticado pensado para la mujer moderna en Chile.';
  const botonTexto = heroData?.boton_texto || 'Ver Colección';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#1C0F18] via-[#261521] to-[#1C0F18] pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#D9A6B8]/15">
      {/* Círculos de luz ambiental sutil de fondo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#D9A6B8]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#311B2B]/40 rounded-full blur-2xl pointer-events-none" />

      <div className="relative max-w-2xl mx-auto text-center flex flex-col items-center">
        {/* Emblema Oficial Central StudioBJ - El logo siempre el mismo */}
        <div className="relative mb-4 group">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#D9A6B8]/40 to-[#311B2B] rounded-full blur-md opacity-60 group-hover:opacity-90 transition duration-500" />
          <img
            src="/logo-256.png"
            srcSet="/logo-128.png 1x, /logo-256.png 2x, /logo.png 3x"
            alt="StudioBJ Official Emblem"
            className="relative w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-full border-2 border-[#D9A6B8]/60 shadow-[0_0_25px_rgba(217,166,184,0.35)]"
          />
        </div>

        {/* Badge de Temporada / TAG */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#311B2B]/80 border border-[#D9A6B8]/30 text-xs text-[#D9A6B8] font-medium tracking-widest uppercase mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{tag}</span>
        </div>

        {/* Título Principal en Tipografía Cormorant Garamond */}
        <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-tight tracking-tight mb-3">
          {tituloLinea1} <br />
          <span className="italic font-normal text-[#D9A6B8]">{tituloLinea2}</span>
        </h1>

        {/* Subtítulo UI en Plus Jakarta Sans */}
        <p className="text-sm sm:text-base text-gray-300 max-w-md font-normal leading-relaxed mb-6">
          {subtitulo}
        </p>

        {/* Botón CTA Directo */}
        <button
          onClick={scrollToCatalog}
          className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D9A6B8] to-[#E6BAC8] hover:from-[#E6BAC8] hover:to-[#D9A6B8] text-[#1C0F18] font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-[#D9A6B8]/20 transition-all duration-300 transform active:scale-95"
        >
          <span>{botonTexto}</span>
          <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>
    </section>
  );
};
