import { Categoria, Producto, Rol, Usuario, AuthResponse, ColorItem, HeroTemplate } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('studiobj_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // --- Public Endpoints ---
  async getPublicCategorias(): Promise<Categoria[]> {
    const res = await fetch(`${API_BASE}/public/categorias`);
    if (!res.ok) throw new Error('Error al cargar categorías');
    return res.json();
  },

  async getPublicColores(): Promise<ColorItem[]> {
    const res = await fetch(`${API_BASE}/public/colores`);
    if (!res.ok) throw new Error('Error al cargar colores');
    return res.json();
  },

  async getPublicHero(): Promise<HeroTemplate> {
    const res = await fetch(`${API_BASE}/public/hero`);
    if (!res.ok) throw new Error('Error al cargar portada principal');
    return res.json();
  },

  async getPublicProductos(categoriaId?: string): Promise<Producto[]> {
    const url = categoriaId 
      ? `${API_BASE}/public/productos?categoria_id=${categoriaId}`
      : `${API_BASE}/public/productos`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al cargar productos');
    return res.json();
  },

  // --- Auth Endpoints ---
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Credenciales incorrectas');
    }
    return res.json();
  },

  async getMe(): Promise<Usuario> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Sesión inválida o expirada');
    return res.json();
  },

  // --- Admin Categorías ---
  async getAdminCategorias(): Promise<Categoria[]> {
    const res = await fetch(`${API_BASE}/admin/categorias`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al listar categorías');
    return res.json();
  },

  async createCategoria(data: { nombre: string; descripcion?: string; activo: boolean }): Promise<Categoria> {
    const res = await fetch(`${API_BASE}/admin/categorias`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al crear categoría');
    }
    return res.json();
  },

  async updateCategoria(id: string, data: Partial<Categoria>): Promise<Categoria> {
    const res = await fetch(`${API_BASE}/admin/categorias/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al actualizar categoría');
    return res.json();
  },

  async toggleCategoriaEstado(id: string, activo: boolean): Promise<Categoria> {
    const res = await fetch(`${API_BASE}/admin/categorias/${id}/estado`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ activo })
    });
    if (!res.ok) throw new Error('Error al cambiar estado de categoría');
    return res.json();
  },

  // --- Admin Colores ---
  async getAdminColores(): Promise<ColorItem[]> {
    const res = await fetch(`${API_BASE}/admin/colores`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al listar colores');
    return res.json();
  },

  async createColor(data: { nombre: string; hex: string; descripcion?: string; activo: boolean }): Promise<ColorItem> {
    const res = await fetch(`${API_BASE}/admin/colores`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al crear color');
    }
    return res.json();
  },

  async updateColor(id: string, data: Partial<ColorItem>): Promise<ColorItem> {
    const res = await fetch(`${API_BASE}/admin/colores/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al actualizar color');
    }
    return res.json();
  },

  async toggleColorEstado(id: string, activo: boolean): Promise<ColorItem> {
    const res = await fetch(`${API_BASE}/admin/colores/${id}/estado`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ activo })
    });
    if (!res.ok) throw new Error('Error al cambiar estado de color');
    return res.json();
  },

  // --- Admin Productos ---
  async getAdminProductos(): Promise<Producto[]> {
    const res = await fetch(`${API_BASE}/admin/productos`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al listar productos');
    return res.json();
  },

  async createProducto(data: Omit<Producto, 'id' | 'created_at' | 'updated_at' | 'categoria_nombre'>): Promise<Producto> {
    const res = await fetch(`${API_BASE}/admin/productos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al crear producto');
    }
    return res.json();
  },

  async updateProducto(id: string, data: Partial<Producto>): Promise<Producto> {
    const res = await fetch(`${API_BASE}/admin/productos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al actualizar producto');
    }
    return res.json();
  },

  async toggleProductoEstado(id: string, activo: boolean): Promise<Producto> {
    const res = await fetch(`${API_BASE}/admin/productos/${id}/estado`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ activo })
    });
    if (!res.ok) throw new Error('Error al cambiar estado del producto');
    return res.json();
  },

  // --- Admin Usuarios ---
  async getAdminUsuarios(): Promise<Usuario[]> {
    const res = await fetch(`${API_BASE}/admin/usuarios`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al listar usuarios');
    return res.json();
  },

  async createUsuario(data: { rol_id: string; nombre: string; email: string; password: string; activo: boolean }): Promise<Usuario> {
    const res = await fetch(`${API_BASE}/admin/usuarios`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al crear usuario');
    }
    return res.json();
  },

  async updateUsuario(id: string, data: Partial<{ rol_id: string; nombre: string; email: string; password?: string; activo: boolean }>): Promise<Usuario> {
    const res = await fetch(`${API_BASE}/admin/usuarios/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al actualizar usuario');
    return res.json();
  },

  async toggleUsuarioEstado(id: string, activo: boolean): Promise<Usuario> {
    const res = await fetch(`${API_BASE}/admin/usuarios/${id}/estado`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ activo })
    });
    if (!res.ok) throw new Error('Error al cambiar estado de usuario');
    return res.json();
  },

  // --- Admin Roles ---
  async getAdminRoles(): Promise<Rol[]> {
    const res = await fetch(`${API_BASE}/admin/roles`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al listar roles');
    return res.json();
  },

  async createRol(data: { nombre: string; descripcion?: string; modulos?: string; activo: boolean }): Promise<Rol> {
    const res = await fetch(`${API_BASE}/admin/roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al crear rol');
    }
    return res.json();
  },

  async updateRol(id: string, data: Partial<Rol>): Promise<Rol> {
    const res = await fetch(`${API_BASE}/admin/roles/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al actualizar rol');
    return res.json();
  },

  async toggleRolEstado(id: string, activo: boolean): Promise<Rol> {
    const res = await fetch(`${API_BASE}/admin/roles/${id}/estado`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ activo })
    });
    if (!res.ok) throw new Error('Error al cambiar estado de rol');
    return res.json();
  },

  // --- Admin Hero / Portada Plantillas ---
  async getAdminHeroPlantillas(): Promise<HeroTemplate[]> {
    const res = await fetch(`${API_BASE}/admin/hero/plantillas`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al listar plantillas de portada');
    return res.json();
  },

  async createHeroPlantilla(data: Omit<HeroTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<HeroTemplate> {
    const res = await fetch(`${API_BASE}/admin/hero/plantillas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al guardar plantilla');
    }
    return res.json();
  },

  async updateHeroPlantilla(id: string, data: Partial<HeroTemplate>): Promise<HeroTemplate> {
    const res = await fetch(`${API_BASE}/admin/hero/plantillas/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al actualizar plantilla');
    }
    return res.json();
  },

  async deleteHeroPlantilla(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/hero/plantillas/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al eliminar plantilla');
    }
  },

  async activateHeroPlantilla(id: string): Promise<HeroTemplate> {
    const res = await fetch(`${API_BASE}/admin/hero/plantillas/${id}/activar`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al activar plantilla en la web');
    return res.json();
  }
};
