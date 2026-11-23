import { Producto } from '../types';

/**
 * Retorna true si la etiqueta corresponde a "Top Ventas"
 */
export const isTopVentas = (etiqueta?: string | null): boolean => {
  if (!etiqueta) return false;
  const norm = etiqueta
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  return norm.includes('top');
};

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
 * Retorna las clases de estilo homogéneas para las etiquetas CRO en formato pill "fino":
 * Todas las etiquetas comparten el diseño y color base rosado/ciruela de la página (#311B2B + #D9A6B8)
 */
export const getBadgeStyles = (etiqueta?: string | null): string => {
  if (!etiqueta) return '';
  return 'bg-[#311B2B]/90 text-[#E8B2C4] border border-[#D9A6B8]/50 backdrop-blur-md shadow-[0_2px_8px_rgba(217,166,184,0.15)]';
};
