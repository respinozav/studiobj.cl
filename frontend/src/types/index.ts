export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ColorItem {
  id: string;
  nombre: string;
  hex: string;
  descripcion?: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductoVariante {
  color: string;
  color_hex?: string | null;
  imagenes: string[];
  tallas: string; // ej: "XS,S,M,L,XL"
}

export interface Producto {
  id: string;
  categoria_id: string;
  categoria_nombre?: string | null;
  nombre: string;
  color: string;
  talla: string; // ej: "XS,S,M,L,XL"
  imagen_base64: string;
  precio: number;
  precio_anterior?: number | null;
  etiqueta?: string | null; // 'Top Ventas', 'Últimas unidades', 'Nuevo'
  descripcion?: string | null;
  variantes?: ProductoVariante[];
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: string; // unique item cart id: `${product.id}-${selectedTalla}-${selectedColor}`
  productoId: string;
  nombre: string;
  precio: number;
  imagen_base64: string;
  talla: string;
  color: string;
  cantidad: number;
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion?: string | null;
  modulos?: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Usuario {
  id: string;
  rol_id: string;
  rol_nombre?: string | null;
  rol?: string;
  modulos?: string | null;
  nombre: string;
  email: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    rol_id?: string;
    rol_nombre?: string;
    nombre: string;
    email: string;
    rol: string;
    modulos?: string | null;
    activo: boolean;
  };
}

export interface HeroTemplate {
  id: string;
  nombre: string;
  tag: string;
  titulo_linea_1: string;
  titulo_linea_2: string;
  subtitulo: string;
  boton_texto: string;
  imagenes_fondo?: string[];
  es_predeterminada: boolean;
  created_at?: string;
  updated_at?: string;
}
