export interface ColorOption {
  nombre: string;
  hex: string;
}

export const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const;

export const LUXURY_PALETTE: ColorOption[] = [
  { nombre: 'Negro Onix', hex: '#18181b' },
  { nombre: 'Rosa Palo', hex: '#D9A6B8' },
  { nombre: 'Ciruela Profundo', hex: '#581c43' },
  { nombre: 'Mora Dark', hex: '#311B2B' },
  { nombre: 'Vino Tinto', hex: '#722F37' },
  { nombre: 'Púrpura Amatista', hex: '#4A2040' },
  { nombre: 'Azul Noche', hex: '#1e293b' },
  { nombre: 'Verde Esmeralda', hex: '#1e3a2f' },
  { nombre: 'Blanco Marfil', hex: '#f8fafc' },
  { nombre: 'Gris Carbón', hex: '#374151' },
];

export const getColorHex = (nombreColor: string): string => {
  if (!nombreColor) return '#18181b';
  const c = nombreColor.toLowerCase().trim();
  if (c.includes('negro') || c.includes('azabache') || c.includes('onix') || c.includes('mate') || c.includes('obsidian')) return '#18181b';
  if (c.includes('rosa') || c.includes('rose') || c.includes('palo') || c.includes('blush')) return '#D9A6B8';
  if (c.includes('oro rosa')) return '#b76e79';
  if (c.includes('ciruela')) return '#581c43';
  if (c.includes('mora')) return '#311B2B';
  if (c.includes('púrpura') || c.includes('amatista') || c.includes('amethyst') || c.includes('ahumado')) return '#4A2040';
  if (c.includes('vino') || c.includes('burgundy') || c.includes('eclipse')) return '#722F37';
  if (c.includes('azul') || c.includes('navy')) return '#1e293b';
  if (c.includes('verde') || c.includes('esmeralda') || c.includes('olivo')) return '#1e3a2f';
  if (c.includes('blanco') || c.includes('marfil')) return '#f8fafc';
  if (c.includes('gris') || c.includes('carbón')) return '#374151';
  return '#311B2B';
};

// Obtiene la lista de swatches de color para un producto
export const getProductColorPalette = (colorStr: string): ColorOption[] => {
  if (!colorStr) return [{ nombre: 'Negro Onix', hex: '#18181b' }];

  // Si tiene combinación con barra o coma (ej: "Negro Onix / Rosa Palo")
  const parts = colorStr.split(/[/,]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts.map((p) => ({
      nombre: p,
      hex: getColorHex(p),
    }));
  }

  // Si es un solo color, presentamos el principal y opciones armonizadas de la paleta
  const mainColor = colorStr.trim();
  const mainHex = getColorHex(mainColor);
  const options: ColorOption[] = [{ nombre: mainColor, hex: mainHex }];

  // Alternativas armónicas según el tono principal
  const alternates = LUXURY_PALETTE.filter(
    (p) => p.nombre.toLowerCase() !== mainColor.toLowerCase() && p.hex.toLowerCase() !== mainHex.toLowerCase()
  );

  // Agregar 2 colores armónicos adicionales
  if (alternates[0]) options.push(alternates[0]);
  if (alternates[1]) options.push(alternates[1]);

  return options;
};
