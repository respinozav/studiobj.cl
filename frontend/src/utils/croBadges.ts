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
 * Retorna las clases de estilo para las etiquetas CRO en formato pill "fino" (dark glassmorphism):
 * - Top Ventas: Fondo ciruela/rosado oscuro (#311B2B) + Borde fino rosado (#D9A6B8) + Texto rosado
 * - Últimas unidades: Fondo ámbar oscuro + Borde fino amarillo/ámbar + Texto amarillo
 * - Nuevo: Fondo esmeralda oscuro + Borde fino verde + Texto verde esmeralda
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
    return 'bg-[#311B2B]/90 text-[#E8B2C4] border border-[#D9A6B8]/50 backdrop-blur-md shadow-[0_2px_8px_rgba(217,166,184,0.15)]';
  }

  // 2. Últimas unidades: Amarillo (amber-950 fondo + borde ámbar + texto amarillo)
  if (norm.includes('ultima')) {
    return 'bg-amber-950/80 text-amber-300 border border-amber-500/50 backdrop-blur-md shadow-[0_2px_8px_rgba(245,158,11,0.15)]';
  }

  // 3. Nuevo: Verde (emerald-950 fondo + borde esmeralda + texto verde)
  if (norm.includes('nuevo')) {
    return 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 backdrop-blur-md shadow-[0_2px_8px_rgba(16,185,129,0.15)]';
  }

  // Fallback para cualquier otra etiqueta personalizada
  return 'bg-[#1C0F18]/85 text-white/90 border border-white/15 backdrop-blur-md shadow-sm';
};
