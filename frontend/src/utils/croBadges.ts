import { Producto } from '../types';

/**
 * Retorna la prioridad numérica de ordenamiento para clientes:
 * 1 -> Top Ventas
 * 2 -> Últimas unidades
 * 3 -> Nuevo
 * 4 -> Sin etiqueta / Otros
 */
export const getEtiquetaPriority = (etiqueta?: string | null): number => {
  if (!etiqueta) return 4;
  const norm = etiqueta
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (norm.includes('top')) return 1;
  if (norm.includes('ultima')) return 2;
  if (norm.includes('nuevo')) return 3;
  return 4;
};

/**
 * Ordena un listado de productos para el cliente final según las etiquetas CRO:
 * 1º Top Ventas
 * 2º Últimas unidades
 * 3º Nuevo
 * 4º Resto de productos (manteniendo orden secundario por fecha o id)
 */
export const sortProductosByEtiqueta = (productos: Producto[]): Producto[] => {
  return [...productos].sort((a, b) => {
    const prioA = getEtiquetaPriority(a.etiqueta);
    const prioB = getEtiquetaPriority(b.etiqueta);
    if (prioA !== prioB) {
      return prioA - prioB;
    }
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
};

/**
 * Retorna las clases de estilo para las etiquetas CRO:
 * - Top Ventas: Rosado institucional (#D9A6B8) de la página con texto oscuro de alto contraste
 * - Últimas unidades: Amarillo (amber-400) con texto oscuro para urgencia
 * - Nuevo: Verde (emerald-500) con texto blanco para novedad
 */
export const getBadgeStyles = (etiqueta?: string | null): string => {
  if (!etiqueta) return '';
  const norm = etiqueta
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // 1. Top Ventas: Rosado institucional (#D9A6B8, color de la página)
  if (norm.includes('top')) {
    return 'bg-[#D9A6B8] text-[#1C0F18] border border-[#F2D3DF]/60 shadow-[0_2px_10px_rgba(217,166,184,0.35)]';
  }

  // 2. Últimas unidades: Amarillo (amber-400 con texto oscuro de alta legibilidad)
  if (norm.includes('ultima')) {
    return 'bg-amber-400 text-stone-950 border border-amber-300/80 shadow-[0_2px_10px_rgba(251,191,36,0.35)]';
  }

  // 3. Nuevo: Verde (emerald-500)
  if (norm.includes('nuevo')) {
    return 'bg-emerald-500 text-white border border-emerald-400/60 shadow-[0_2px_10px_rgba(16,185,129,0.35)]';
  }

  // Fallback para cualquier otra etiqueta personalizada
  return 'bg-[#1C0F18]/85 text-white border border-white/10 shadow-md';
};
