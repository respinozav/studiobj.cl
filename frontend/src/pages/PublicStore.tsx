import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { CategoryFilters } from '../components/CategoryFilters';
import { ProductCard } from '../components/ProductCard';
import { Lightbox } from '../components/Lightbox';
import { CartDrawer } from '../components/CartDrawer';
import { TrustFeatures } from '../components/TrustFeatures';
import { Footer } from '../components/Footer';
import { Categoria, Producto } from '../types';
import { api } from '../services/api';
import { Loader2 } from 'lucide-react';

export const PublicStore: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [allProductos, setAllProductos] = useState<Producto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lightboxData, setLightboxData] = useState<{
    producto: Producto;
    imagenes: string[];
    colorName: string;
    initialIndex: number;
  } | null>(null);

  // Cargar Categorías Activas y Todos los Productos en la carga inicial de forma ultra-resiliente
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catsRes, prodsRes] = await Promise.allSettled([
          api.getPublicCategorias(),
          api.getPublicProductos(),
        ]);
        if (catsRes.status === 'fulfilled') setCategorias(catsRes.value);
        if (prodsRes.status === 'fulfilled') {
          setAllProductos(prodsRes.value);
          setProductos(prodsRes.value);
        }
      } catch (e) {
        console.error('Error cargando catálogo inicial', e);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Transición suave y elegante al cambiar de categoría (cero pestañeos, cross-fade luxury)
  useEffect(() => {
    if (initialLoading) return;

    // Activamos transición visual sutil (cross-fade suave)
    setIsTransitioning(true);

    const timer = setTimeout(() => {
      const filtered = selectedCategoriaId
        ? allProductos.filter((p) => p.categoria_id === selectedCategoriaId)
        : allProductos;
      setProductos(filtered);
      setIsTransitioning(false);
    }, 120);

    return () => clearTimeout(timer);
  }, [selectedCategoriaId, allProductos, initialLoading]);

  // Sincronización en segundo plano con el servidor (sin interrumpir la UI)
  useEffect(() => {
    if (initialLoading) return;

    let isCurrent = true;
    api
      .getPublicProductos(selectedCategoriaId || undefined)
      .then((data) => {
        if (isCurrent) {
          setProductos(data);
        }
      })
      .catch((e) => console.warn('Sync background error', e));

    return () => {
      isCurrent = false;
    };
  }, [selectedCategoriaId, initialLoading]);

  return (
    <div className="min-h-screen flex flex-col bg-[#1C0F18] text-white">
      {/* Header Glassmorphism */}
      <Header />

      {/* Hero Mobile-First */}
      <Hero />

      {/* Filtros Horizontales Táctiles Sticky debajo del Header */}
      <CategoryFilters
        categorias={categorias}
        selectedCategoriaId={selectedCategoriaId}
        onSelectCategoria={setSelectedCategoriaId}
      />

      {/* Contenedor Principal Catálogo CRO (2 col móvil / 4 desktop) */}
      <main
        id="catalogo-productos"
        className="scroll-mt-[135px] sm:scroll-mt-[145px] flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12"
      >
        {/* Cabecera del Catálogo: Título y Cantidad de Prendas */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="font-editorial text-2xl sm:text-3xl font-light text-white capitalize transition-opacity duration-200">
            {selectedCategoriaId
              ? categorias.find((c) => c.id === selectedCategoriaId)?.nombre || 'Colección'
              : 'Colección Activewear'}
          </h2>
          <span className="text-xs text-[#D9A6B8] font-semibold bg-[#261521] px-3 py-1 rounded-full border border-white/10 shadow-sm transition-all duration-200">
            {productos.length} {productos.length === 1 ? 'prenda' : 'prendas'}
          </span>
        </div>

        {/* Loading Spinner Solo en Carga Inicial de Página */}
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#D9A6B8]">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
              Cargando catálogo StudioBJ...
            </p>
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-20 px-4 glass-card rounded-2xl border border-[#D9A6B8]/20 max-w-md mx-auto">
            <p className="font-editorial text-xl text-white mb-2">No hay prendas disponibles</p>
            <p className="text-xs text-gray-400">
              Pronto agregaremos nuevas unidades en esta categoría.
            </p>
          </div>
        ) : (
          <div
            id="grilla-productos"
            className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6 transition-all duration-250 ease-out transform ${
              isTransitioning
                ? 'opacity-30 scale-[0.995] blur-[0.5px]'
                : 'opacity-100 scale-100 blur-0'
            }`}
          >
            {productos.map((prod) => (
              <ProductCard
                key={prod.id}
                producto={prod}
                onOpenLightbox={(prod, imgs, colName, initIdx) =>
                  setLightboxData({ producto: prod, imagenes: imgs, colorName: colName, initialIndex: initIdx })
                }
              />
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Full-Screen con Zoom */}
      <Lightbox
        producto={lightboxData ? lightboxData.producto : null}
        imagenes={lightboxData ? lightboxData.imagenes : []}
        colorName={lightboxData ? lightboxData.colorName : undefined}
        initialImageIndex={lightboxData ? lightboxData.initialIndex : 0}
        onClose={() => setLightboxData(null)}
      />

      {/* Carrito Lateral Deslizable */}
      <CartDrawer />

      {/* Franja de Beneficios y Confianza */}
      <TrustFeatures />

      {/* Footer Obligatorio */}
      <Footer />
    </div>
  );
};
