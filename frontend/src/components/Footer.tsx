import React from 'react';
import { MessageCircle, MapPin, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#1C0F18] border-t border-[#D9A6B8]/20 pt-10 pb-8 px-4 sm:px-6 lg:px-8 text-gray-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#D9A6B8]/10 text-center md:text-left">
        {/* Identidad con Logo Oficial */}
        <div>
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2.5">
            <img
              src="/logo.png"
              alt="StudioBJ Logo"
              className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(217,166,184,0.3)]"
            />
            <div>
              <span className="font-editorial text-2xl font-bold tracking-wider text-white uppercase block leading-tight">
                Studio<span className="text-[#D9A6B8]">BJ</span>
              </span>
              <span className="text-[10px] tracking-[0.25em] text-[#D9A6B8] uppercase font-sans font-medium block">
                Fitness & Fashion
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 max-w-sm">
            Ropa deportiva femenina Dark Luxury. Diseñada para potenciar tu seguridad, silueta y rendimiento físico.
          </p>
        </div>

        {/* Ubicación y Contacto Directo */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-xs">
          <div className="flex items-center gap-1.5 text-gray-300">
            <MapPin className="w-4 h-4 text-[#D9A6B8] flex-shrink-0" />
            <span>Santiago, Comuna de San Bernardo, Chile.</span>
          </div>

          <a
            href="https://wa.me/56951156429"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#D9A6B8] hover:text-white transition-colors font-medium"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>+56 9 5115 6429</span>
          </a>
        </div>
      </div>

      {/* Barra Inferior con Firma Obligatoria y Enlace Admin */}
      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
        <p>
          © {new Date().getFullYear()} StudioBJ. Todos los derechos reservados.
        </p>

        <div className="flex items-center gap-4">
          {/* Firma Obligatoria RAEV */}
          <span>
            Desarrollado por{' '}
            <a
              href="https://raevsi.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D9A6B8] hover:underline font-medium"
            >
              RAEV Soluciones Informáticas
            </a>
          </span>

          {/* Enlace discreto a /admin */}
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 text-gray-600 hover:text-[#D9A6B8] transition-colors p-1"
            title="Administración de tienda"
          >
            <Lock className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wider">Admin</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};
