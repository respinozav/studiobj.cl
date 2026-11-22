import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { CategoryFilters } from '../components/CategoryFilters';
import { ProductCard } from '../components/ProductCard';
import { Lightbox } from '../components/Lightbox';
import { CartDrawer } from '../components/CartDrawer';
import { TrustFeatures } from '../components/TrustFeatures';
import { Footer } from '../components/Footer';
import { Categoria, Producto, HeroTemplate } from '../types';
import { api } from '../services/api';
import { useLoading } from '../context/LoadingContext';

const getCachedHero = (): HeroTemplate | null => {
  try {
    const raw = localStorage.getItem('studiobj_active_hero');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

export const PublicStore: React.FC = () => {
  const { withLoading } = useLoading();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [allProductos, setAllProductos] = useState<Producto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [heroData, setHeroData] = useState<HeroTemplate | null>(() => getCachedHero());
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lightboxData, setLightboxData] = useState<{
    producto: Producto;
    imagenes: string[];
    colorName: string;
    initialIndex: number;
  } | null>(null);

  // Cargar Hero, Categorías Activas y Todos los Productos en la carga inicial de forma sincronizada
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await withLoading(
          (async () => {
            const [catsRes, prodsRes, heroRes] = await Promise.allSettled([
              api.getPublicCategorias(),
              api.getPublicProductos(),
              api.getPublicHero(),
            ]);
            if (catsRes.status === 'fulfilled') setCategorias(catsRes.value);
            if (prodsRes.status === 'fulfilled') {
              setAllProductos(prodsRes.value);
              setProductos(prodsRes.value);
            }
            if (heroRes.status === 'fulfilled' && heroRes.value) {
              setHeroData(heroRes.value);
              try {
                localStorage.setItem('studiobj_active_hero', JSON.stringify(heroRes.value));
              } catch {}
            }
          })(),
          'Loading...'
        );
      } catch (e) {
        console.error('Error cargando catálogo inicial', e);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, [withLoading]);

  // Super SEO Dinámico: Inyección de Schema.org ItemList / Product para indexación en Google
  useEffect(() => {
    if (!allProductos || allProductos.length === 0) return;

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Catálogo Oficial StudioBJ – Ropa Deportiva y Activewear San Bernardo & Chile',
      description:
        'Prendas deportivas de compresión inteligente, sets, enteritos y calzas en San Bernardo, Calera de Tango, Buin, Paine, El Bosque y todo Chile',
      numberOfItems: allProductos.length,
      itemListElement: allProductos.slice(0, 25).map((prod, index) => {
        const primaryImg =
          prod.variantes?.[0]?.imagenes?.[0] || prod.imagen_base64 || 'https://studiobj.cl/og-image.jpg';
        return {
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: prod.nombre,
            description: prod.descripcion || `${prod.nombre} - Ropa deportiva premium StudioBJ en Chile`,
            image: primaryImg.startsWith('data:') ? 'https://studiobj.cl/og-image.jpg' : primaryImg,
            brand: {
              '@type': 'Brand',
              name: 'StudioBJ',
            },
            offers: {
              '@type': 'Offer',
              price: prod.precio,
              priceCurrency: 'CLP',
              availability: prod.activo ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              url: 'https://studiobj.cl/#catalogo-productos',
              seller: {
                '@type': 'Organization',
                name: 'StudioBJ',
              },
            },
          },
        };
      }),
    };

    let scriptEl = document.getElementById('schema-products-jsonld') as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'schema-products-jsonld';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(schemaData);

    return () => {
      const el = document.getElementById('schema-products-jsonld');
      if (el) el.remove();
    };
  }, [allProductos]);

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

      {/* Hero Mobile-First sincronizado con la configuración */}
      <Hero heroData={heroData} />

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

        {/* Carga Inicial cubierta por el Global LoadingOverlay */}
        {initialLoading ? (
          <div className="py-24" />
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
