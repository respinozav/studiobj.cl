import React from 'react';
import { Truck, ShieldCheck, MessageCircle } from 'lucide-react';

export const TrustFeatures: React.FC = () => {
  return (
    <section className="w-full bg-[#22131E] border-t border-[#3B1F33] border-b border-[#1A0D17] py-8 sm:py-9 px-4 sm:px-6 lg:px-8 font-calibri">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
        {/* Item 1: Envíos a todo Chile */}
        <div className="flex items-start gap-3.5">
          <Truck className="w-6 h-6 text-[#D9A6B8] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <h3 className="text-sm sm:text-[15px] font-bold text-white mb-0.5 tracking-tight font-calibri">
              Envíos a todo Chile
            </h3>
            <p className="text-xs sm:text-[13px] text-[#CBBEC6] leading-relaxed font-normal font-calibri">
              Despacho ágil desde San Bernardo a toda la Región Metropolitana y regiones por courier.
            </p>
          </div>
        </div>

        {/* Item 2: Calidad Seamless Real */}
        <div className="flex items-start gap-3.5">
          <ShieldCheck className="w-6 h-6 text-[#D9A6B8] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <h3 className="text-sm sm:text-[15px] font-bold text-white mb-0.5 tracking-tight font-calibri">
              Calidad Seamless Real
            </h3>
            <p className="text-xs sm:text-[13px] text-[#CBBEC6] leading-relaxed font-normal font-calibri">
              Toca la lupa en cualquier foto para inspeccionar costuras, compresión y textura antes de comprar.
            </p>
          </div>
        </div>

        {/* Item 3: Compra Directa por WhatsApp */}
        <div className="flex items-start gap-3.5">
          <MessageCircle className="w-6 h-6 text-[#D9A6B8] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <h3 className="text-sm sm:text-[15px] font-bold text-white mb-0.5 tracking-tight font-calibri">
              Compra Directa por WhatsApp
            </h3>
            <p className="text-xs sm:text-[13px] text-[#CBBEC6] leading-relaxed font-normal font-calibri">
              Asesoría personalizada de tallas y confirmación inmediata de stock al{' '}
              <a
                href="https://wa.me/56951156429"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#D9A6B8] hover:text-white transition-colors underline-offset-2 hover:underline"
              >
                +56 9 5115 6429
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
