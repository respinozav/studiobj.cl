import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Producto, Categoria, Usuario, Rol, ProductoVariante, ColorItem, HeroTemplate } from '../types';
import {
  Package,
  Layers,
  Palette,
  Users,
  Shield,
  LogOut,
  Store,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Menu,
  Check,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Copy,
  Save
} from 'lucide-react';

const SYSTEM_MODULES = [
  { id: 'productos', label: 'Productos', desc: 'Prendas, fotos por color y tallas' },
  { id: 'categorias', label: 'Categorías', desc: 'Categorías del catálogo activewear' },
  { id: 'colores', label: 'Colores', desc: 'Paleta estándar de colores y código HEX' },
  { id: 'hero', label: 'Portada / Hero', desc: 'Textos principales, llamadas y plantillas' },
  { id: 'usuarios', label: 'Usuarios', desc: 'Cuentas de usuario y accesos' },
  { id: 'roles', label: 'Roles', desc: 'Definición de roles y asignación de menús' },
];
import { STANDARD_SIZES, LUXURY_PALETTE, getColorHex } from '../utils/colorsAndSizes';

export interface ProductVariantItem {
  color: string;
  color_hex: string;
  tallas: string[];
  fotosCount: number;
}

export const getProductAllVariants = (p: Producto): ProductVariantItem[] => {
  if (p.variantes && Array.isArray(p.variantes) && p.variantes.length > 0) {
    return p.variantes.map((v) => ({
      color: v.color || p.color || 'Único',
      color_hex: v.color_hex || getColorHex(v.color || p.color),
      tallas: v.tallas
        ? v.tallas.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean)
        : (p.talla ? p.talla.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean) : ['ÚNICA']),
      fotosCount: (v.imagenes || []).length,
    }));
  }
  const colorParts = p.color ? p.color.split(/[/,]/).map((s) => s.trim()).filter(Boolean) : ['Único'];
  const tallasArr = p.talla ? p.talla.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean) : ['ÚNICA'];
  return colorParts.map((c) => ({
    color: c,
    color_hex: getColorHex(c),
    tallas: tallasArr,
    fotosCount: p.imagen_base64 ? 1 : 0,
  }));
};

export const getProductAllSizes = (p: Producto): string[] => {
  const vars = getProductAllVariants(p);
  const sizeSet = new Set<string>();
  vars.forEach((v) => v.tallas.forEach((t) => sizeSet.add(t)));
  if (sizeSet.size === 0 && p.talla) {
    p.talla.split(',').forEach((t) => sizeSet.add(t.trim().toUpperCase()));
  }
  return Array.from(sizeSet);
};

export const AdminPanel: React.FC = () => {
  const { user, token, logout, isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'productos' | 'categorias' | 'colores' | 'hero' | 'usuarios' | 'roles'>('productos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Estados para Módulo Portada / Hero
  const [heroPlantillas, setHeroPlantillas] = useState<HeroTemplate[]>([]);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [isSavingHero, setIsSavingHero] = useState<boolean>(false);
  const [heroForm, setHeroForm] = useState<{
    id?: string;
    nombre: string;
    tag: string;
    titulo_linea_1: string;
    titulo_linea_2: string;
    subtitulo: string;
    boton_texto: string;
    es_predeterminada: boolean;
  }>({
    nombre: 'Campaña Dark Luxury 2026',
    tag: 'Edición Dark Luxury 2026',
    titulo_linea_1: 'Esculpe Tu Fuerza Con',
    titulo_linea_2: 'Elegancia Exclusiva',
    subtitulo: 'Prendas deportivas de compresión premium, tejidos transpirables y diseño sofisticado pensado para la mujer moderna en Chile.',
    boton_texto: 'Ver Colección',
    es_predeterminada: true,
  });

  // Estado datos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [colores, setColores] = useState<ColorItem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Compresor de imagen en navegador via HTML5 Canvas
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 900;
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('No context');
          ctx.drawImage(img, 0, 0, width, height);
          let webpData = canvas.toDataURL('image/webp', 0.82);
          if (!webpData.startsWith('data:image/webp')) {
            webpData = canvas.toDataURL('image/jpeg', 0.85);
          }
          resolve(webpData);
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Formulario de Producto con Variantes por Color e Imágenes
  const [prodForm, setProdForm] = useState<{
    categoria_id: string;
    nombre: string;
    color: string;
    talla: string;
    imagen_base64: string;
    precio: number;
    precio_anterior: string;
    etiqueta: string;
    descripcion: string;
    activo: boolean;
    variantes: ProductoVariante[];
  }>({
    categoria_id: '',
    nombre: '',
    color: 'Negro Onix',
    talla: 'XS,S,M,L,XL',
    imagen_base64: '',
    precio: 29990,
    precio_anterior: '',
    etiqueta: '',
    descripcion: '',
    activo: true,
    variantes: [
      {
        color: 'Negro Onix',
        color_hex: '#18181b',
        imagenes: [],
        tallas: 'XS,S,M,L,XL',
      },
    ],
  });

  const addVariant = () => {
    setProdForm((prev) => ({
      ...prev,
      variantes: [
        ...prev.variantes,
        {
          color: 'Rosa Palo',
          color_hex: '#D9A6B8',
          imagenes: [],
          tallas: 'XS,S,M,L',
        },
      ],
    }));
  };

  const removeVariant = (index: number) => {
    if (prodForm.variantes.length <= 1) {
      alert('El producto debe tener al menos un color con sus tallas e imágenes');
      return;
    }
    setProdForm((prev) => ({
      ...prev,
      variantes: prev.variantes.filter((_, i) => i !== index),
    }));
  };

  const updateVariantColor = (index: number, newColor: string, hex?: string) => {
    setProdForm((prev) => {
      const copy = [...prev.variantes];
      copy[index] = {
        ...copy[index],
        color: newColor,
        color_hex: hex || getColorHex(newColor),
      };
      return {
        ...prev,
        variantes: copy,
        color: index === 0 ? newColor : prev.color,
      };
    });
  };

  const toggleVariantTalla = (index: number, size: string) => {
    setProdForm((prev) => {
      const copy = [...prev.variantes];
      const rawCurrent = copy[index].tallas || '';
      let newSizes: string[];

      if (size === 'ÚNICA') {
        newSizes = ['ÚNICA'];
      } else {
        const currentWithoutUnica = rawCurrent
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter((s) => Boolean(s) && !s.includes('ÚNICA') && !s.includes('UNICA'));

        if (currentWithoutUnica.includes(size)) {
          newSizes = currentWithoutUnica.filter((s) => s !== size);
        } else {
          newSizes = [...currentWithoutUnica, size];
        }

        newSizes.sort((a, b) => {
          const idxA = (STANDARD_SIZES as readonly string[]).indexOf(a as any);
          const idxB = (STANDARD_SIZES as readonly string[]).indexOf(b as any);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          return a.localeCompare(b);
        });

        if (newSizes.length === 0) {
          newSizes = ['ÚNICA'];
        }
      }

      copy[index] = {
        ...copy[index],
        tallas: newSizes.join(','),
      };
      return {
        ...prev,
        variantes: copy,
        talla: index === 0 ? newSizes.join(',') : prev.talla,
      };
    });
  };

  const selectAllSizes = (index: number) => {
    setProdForm((prev) => {
      const copy = [...prev.variantes];
      const newSizes = [...STANDARD_SIZES];
      copy[index] = {
        ...copy[index],
        tallas: newSizes.join(','),
      };
      return {
        ...prev,
        variantes: copy,
        talla: index === 0 ? newSizes.join(',') : prev.talla,
      };
    });
  };

  const addImageToVariant = async (index: number, file: File) => {
    try {
      const b64 = await compressImageFile(file);
      setProdForm((prev) => {
        const copy = [...prev.variantes];
        copy[index] = {
          ...copy[index],
          imagenes: [...copy[index].imagenes, b64],
        };
        return {
          ...prev,
          variantes: copy,
          imagen_base64: prev.imagen_base64 || b64,
        };
      });
      setImagePreview(b64);
    } catch (e) {
      console.error('Error comprimiendo imagen', e);
    }
  };

  const removeImageFromVariant = (variantIdx: number, imageIdx: number) => {
    setProdForm((prev) => {
      const copy = [...prev.variantes];
      copy[variantIdx] = {
        ...copy[variantIdx],
        imagenes: copy[variantIdx].imagenes.filter((_, i) => i !== imageIdx),
      };
      const firstImg = copy[0]?.imagenes[0] || '';
      return {
        ...prev,
        variantes: copy,
        imagen_base64: firstImg,
      };
    });
  };

  // Compresor de imagen en navegador
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageSizeKB, setImageSizeKB] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formulario Categoría
  const [catForm, setCatForm] = useState({
    nombre: '',
    descripcion: '',
    activo: true,
  });

  // Formulario Color Estándar
  const [colorForm, setColorForm] = useState({
    nombre: '',
    hex: '#18181b',
    descripcion: '',
    activo: true,
  });

  // Formulario Usuario
  const [userForm, setUserForm] = useState({
    rol_id: '',
    nombre: '',
    email: '',
    password: '',
    activo: true,
  });

  // Formulario Rol
  const [rolForm, setRolForm] = useState({
    nombre: '',
    descripcion: '',
    modulos: 'productos,categorias,colores',
    activo: true,
  });

  // Búsqueda y Paginación
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Módulos permitidos según el rol del usuario logueado
  const allowedModules = isSuperAdmin
    ? ['productos', 'categorias', 'colores', 'usuarios', 'roles']
    : user?.modulos
    ? user.modulos.split(',').map((s) => s.trim().toLowerCase())
    : ['productos', 'categorias', 'colores'];

  useEffect(() => {
    if (!allowedModules.includes(activeTab)) {
      setActiveTab((allowedModules[0] as any) || 'productos');
    }
  }, [user, isSuperAdmin]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, pageSize]);

  const toggleModuloInRol = (modId: string) => {
    const current = rolForm.modulos
      ? rolForm.modulos.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      : [];
    const updated = current.includes(modId.toLowerCase())
      ? current.filter((m) => m !== modId.toLowerCase())
      : [...current, modId.toLowerCase()];
    setRolForm({ ...rolForm, modulos: updated.join(',') });
  };

  // Protección de ruta
  useEffect(() => {
    if (!authLoading && !token) {
      navigate('/admin/login');
    }
  }, [token, authLoading, navigate]);

  // Bloquear scroll de la página completa cuando el modal está abierto (solo scroll dentro del modal)
  useEffect(() => {
    if (isModalOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
      };
    }
  }, [isModalOpen]);

  // Carga de datos según pestaña
  const loadData = async () => {
    setLoadingData(true);
    setMessage(null);
    try {
      const [cats, prods, cols] = await Promise.all([
        api.getAdminCategorias(),
        api.getAdminProductos(),
        api.getAdminColores(),
      ]);
      setCategorias(cats);
      setProductos(prods);
      setColores(cols);

      // Cargar plantillas de portada / hero
      try {
        const heroList = await api.getAdminHeroPlantillas();
        setHeroPlantillas(heroList);
        const active = heroList.find((h) => h.es_predeterminada) || heroList[0];
        if (active) {
          setSelectedHeroId(active.id);
          setHeroForm({
            id: active.id,
            nombre: active.nombre,
            tag: active.tag,
            titulo_linea_1: active.titulo_linea_1,
            titulo_linea_2: active.titulo_linea_2,
            subtitulo: active.subtitulo,
            boton_texto: active.boton_texto,
            es_predeterminada: active.es_predeterminada,
          });
        }
      } catch (heroErr) {
        console.warn('Error al cargar plantillas hero:', heroErr);
      }
      if (isSuperAdmin || allowedModules.includes('usuarios') || allowedModules.includes('roles')) {
        try {
          const [users, rls] = await Promise.all([
            api.getAdminUsuarios(),
            api.getAdminRoles(),
          ]);
          setUsuarios(users);
          setRoles(rls);
        } catch (authErr: any) {
          console.warn('Error al cargar usuarios/roles:', authErr);
        }
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Error cargando datos' });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, isSuperAdmin, user?.modulos]);

  // Carga reactiva inmediata al seleccionar pestaña de usuarios, roles o hero
  useEffect(() => {
    if (token && activeTab === 'hero') {
      api.getAdminHeroPlantillas()
        .then((list) => {
          setHeroPlantillas(list);
          const active = list.find((h) => h.es_predeterminada) || list[0];
          if (active && !selectedHeroId) {
            setSelectedHeroId(active.id);
            setHeroForm({
              id: active.id,
              nombre: active.nombre,
              tag: active.tag,
              titulo_linea_1: active.titulo_linea_1,
              titulo_linea_2: active.titulo_linea_2,
              subtitulo: active.subtitulo,
              boton_texto: active.boton_texto,
              es_predeterminada: active.es_predeterminada,
            });
          }
        })
        .catch((err) => console.warn('Error cargando hero plantillas:', err));
    }
  }, [activeTab, token]);

  const loadHeroPlantillas = async () => {
    try {
      const list = await api.getAdminHeroPlantillas();
      setHeroPlantillas(list);
      return list;
    } catch (e: any) {
      console.warn('Error actualizando lista de hero:', e);
      return [];
    }
  };

  const handleSaveHero = async (activateImmediately: boolean) => {
    if (!heroForm.nombre.trim()) {
      setMessage({ type: 'error', text: 'Por favor ingresa un nombre para la plantilla' });
      return;
    }
    if (!heroForm.titulo_linea_1.trim() || !heroForm.titulo_linea_2.trim()) {
      setMessage({ type: 'error', text: 'Los títulos no pueden estar vacíos' });
      return;
    }
    setIsSavingHero(true);
    try {
      if (heroForm.id) {
        // Actualizar existente
        const updated = await api.updateHeroPlantilla(heroForm.id, {
          nombre: heroForm.nombre,
          tag: heroForm.tag,
          titulo_linea_1: heroForm.titulo_linea_1,
          titulo_linea_2: heroForm.titulo_linea_2,
          subtitulo: heroForm.subtitulo,
          boton_texto: heroForm.boton_texto,
        });
        if (activateImmediately && !updated.es_predeterminada) {
          await api.activateHeroPlantilla(updated.id);
        }
        setMessage({
          type: 'success',
          text: activateImmediately
            ? 'Plantilla guardada y activada en la web exitosamente'
            : 'Plantilla guardada exitosamente en la biblioteca',
        });
      } else {
        // Crear nueva
        const created = await api.createHeroPlantilla({
          nombre: heroForm.nombre,
          tag: heroForm.tag,
          titulo_linea_1: heroForm.titulo_linea_1,
          titulo_linea_2: heroForm.titulo_linea_2,
          subtitulo: heroForm.subtitulo,
          boton_texto: heroForm.boton_texto,
          es_predeterminada: activateImmediately,
        });
        setSelectedHeroId(created.id);
        setHeroForm((prev) => ({ ...prev, id: created.id, es_predeterminada: created.es_predeterminada }));
        setMessage({
          type: 'success',
          text: activateImmediately
            ? 'Nueva plantilla creada y activada en la web exitosamente'
            : 'Nueva plantilla guardada en la biblioteca',
        });
      }
      await loadHeroPlantillas();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Error al guardar plantilla' });
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleActivateHero = async (id: string) => {
    try {
      await api.activateHeroPlantilla(id);
      setMessage({ type: 'success', text: 'Plantilla activada como predeterminada en la web' });
      const updatedList = await loadHeroPlantillas();
      const current = updatedList.find((h) => h.id === id);
      if (current && selectedHeroId === id) {
        setHeroForm((prev) => ({ ...prev, es_predeterminada: true }));
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Error al activar plantilla' });
    }
  };

  const handleDeleteHero = async (id: string, name: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la plantilla "${name}"?`)) return;
    try {
      await api.deleteHeroPlantilla(id);
      setMessage({ type: 'success', text: 'Plantilla eliminada exitosamente' });
      if (selectedHeroId === id) {
        handleNewHeroTemplate();
      }
      await loadHeroPlantillas();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Error al eliminar plantilla' });
    }
  };

  const handleSelectHeroTemplate = (tpl: HeroTemplate) => {
    setSelectedHeroId(tpl.id);
    setHeroForm({
      id: tpl.id,
      nombre: tpl.nombre,
      tag: tpl.tag,
      titulo_linea_1: tpl.titulo_linea_1,
      titulo_linea_2: tpl.titulo_linea_2,
      subtitulo: tpl.subtitulo,
      boton_texto: tpl.boton_texto,
      es_predeterminada: tpl.es_predeterminada,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicateHeroTemplate = (tpl: HeroTemplate) => {
    setSelectedHeroId(null);
    setHeroForm({
      nombre: `${tpl.nombre} (Copia)`,
      tag: tpl.tag,
      titulo_linea_1: tpl.titulo_linea_1,
      titulo_linea_2: tpl.titulo_linea_2,
      subtitulo: tpl.subtitulo,
      boton_texto: tpl.boton_texto,
      es_predeterminada: false,
    });
    setMessage({ type: 'success', text: 'Plantilla duplicada. Edita el nombre y guarda para agregarla a la biblioteca.' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewHeroTemplate = () => {
    setSelectedHeroId(null);
    setHeroForm({
      nombre: 'Nueva Portada',
      tag: 'Edición Dark Luxury 2026',
      titulo_linea_1: 'Esculpe Tu Fuerza Con',
      titulo_linea_2: 'Elegancia Exclusiva',
      subtitulo: 'Prendas deportivas de compresión premium, tejidos transpirables y diseño sofisticado pensado para la mujer moderna en Chile.',
      boton_texto: 'Ver Colección',
      es_predeterminada: false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- COMPRESOR DE IMAGEN EN NAVEGADOR VIA HTML5 CANVAS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionar manteniendo proporción a un máximo de 900px en el lado mayor
        const maxDimension = 900;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Dibujar imagen escalada
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar a WebP 0.82 (con fallback a jpeg)
        let webpData = canvas.toDataURL('image/webp', 0.82);
        if (!webpData.startsWith('data:image/webp')) {
          webpData = canvas.toDataURL('image/jpeg', 0.85);
        }

        // Calcular tamaño final en KB
        const base64Length = webpData.length - (webpData.indexOf(',') + 1);
        const sizeInKB = Math.round((base64Length * 3) / 4 / 1024);

        setImagePreview(webpData);
        setImageSizeKB(sizeInKB);
        setProdForm((prev) => ({ ...prev, imagen_base64: webpData }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- TOGGLE SOFT DELETE ---
  const handleToggleEstadoProducto = async (id: string, actual: boolean) => {
    try {
      await api.toggleProductoEstado(id, !actual);
      setMessage({ type: 'success', text: `Producto ${!actual ? 'activado' : 'deshabilitado'} con éxito.` });
      loadData();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  const handleToggleEstadoCategoria = async (id: string, actual: boolean) => {
    try {
      await api.toggleCategoriaEstado(id, !actual);
      setMessage({ type: 'success', text: `Categoría ${!actual ? 'activada' : 'deshabilitada'} con éxito.` });
      loadData();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  const handleToggleEstadoColor = async (id: string, actual: boolean) => {
    try {
      await api.toggleColorEstado(id, !actual);
      setMessage({ type: 'success', text: `Color ${!actual ? 'activado' : 'deshabilitado'} con éxito.` });
      loadData();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  const handleToggleEstadoUsuario = async (id: string, actual: boolean) => {
    try {
      await api.toggleUsuarioEstado(id, !actual);
      setMessage({ type: 'success', text: `Usuario ${!actual ? 'activado' : 'deshabilitado'} con éxito.` });
      loadData();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  const handleToggleEstadoRol = async (id: string, actual: boolean) => {
    try {
      await api.toggleRolEstado(id, !actual);
      setMessage({ type: 'success', text: `Rol ${!actual ? 'activado' : 'deshabilitado'} con éxito.` });
      loadData();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  // --- SUBMIT PRODUCTO ---
  const handleSubmitProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryImg = prodForm.variantes[0]?.imagenes[0] || prodForm.imagen_base64;
    if (!primaryImg) {
      alert('Debes subir al menos una fotografía para la primera variante de color');
      return;
    }
    try {
      const payload: any = {
        categoria_id: prodForm.categoria_id,
        nombre: prodForm.nombre,
        color: prodForm.variantes[0]?.color || prodForm.color,
        talla: prodForm.variantes[0]?.tallas || prodForm.talla,
        imagen_base64: primaryImg,
        precio: Number(prodForm.precio),
        precio_anterior: prodForm.precio_anterior ? Number(prodForm.precio_anterior) : null,
        etiqueta: prodForm.etiqueta || null,
        descripcion: prodForm.descripcion || null,
        variantes: prodForm.variantes,
        activo: prodForm.activo,
      };

      if (editingItem) {
        await api.updateProducto(editingItem.id, payload);
        setMessage({ type: 'success', text: 'Producto y variantes actualizados con éxito' });
      } else {
        await api.createProducto(payload);
        setMessage({ type: 'success', text: 'Producto y variantes creados con éxito' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  // --- SUBMIT CATEGORÍA ---
  const handleSubmitCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateCategoria(editingItem.id, catForm);
        setMessage({ type: 'success', text: 'Categoría actualizada con éxito' });
      } else {
        await api.createCategoria(catForm);
        setMessage({ type: 'success', text: 'Categoría creada con éxito' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  // --- SUBMIT COLOR ---
  const handleSubmitColor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateColor(editingItem.id, colorForm);
        setMessage({ type: 'success', text: 'Color actualizado con éxito' });
      } else {
        await api.createColor(colorForm);
        setMessage({ type: 'success', text: 'Color creado con éxito' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  // --- SUBMIT USUARIO ---
  const handleSubmitUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const payload: any = {
          rol_id: userForm.rol_id,
          nombre: userForm.nombre,
          email: userForm.email,
          activo: userForm.activo,
        };
        if (userForm.password) payload.password = userForm.password;
        await api.updateUsuario(editingItem.id, payload);
        setMessage({ type: 'success', text: 'Usuario actualizado con éxito' });
      } else {
        await api.createUsuario(userForm);
        setMessage({ type: 'success', text: 'Usuario creado con éxito' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  // --- SUBMIT ROL ---
  const handleSubmitRol = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateRol(editingItem.id, rolForm);
        setMessage({ type: 'success', text: 'Rol actualizado con éxito' });
      } else {
        await api.createRol(rolForm);
        setMessage({ type: 'success', text: 'Rol creado con éxito' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  const getNewItemLabel = () => {
    switch (activeTab) {
      case 'productos':
        return 'Nuevo Producto';
      case 'categorias':
        return 'Nueva Categoría';
      case 'colores':
        return 'Nuevo Color';
      case 'hero':
        return 'Nueva Plantilla';
      case 'usuarios':
        return 'Nuevo Usuario';
      case 'roles':
        return 'Nuevo Rol';
      default:
        return 'Nuevo Registro';
    }
  };

  const openCreateModal = () => {
    if (activeTab === 'hero') {
      handleNewHeroTemplate();
      return;
    }
    setEditingItem(null);
    setImagePreview(null);
    setImageSizeKB(null);
    if (activeTab === 'productos') {
      setProdForm({
        categoria_id: categorias[0]?.id || '',
        nombre: '',
        color: 'Negro Onix',
        talla: 'XS,S,M,L,XL',
        imagen_base64: '',
        precio: 29990,
        precio_anterior: '',
        etiqueta: '',
        descripcion: '',
        activo: true,
        variantes: [
          {
            color: 'Negro Onix',
            color_hex: '#18181b',
            imagenes: [],
            tallas: 'XS,S,M,L,XL',
          },
        ],
      });
    } else if (activeTab === 'categorias') {
      setCatForm({ nombre: '', descripcion: '', activo: true });
    } else if (activeTab === 'colores') {
      setColorForm({ nombre: '', hex: '#18181b', descripcion: '', activo: true });
    } else if (activeTab === 'usuarios') {
      setUserForm({ rol_id: roles[0]?.id || '', nombre: '', email: '', password: '', activo: true });
    } else if (activeTab === 'roles') {
      setRolForm({ nombre: '', descripcion: '', modulos: 'productos,categorias,colores', activo: true });
    }
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'productos') {
      const initialVars: ProductoVariante[] =
        item.variantes && item.variantes.length > 0
          ? item.variantes
          : [
              {
                color: item.color,
                color_hex: getColorHex(item.color),
                imagenes: [item.imagen_base64].filter(Boolean),
                tallas: item.talla,
              },
            ];

      setProdForm({
        categoria_id: item.categoria_id,
        nombre: item.nombre,
        color: item.color,
        talla: item.talla,
        imagen_base64: item.imagen_base64,
        precio: item.precio,
        precio_anterior: item.precio_anterior ? String(item.precio_anterior) : '',
        etiqueta: item.etiqueta || '',
        descripcion: item.descripcion || '',
        activo: item.activo,
        variantes: initialVars,
      });
      setImagePreview(item.imagen_base64);
      setImageSizeKB(null);
    } else if (activeTab === 'categorias') {
      setCatForm({
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        activo: item.activo,
      });
    } else if (activeTab === 'colores') {
      setColorForm({
        nombre: item.nombre,
        hex: item.hex,
        descripcion: item.descripcion || '',
        activo: item.activo,
      });
    } else if (activeTab === 'usuarios') {
      setUserForm({
        rol_id: item.rol_id,
        nombre: item.nombre,
        email: item.email,
        password: '',
        activo: item.activo,
      });
    } else if (activeTab === 'roles') {
      setRolForm({
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        modulos: item.modulos || 'productos,categorias,colores',
        activo: item.activo,
      });
    }
    setIsModalOpen(true);
  };

  const formatCLP = (val: number) => '$' + val.toLocaleString('es-CL');

  // Filtrado por buscador
  const qClean = searchQuery.toLowerCase().trim();

  const filteredProductos = productos.filter((p) => {
    if (!qClean) return true;
    return (
      p.nombre.toLowerCase().includes(qClean) ||
      p.color.toLowerCase().includes(qClean) ||
      (p.categoria_nombre && p.categoria_nombre.toLowerCase().includes(qClean)) ||
      (p.etiqueta && p.etiqueta.toLowerCase().includes(qClean)) ||
      (p.talla && p.talla.toLowerCase().includes(qClean))
    );
  });

  const filteredCategorias = categorias.filter((c) => {
    if (!qClean) return true;
    return (
      c.nombre.toLowerCase().includes(qClean) ||
      (c.descripcion && c.descripcion.toLowerCase().includes(qClean))
    );
  });

  const filteredColores = colores.filter((col) => {
    if (!qClean) return true;
    return (
      col.nombre.toLowerCase().includes(qClean) ||
      col.hex.toLowerCase().includes(qClean) ||
      (col.descripcion && col.descripcion.toLowerCase().includes(qClean))
    );
  });

  const filteredUsuarios = usuarios.filter((u) => {
    if (!qClean) return true;
    return (
      u.nombre.toLowerCase().includes(qClean) ||
      u.email.toLowerCase().includes(qClean) ||
      (u.rol_nombre && u.rol_nombre.toLowerCase().includes(qClean))
    );
  });

  const filteredRoles = roles.filter((r) => {
    if (!qClean) return true;
    return (
      r.nombre.toLowerCase().includes(qClean) ||
      (r.descripcion && r.descripcion.toLowerCase().includes(qClean)) ||
      (r.modulos && r.modulos.toLowerCase().includes(qClean))
    );
  });

  const currentTotal =
    activeTab === 'productos'
      ? filteredProductos.length
      : activeTab === 'categorias'
      ? filteredCategorias.length
      : activeTab === 'colores'
      ? filteredColores.length
      : activeTab === 'hero'
      ? heroPlantillas.length
      : activeTab === 'usuarios'
      ? filteredUsuarios.length
      : filteredRoles.length;

  const totalPages = Math.max(1, Math.ceil(currentTotal / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, currentTotal);

  const paginatedProductos = filteredProductos.slice(startIndex, endIndex);
  const paginatedCategorias = filteredCategorias.slice(startIndex, endIndex);
  const paginatedColores = filteredColores.slice(startIndex, endIndex);
  const paginatedUsuarios = filteredUsuarios.slice(startIndex, endIndex);
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-[#1C0F18] text-white flex flex-col lg:flex-row">
      {/* Top Navbar en Móvil (Fijo Sticky Top con Hamburguesa y Acciones) */}
      <header className="lg:hidden glass-header px-3.5 py-2.5 flex items-center justify-between border-b border-[#D9A6B8]/20 bg-[#261521]/95 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg bg-[#311B2B] text-gray-200 hover:text-white hover:bg-[#D9A6B8] hover:text-[#1C0F18] transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="StudioBJ Logo"
              className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(217,166,184,0.3)]"
            />
            <span className="font-editorial text-base font-bold text-white tracking-wider">
              Studio<span className="text-[#D9A6B8]">BJ</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] text-[#D9A6B8] hover:text-[#1C0F18] border border-[#D9A6B8]/40 text-xs font-semibold transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{getNewItemLabel()}</span>
          </button>
          <Link
            to="/"
            className="p-1.5 rounded-lg bg-[#311B2B] text-gray-300 hover:text-white border border-white/10"
            title="Ir a tienda"
          >
            <Store className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Backdrop para móvil cuando el sidebar está abierto */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Clásico Izquierdo (Fijo en desktop / Drawer deslizable en móvil) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen w-64 bg-[#261521] border-r border-[#D9A6B8]/20 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Cabecera del Sidebar */}
        <div className="p-5 border-b border-[#D9A6B8]/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="StudioBJ Logo"
              className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(217,166,184,0.35)]"
            />
            <div>
              <h1 className="font-editorial text-xl font-bold text-white tracking-wider leading-none">
                Studio<span className="text-[#D9A6B8]">BJ</span>
              </h1>
              <span className="text-[10px] text-[#D9A6B8] uppercase tracking-widest font-semibold block mt-1">
                Panel de Control
              </span>
            </div>
          </div>
          {/* Botón cerrar sidebar en móvil */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#311B2B]"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegación de Módulos */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {/* Sección Principal: Módulos Solicitados (Productos y Categorías) */}
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2.5">
              Módulos Principales
            </span>
            <div className="space-y-1.5">
              {allowedModules.includes('productos') && (
                <button
                  onClick={() => {
                    setActiveTab('productos');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    activeTab === 'productos'
                      ? 'bg-[#D9A6B8] text-[#1C0F18] shadow-md shadow-[#D9A6B8]/20'
                      : 'text-gray-300 hover:text-white hover:bg-[#311B2B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4" />
                    <span>Productos</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      activeTab === 'productos'
                        ? 'bg-[#1C0F18] text-[#D9A6B8]'
                        : 'bg-[#311B2B] text-gray-400'
                    }`}
                  >
                    {productos.length}
                  </span>
                </button>
              )}

              {allowedModules.includes('categorias') && (
                <button
                  onClick={() => {
                    setActiveTab('categorias');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    activeTab === 'categorias'
                      ? 'bg-[#D9A6B8] text-[#1C0F18] shadow-md shadow-[#D9A6B8]/20'
                      : 'text-gray-300 hover:text-white hover:bg-[#311B2B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4" />
                    <span>Categorías</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      activeTab === 'categorias'
                        ? 'bg-[#1C0F18] text-[#D9A6B8]'
                        : 'bg-[#311B2B] text-gray-400'
                    }`}
                  >
                    {categorias.length}
                  </span>
                </button>
              )}

              {allowedModules.includes('colores') && (
                <button
                  onClick={() => {
                    setActiveTab('colores');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    activeTab === 'colores'
                      ? 'bg-[#D9A6B8] text-[#1C0F18] shadow-md shadow-[#D9A6B8]/20'
                      : 'text-gray-300 hover:text-white hover:bg-[#311B2B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Palette className="w-4 h-4" />
                    <span>Colores</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      activeTab === 'colores'
                        ? 'bg-[#1C0F18] text-[#D9A6B8]'
                        : 'bg-[#311B2B] text-gray-400'
                    }`}
                  >
                    {colores.length}
                  </span>
                </button>
              )}

              {(isSuperAdmin || allowedModules.includes('hero') || allowedModules.includes('productos')) && (
                <button
                  onClick={() => {
                    setActiveTab('hero');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    activeTab === 'hero'
                      ? 'bg-[#D9A6B8] text-[#1C0F18] shadow-md shadow-[#D9A6B8]/20'
                      : 'text-gray-300 hover:text-white hover:bg-[#311B2B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Portada / Hero</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      activeTab === 'hero'
                        ? 'bg-[#1C0F18] text-[#D9A6B8]'
                        : 'bg-[#311B2B] text-gray-400'
                    }`}
                  >
                    {heroPlantillas.length}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Sección Secundaria: Sistema y Roles */}
          {(allowedModules.includes('usuarios') || allowedModules.includes('roles')) && (
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2.5">
                Sistema & Accesos
              </span>
              <div className="space-y-1.5">
                {allowedModules.includes('usuarios') && (
                  <button
                    onClick={() => {
                      setActiveTab('usuarios');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      activeTab === 'usuarios'
                        ? 'bg-[#D9A6B8] text-[#1C0F18] shadow-md shadow-[#D9A6B8]/20'
                        : 'text-gray-300 hover:text-white hover:bg-[#311B2B]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4" />
                      <span>Usuarios</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        activeTab === 'usuarios'
                          ? 'bg-[#1C0F18] text-[#D9A6B8]'
                          : 'bg-[#311B2B] text-gray-400'
                      }`}
                    >
                      {usuarios.length}
                    </span>
                  </button>
                )}

                {allowedModules.includes('roles') && (
                  <button
                    onClick={() => {
                      setActiveTab('roles');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      activeTab === 'roles'
                        ? 'bg-[#D9A6B8] text-[#1C0F18] shadow-md shadow-[#D9A6B8]/20'
                        : 'text-gray-300 hover:text-white hover:bg-[#311B2B]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4" />
                      <span>Roles</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        activeTab === 'roles'
                          ? 'bg-[#1C0F18] text-[#D9A6B8]'
                          : 'bg-[#311B2B] text-gray-400'
                      }`}
                    >
                      {roles.length}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer del Sidebar con Perfil y Acciones */}
        <div className="p-3 border-t border-[#D9A6B8]/15 bg-[#1C0F18]/50 space-y-2.5">
          {/* Card de Usuario */}
          <div className="p-2.5 rounded-xl bg-[#261521] border border-[#D9A6B8]/20 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#311B2B] border border-[#D9A6B8]/40 flex items-center justify-center text-[#D9A6B8] font-bold text-xs uppercase">
              {user?.nombre ? user.nombre.charAt(0) : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.nombre || 'Admin'}</div>
              <div className="text-[10px] text-[#D9A6B8] truncate">{user?.rol_nombre || 'Admin'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              to="/"
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] hover:text-[#1C0F18] text-gray-300 font-semibold transition-colors text-[11px]"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Tienda</span>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 font-semibold transition-colors text-[11px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Contenedor Principal de la Página (Lado Derecho) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Header Fijo en Desktop (Sticky Top) */}
        <header className="hidden lg:flex glass-header px-8 py-3.5 items-center justify-between border-b border-[#D9A6B8]/20 bg-[#261521]/90 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h2 className="font-editorial text-2xl font-bold text-white capitalize">
              Gestión de {activeTab === 'hero' ? 'Portada' : activeTab}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#311B2B] text-[#D9A6B8] font-bold border border-[#D9A6B8]/30">
              {activeTab === 'productos'
                ? productos.length
                : activeTab === 'categorias'
                ? categorias.length
                : activeTab === 'colores'
                ? colores.length
                : activeTab === 'hero'
                ? heroPlantillas.length
                : activeTab === 'usuarios'
                ? usuarios.length
                : roles.length}{' '}
              registros
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] text-[#D9A6B8] hover:text-[#1C0F18] border border-[#D9A6B8]/40 hover:border-[#D9A6B8] text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{getNewItemLabel()}</span>
            </button>

            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] hover:text-[#1C0F18] text-gray-200 hover:border-[#D9A6B8] border border-white/10 text-xs font-semibold transition-all shadow-sm"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Ver Tienda</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-8 py-5 pb-24 lg:pb-8">
        {/* Banner de Mensajes */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center justify-between text-xs ${
              message.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/80 border border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)}>
              <X className="w-4 h-4 opacity-70 hover:opacity-100" />
            </button>
          </div>
        )}

        {/* Acciones de la Pestaña en Móvil */}
        <div className="flex lg:hidden items-center justify-between mb-4">
          <div>
            <h2 className="font-editorial text-xl font-bold text-white capitalize">
              {activeTab === 'hero' ? 'Portada' : activeTab}
            </h2>
            <p className="text-[11px] text-gray-400">
              {currentTotal} registros encontrados
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] text-[#D9A6B8] hover:text-[#1C0F18] border border-[#D9A6B8]/40 text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{getNewItemLabel()}</span>
          </button>
        </div>

        {/* Barra de Búsqueda y Filtros en Tiempo Real */}
        <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Buscar en ${activeTab} por nombre, detalles...`}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#261521] border border-[#D9A6B8]/25 text-white text-xs placeholder-gray-400 focus:outline-none focus:border-[#D9A6B8] transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{currentTotal} {currentTotal === 1 ? 'registro' : 'registros'}</span>
            {searchQuery && (
              <span className="text-[#D9A6B8] font-semibold">(filtrados)</span>
            )}
          </div>
        </div>

        {/* Loading Spinner */}
        {loadingData ? (
          <div className="py-20 flex justify-center items-center text-[#D9A6B8]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* --- TAB PRODUCTOS --- */}
            {activeTab === 'productos' && (
              <div className="space-y-4">
                {/* 1. Vista Móvil (Cards Táctiles Mobile-First) */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {paginatedProductos.map((p) => (
                    <div
                      key={p.id}
                      className="glass-card rounded-xl border border-[#D9A6B8]/20 bg-[#261521]/95 p-3.5 shadow-lg flex flex-col justify-between gap-3"
                    >
                      <div className="flex gap-3 items-start">
                        {/* Miniatura */}
                        <img
                          src={p.imagen_base64}
                          alt={p.nombre}
                          className="w-16 h-20 object-cover rounded-lg bg-[#1C0F18] border border-[#D9A6B8]/25 flex-shrink-0"
                        />
                        {/* Info Principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold text-[#D9A6B8] uppercase tracking-wider truncate">
                              {p.categoria_nombre || 'Sin categoría'}
                            </span>
                            {p.etiqueta && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#311B2B] text-[#D9A6B8] border border-[#D9A6B8]/30 font-bold whitespace-nowrap">
                                {p.etiqueta}
                              </span>
                            )}
                          </div>

                          <h3 className="font-editorial text-base font-semibold text-white leading-tight">
                            {p.nombre}
                          </h3>

                          {/* Colores y Tallas por cada variante */}
                          <div className="mt-2 space-y-1.5">
                            {getProductAllVariants(p).map((v, vIdx) => (
                              <div
                                key={vIdx}
                                className="p-1.5 rounded-lg bg-[#1C0F18]/90 border border-[#D9A6B8]/20 flex flex-col gap-1"
                              >
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-sm flex-shrink-0"
                                    style={{ backgroundColor: v.color_hex }}
                                  />
                                  <span className="font-semibold text-gray-100">{v.color}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1 pl-5">
                                  {v.tallas.map((t, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#261521] border border-[#D9A6B8]/30 text-[9px] font-bold text-[#D9A6B8]"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-sm font-bold text-white price-tag">
                              {formatCLP(p.precio)}
                            </span>
                            {p.precio_anterior && p.precio_anterior > p.precio && (
                              <span className="text-[11px] text-gray-500 line-through price-tag">
                                {formatCLP(p.precio_anterior)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Barra de Estado y Acciones Táctiles */}
                      <div className="pt-2 border-t border-[#D9A6B8]/15 flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                            p.activo
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {p.activo ? '● Activo' : '○ Deshabilitado'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] hover:text-[#1C0F18] text-white text-xs font-semibold transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => handleToggleEstadoProducto(p.id, p.activo)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              p.activo
                                ? 'bg-rose-950/50 hover:bg-rose-900 border border-rose-500/30 text-rose-300'
                                : 'bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300'
                            }`}
                            title={p.activo ? 'Deshabilitar producto' : 'Activar producto'}
                          >
                            {p.activo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{p.activo ? 'Ocultar' : 'Activar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. Vista Desktop (Tabla Clásica Completa) */}
                <div className="hidden md:block glass-card rounded-xl border border-[#D9A6B8]/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead className="bg-[#311B2B] text-[#D9A6B8] uppercase text-[10px] tracking-wider border-b border-[#D9A6B8]/20">
                        <tr>
                          <th className="p-3">Foto</th>
                          <th className="p-3">Nombre & Color</th>
                          <th className="p-3">Categoría</th>
                          <th className="p-3">Tallas</th>
                          <th className="p-3">Precio</th>
                          <th className="p-3">Etiqueta</th>
                          <th className="p-3">Estado</th>
                          <th className="p-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D9A6B8]/10 bg-[#261521]/60">
                        {paginatedProductos.map((p) => (
                          <tr key={p.id} className="hover:bg-[#311B2B]/40 transition-colors">
                            <td className="p-3">
                              <img
                                src={p.imagen_base64}
                                alt={p.nombre}
                                className="w-12 h-14 object-cover rounded bg-[#1C0F18] border border-[#D9A6B8]/20"
                              />
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-white text-sm">{p.nombre}</div>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {getProductAllVariants(p).map((v, vIdx) => (
                                  <div
                                    key={vIdx}
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#1C0F18]/90 border border-[#D9A6B8]/25 text-[11px]"
                                  >
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-white/40 shadow-inner flex-shrink-0"
                                      style={{ backgroundColor: v.color_hex }}
                                      title={v.color}
                                    />
                                    <span className="font-medium text-gray-200">{v.color}</span>
                                    <span className="text-[#D9A6B8] font-mono text-[10px]">
                                      ({v.tallas.join(', ')})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 font-medium text-[#D9A6B8]">
                              {p.categoria_nombre || '-'}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap items-center gap-1">
                                {getProductAllSizes(p).map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-[10px] font-bold text-gray-200"
                                  >
                                    <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 font-bold text-white price-tag">
                              {formatCLP(p.precio)}
                              {p.precio_anterior && (
                                <div className="text-[10px] text-gray-400 line-through">
                                  {formatCLP(p.precio_anterior)}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              {p.etiqueta ? (
                                <span className="px-2 py-0.5 rounded-full bg-[#311B2B] text-[#D9A6B8] text-[10px] font-bold border border-[#D9A6B8]/30">
                                  {p.etiqueta}
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.activo
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {p.activo ? 'Activo' : 'Deshabilitado'}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 rounded hover:bg-[#311B2B] text-gray-300 hover:text-white"
                                title="Editar producto"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleEstadoProducto(p.id, p.activo)}
                                className={`p-1.5 rounded transition-colors ${
                                  p.activo
                                    ? 'text-emerald-400 hover:bg-rose-950 hover:text-rose-400'
                                    : 'text-gray-400 hover:bg-emerald-950 hover:text-emerald-400'
                                }`}
                                title={p.activo ? 'Deshabilitar producto (Soft Delete)' : 'Activar producto'}
                              >
                                {p.activo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB CATEGORÍAS --- */}
            {activeTab === 'categorias' && (
              <div className="space-y-4">
                {/* 1. Vista Móvil (Cards Táctiles) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
                  {paginatedCategorias.map((c) => (
                    <div
                      key={c.id}
                      className="glass-card rounded-xl border border-[#D9A6B8]/20 bg-[#261521]/95 p-4 shadow-lg flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h3 className="font-editorial text-lg font-bold text-white">
                            {c.nombre}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.activo
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {c.activo ? 'Activo' : 'Deshabilitado'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {c.descripcion || 'Sin descripción'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#D9A6B8]/15 flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] hover:text-[#1C0F18] text-white text-xs font-semibold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleToggleEstadoCategoria(c.id, c.activo)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            c.activo
                              ? 'bg-rose-950/50 hover:bg-rose-900 border border-rose-500/30 text-rose-300'
                              : 'bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300'
                          }`}
                        >
                          {c.activo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{c.activo ? 'Deshabilitar' : 'Activar'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. Vista Desktop (Tabla Clásica) */}
                <div className="hidden md:block glass-card rounded-xl border border-[#D9A6B8]/20 overflow-hidden">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#311B2B] text-[#D9A6B8] uppercase text-[10px] tracking-wider border-b border-[#D9A6B8]/20">
                      <tr>
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9A6B8]/10 bg-[#261521]/60">
                      {paginatedCategorias.map((c) => (
                        <tr key={c.id} className="hover:bg-[#311B2B]/40 transition-colors">
                          <td className="p-3 font-semibold text-white">{c.nombre}</td>
                          <td className="p-3 text-gray-400">{c.descripcion || '-'}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.activo
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {c.activo ? 'Activo' : 'Deshabilitado'}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(c)}
                              className="p-1.5 rounded hover:bg-[#311B2B] text-gray-300 hover:text-white"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleEstadoCategoria(c.id, c.activo)}
                              className={`p-1.5 rounded transition-colors ${
                                c.activo
                                  ? 'text-emerald-400 hover:bg-rose-950 hover:text-rose-400'
                                  : 'text-gray-400 hover:bg-emerald-950 hover:text-emerald-400'
                              }`}
                              title={c.activo ? 'Deshabilitar' : 'Activar'}
                            >
                              {c.activo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- TAB COLORES --- */}
            {activeTab === 'colores' && (
              <div className="space-y-4">
                {/* 1. Vista Móvil (Cards Táctiles) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
                  {paginatedColores.map((col) => (
                    <div
                      key={col.id}
                      className="glass-card rounded-xl border border-[#D9A6B8]/20 bg-[#261521]/95 p-4 shadow-lg flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-7 h-7 rounded-full border-2 border-white/60 shadow-md flex-shrink-0"
                              style={{ backgroundColor: col.hex }}
                            />
                            <div>
                              <h3 className="font-editorial text-base font-bold text-white">
                                {col.nombre}
                              </h3>
                              <span className="font-mono text-xs text-[#D9A6B8] uppercase">
                                {col.hex}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              col.activo
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {col.activo ? 'Activo' : 'Deshabilitado'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {col.descripcion || 'Sin descripción'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#D9A6B8]/15 flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(col)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] hover:text-[#1C0F18] text-white text-xs font-semibold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleToggleEstadoColor(col.id, col.activo)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            col.activo
                              ? 'bg-rose-950/50 hover:bg-rose-900 border border-rose-500/30 text-rose-300'
                              : 'bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300'
                          }`}
                        >
                          {col.activo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{col.activo ? 'Deshabilitar' : 'Activar'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. Vista Desktop (Tabla Clásica) */}
                <div className="hidden md:block glass-card rounded-xl border border-[#D9A6B8]/20 overflow-hidden">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#311B2B] text-[#D9A6B8] uppercase text-[10px] tracking-wider border-b border-[#D9A6B8]/20">
                      <tr>
                        <th className="p-3 w-16">Muestra</th>
                        <th className="p-3">Nombre del Color</th>
                        <th className="p-3">Código Hex</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9A6B8]/10 bg-[#261521]/60">
                      {paginatedColores.map((col) => (
                        <tr key={col.id} className="hover:bg-[#311B2B]/40 transition-colors">
                          <td className="p-3">
                            <span
                              className="inline-block w-6 h-6 rounded-full border-2 border-white/60 shadow-md"
                              style={{ backgroundColor: col.hex }}
                              title={col.hex}
                            />
                          </td>
                          <td className="p-3 font-semibold text-white">{col.nombre}</td>
                          <td className="p-3 font-mono text-[#D9A6B8] uppercase">{col.hex}</td>
                          <td className="p-3 text-gray-400">{col.descripcion || '-'}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                col.activo
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {col.activo ? 'Activo' : 'Deshabilitado'}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(col)}
                              className="p-1.5 rounded hover:bg-[#311B2B] text-gray-300 hover:text-white"
                              title="Editar color"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleEstadoColor(col.id, col.activo)}
                              className={`p-1.5 rounded transition-colors ${
                                col.activo
                                  ? 'text-emerald-400 hover:bg-rose-950 hover:text-rose-400'
                                  : 'text-gray-400 hover:bg-emerald-950 hover:text-emerald-400'
                              }`}
                              title={col.activo ? 'Deshabilitar color' : 'Activar color'}
                            >
                              {col.activo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- TAB USUARIOS --- */}
            {activeTab === 'usuarios' && (isSuperAdmin || allowedModules.includes('usuarios')) && (
              <div className="space-y-4">
                {/* 1. Vista Móvil (Cards Táctiles) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
                  {paginatedUsuarios.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 glass-card rounded-xl border border-[#D9A6B8]/20 col-span-full">
                      No se encontraron usuarios
                    </div>
                  ) : (
                    paginatedUsuarios.map((u) => (
                    <div
                      key={u.id}
                      className="glass-card rounded-xl border border-[#D9A6B8]/20 bg-[#261521]/95 p-4 shadow-lg flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#311B2B] border border-[#D9A6B8]/40 flex items-center justify-center text-xs font-bold text-[#D9A6B8]">
                              {u.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white text-sm">{u.nombre}</h3>
                              <p className="text-[11px] text-gray-400">{u.email}</p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.activo
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="text-xs text-[#D9A6B8] mt-1">
                          Rol: <span className="font-bold text-white">{u.rol_nombre || '-'}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#D9A6B8]/15 flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] hover:text-[#1C0F18] text-white text-xs font-semibold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleToggleEstadoUsuario(u.id, u.activo)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            u.activo
                              ? 'bg-rose-950/50 hover:bg-rose-900 border border-rose-500/30 text-rose-300'
                              : 'bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300'
                          }`}
                        >
                          {u.activo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{u.activo ? 'Deshabilitar' : 'Activar'}</span>
                        </button>
                      </div>
                    </div>
                  )))}
                </div>

                {/* 2. Vista Desktop (Tabla Clásica) */}
                <div className="hidden md:block glass-card rounded-xl border border-[#D9A6B8]/20 overflow-hidden">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#311B2B] text-[#D9A6B8] uppercase text-[10px] tracking-wider border-b border-[#D9A6B8]/20">
                      <tr>
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Correo</th>
                        <th className="p-3">Rol</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9A6B8]/10 bg-[#261521]/60">
                      {paginatedUsuarios.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400">
                            No se encontraron usuarios
                          </td>
                        </tr>
                      ) : (
                        paginatedUsuarios.map((u) => (
                        <tr key={u.id} className="hover:bg-[#311B2B]/40 transition-colors">
                          <td className="p-3 font-semibold text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#311B2B] border border-[#D9A6B8]/30 flex items-center justify-center text-[10px] font-bold text-[#D9A6B8]">
                              {u.nombre.charAt(0).toUpperCase()}
                            </span>
                            <span>{u.nombre}</span>
                          </td>
                          <td className="p-3">{u.email}</td>
                          <td className="p-3 text-[#D9A6B8] font-medium">{u.rol_nombre || '-'}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.activo
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {u.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-1.5 rounded hover:bg-[#311B2B] text-gray-300 hover:text-white"
                              title="Editar usuario"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleEstadoUsuario(u.id, u.activo)}
                              className={`p-1.5 rounded transition-colors ${
                                u.activo
                                  ? 'text-emerald-400 hover:bg-rose-950 hover:text-rose-400'
                                  : 'text-gray-400 hover:bg-emerald-950 hover:text-emerald-400'
                              }`}
                              title={u.activo ? 'Deshabilitar usuario' : 'Activar usuario'}
                            >
                              {u.activo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- TAB ROLES --- */}
            {activeTab === 'roles' && (isSuperAdmin || allowedModules.includes('roles')) && (
              <div className="space-y-4">
                {/* 1. Vista Móvil (Cards Táctiles) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
                  {paginatedRoles.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 glass-card rounded-xl border border-[#D9A6B8]/20 col-span-full">
                      No se encontraron roles
                    </div>
                  ) : (
                    paginatedRoles.map((r) => (
                    <div
                      key={r.id}
                      className="glass-card rounded-xl border border-[#D9A6B8]/20 bg-[#261521]/95 p-4 shadow-lg flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-white text-base flex items-center gap-2">
                            <Shield className="w-4 h-4 text-[#D9A6B8]" />
                            {r.nombre}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.activo
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {r.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                          {r.descripcion || 'Sin descripción'}
                        </p>
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 block mb-1 uppercase tracking-wider">
                            Módulos con Acceso:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {(r.modulos || 'productos,categorias,colores')
                              .split(',')
                              .map((m, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-full bg-[#1C0F18] border border-[#D9A6B8]/30 text-[10px] font-bold text-[#D9A6B8] uppercase"
                                >
                                  {m.trim()}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#D9A6B8]/15 flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(r)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] hover:text-[#1C0F18] text-white text-xs font-semibold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleToggleEstadoRol(r.id, r.activo)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            r.activo
                              ? 'bg-rose-950/50 hover:bg-rose-900 border border-rose-500/30 text-rose-300'
                              : 'bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300'
                          }`}
                        >
                          {r.activo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{r.activo ? 'Deshabilitar' : 'Activar'}</span>
                        </button>
                      </div>
                    </div>
                  )))}
                </div>

                {/* 2. Vista Desktop (Tabla Clásica) */}
                <div className="hidden md:block glass-card rounded-xl border border-[#D9A6B8]/20 overflow-hidden">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#311B2B] text-[#D9A6B8] uppercase text-[10px] tracking-wider border-b border-[#D9A6B8]/20">
                      <tr>
                        <th className="p-3">Nombre del Rol</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3">Módulos Asignados</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9A6B8]/10 bg-[#261521]/60">
                      {paginatedRoles.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400">
                            No se encontraron roles
                          </td>
                        </tr>
                      ) : (
                        paginatedRoles.map((r) => (
                        <tr key={r.id} className="hover:bg-[#311B2B]/40 transition-colors">
                          <td className="p-3 font-semibold text-white flex items-center gap-2">
                            <Shield className="w-4 h-4 text-[#D9A6B8]" />
                            <span>{r.nombre}</span>
                          </td>
                          <td className="p-3 text-gray-400">{r.descripcion || '-'}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {(r.modulos || 'productos,categorias,colores')
                                .split(',')
                                .map((m, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-full bg-[#1C0F18] border border-[#D9A6B8]/30 text-[10px] font-bold text-[#D9A6B8] uppercase"
                                  >
                                    {m.trim()}
                                  </span>
                                ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.activo
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {r.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(r)}
                              className="p-1.5 rounded hover:bg-[#311B2B] text-gray-300 hover:text-white"
                              title="Editar rol"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleEstadoRol(r.id, r.activo)}
                              className={`p-1.5 rounded transition-colors ${
                                r.activo
                                  ? 'text-emerald-400 hover:bg-rose-950 hover:text-rose-400'
                                  : 'text-gray-400 hover:bg-emerald-950 hover:text-emerald-400'
                              }`}
                              title={r.activo ? 'Deshabilitar rol' : 'Activar rol'}
                            >
                              {r.activo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- MÓDULO PORTADA / HERO (Textos, Vista Previa en Vivo y Biblioteca de Plantillas) --- */}
            {activeTab === 'hero' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Grilla: Editor a la Izquierda | Vista Previa en Vivo a la Derecha */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Columna Izquierda: Formulario de Configuración (5 cols) */}
                  <div className="lg:col-span-5 glass-card p-5 sm:p-6 rounded-2xl border border-[#D9A6B8]/20 bg-[#261521]/90 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#D9A6B8]/15 pb-3">
                      <h4 className="text-xs uppercase tracking-widest font-bold text-[#D9A6B8] flex items-center gap-2">
                        <span>Editor de Textos</span>
                        {heroForm.id && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1C0F18] text-gray-400 font-normal">
                            Modo Edición
                          </span>
                        )}
                      </h4>
                      {heroForm.es_predeterminada && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Activa en Web</span>
                        </span>
                      )}
                    </div>

                    {/* 1. Nombre de la Plantilla */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Nombre de la Plantilla *
                      </label>
                      <input
                        type="text"
                        required
                        value={heroForm.nombre}
                        onChange={(e) => setHeroForm({ ...heroForm, nombre: e.target.value })}
                        placeholder="Ej: Campaña Dark Luxury 2026, Cyber StudioBJ..."
                        className="w-full px-3 py-2 rounded-lg bg-[#1C0F18] border border-[#D9A6B8]/30 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#D9A6B8] transition-colors"
                      />
                    </div>

                    {/* 1.5. Logo informativo (Siempre fijo) */}
                    <div className="p-3 rounded-xl bg-[#1C0F18]/80 border border-[#D9A6B8]/15 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src="/logo-128.png"
                          alt="Logo StudioBJ"
                          className="w-10 h-10 object-contain rounded-full border border-[#D9A6B8]/40 shadow-sm"
                        />
                        <div>
                          <p className="text-xs font-semibold text-white">Logotipo Oficial StudioBJ</p>
                          <p className="text-[10px] text-gray-400">Siempre fijo en la parte superior del banner</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#311B2B] text-[#D9A6B8] font-bold uppercase tracking-wider">
                        Fijo
                      </span>
                    </div>

                    {/* 2. TAG / Badge de Temporada */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Badge Superior / TAG *
                      </label>
                      <input
                        type="text"
                        required
                        value={heroForm.tag}
                        onChange={(e) => setHeroForm({ ...heroForm, tag: e.target.value })}
                        placeholder="Ej: Edición Dark Luxury 2026"
                        className="w-full px-3 py-2 rounded-lg bg-[#1C0F18] border border-[#D9A6B8]/30 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#D9A6B8] transition-colors"
                      />
                    </div>

                    {/* 3. Título Línea 1 */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Título Principal (Línea 1) *
                      </label>
                      <input
                        type="text"
                        required
                        value={heroForm.titulo_linea_1}
                        onChange={(e) => setHeroForm({ ...heroForm, titulo_linea_1: e.target.value })}
                        placeholder="Ej: Esculpe Tu Fuerza Con"
                        className="w-full px-3 py-2 rounded-lg bg-[#1C0F18] border border-[#D9A6B8]/30 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#D9A6B8] transition-colors"
                      />
                    </div>

                    {/* 4. Título Línea 2 (Cursiva y Destacada en Rosa) */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Título Destacado (Línea 2 - En Cursiva y Rosa) *
                      </label>
                      <input
                        type="text"
                        required
                        value={heroForm.titulo_linea_2}
                        onChange={(e) => setHeroForm({ ...heroForm, titulo_linea_2: e.target.value })}
                        placeholder="Ej: Elegancia Exclusiva"
                        className="w-full px-3 py-2 rounded-lg bg-[#1C0F18] border border-[#D9A6B8]/30 text-[#D9A6B8] text-xs font-medium placeholder-gray-500 focus:outline-none focus:border-[#D9A6B8] transition-colors"
                      />
                    </div>

                    {/* 5. Subtítulo */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Subtítulo Descriptivo *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={heroForm.subtitulo}
                        onChange={(e) => setHeroForm({ ...heroForm, subtitulo: e.target.value })}
                        placeholder="Prendas deportivas de compresión premium..."
                        className="w-full px-3 py-2 rounded-lg bg-[#1C0F18] border border-[#D9A6B8]/30 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#D9A6B8] transition-colors leading-relaxed"
                      />
                    </div>

                    {/* 6. Botón Texto */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Texto del Botón CTA
                      </label>
                      <input
                        type="text"
                        value={heroForm.boton_texto}
                        onChange={(e) => setHeroForm({ ...heroForm, boton_texto: e.target.value })}
                        placeholder="Ver Colección"
                        className="w-full px-3 py-2 rounded-lg bg-[#1C0F18] border border-[#D9A6B8]/30 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#D9A6B8] transition-colors"
                      />
                    </div>

                    {/* Botones de Guardado y Activación */}
                    <div className="pt-3 border-t border-[#D9A6B8]/15 space-y-2.5">
                      <button
                        type="button"
                        disabled={isSavingHero}
                        onClick={() => handleSaveHero(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D9A6B8] to-[#E6BAC8] hover:from-[#E6BAC8] hover:to-[#D9A6B8] text-[#1C0F18] font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D9A6B8]/20 transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        {isSavingHero ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>Guardar y Activar en Web</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSavingHero}
                        onClick={() => handleSaveHero(false)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#311B2B] hover:bg-[#3d2236] border border-[#D9A6B8]/40 text-[#D9A6B8] hover:text-white font-semibold text-xs transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar como Plantilla (Sin Activar)</span>
                      </button>
                    </div>
                  </div>

                  {/* Columna Derecha: Vista Previa en Vivo (7 cols) */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] uppercase tracking-widest text-[#D9A6B8] font-bold flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Vista Previa en Vivo (Tiempo Real)</span>
                      </span>
                      <span className="text-[11px] text-gray-400">
                        Renderizado exacto de la tienda
                      </span>
                    </div>

                    {/* Marco de Simulación del Hero */}
                    <div className="relative overflow-hidden rounded-2xl border-2 border-[#D9A6B8]/30 shadow-2xl bg-gradient-to-b from-[#1C0F18] via-[#261521] to-[#1C0F18] p-6 sm:p-10 text-center flex flex-col items-center">
                      {/* Círculos de luz ambiental */}
                      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#D9A6B8]/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#311B2B]/40 rounded-full blur-2xl pointer-events-none" />

                      {/* Logo Oficial Central (Siempre el mismo) */}
                      <div className="relative mb-3 group">
                        <div className="absolute -inset-1.5 bg-gradient-to-r from-[#D9A6B8]/40 to-[#311B2B] rounded-full blur-md opacity-70" />
                        <img
                          src="/logo-256.png"
                          srcSet="/logo-128.png 1x, /logo-256.png 2x, /logo.png 3x"
                          alt="StudioBJ Logo"
                          className="relative w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full border border-[#D9A6B8]/60 shadow-[0_0_20px_rgba(217,166,184,0.35)]"
                        />
                      </div>

                      {/* Badge / TAG */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#311B2B]/90 border border-[#D9A6B8]/40 text-[11px] text-[#D9A6B8] font-semibold tracking-wider uppercase mb-3 shadow-sm">
                        <Sparkles className="w-3 h-3 text-[#D9A6B8]" />
                        <span>{heroForm.tag || 'Edición Dark Luxury 2026'}</span>
                      </div>

                      {/* Título Principal */}
                      <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-light text-white leading-tight tracking-tight mb-2">
                        {heroForm.titulo_linea_1 || 'Esculpe Tu Fuerza Con'} <br />
                        <span className="italic font-normal text-[#D9A6B8]">
                          {heroForm.titulo_linea_2 || 'Elegancia Exclusiva'}
                        </span>
                      </h2>

                      {/* Subtítulo */}
                      <p className="text-xs sm:text-sm text-gray-300 max-w-md font-normal leading-relaxed mb-5">
                        {heroForm.subtitulo || 'Prendas deportivas de compresión premium...'}
                      </p>

                      {/* Botón CTA */}
                      <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D9A6B8] to-[#E6BAC8] text-[#1C0F18] font-bold text-xs uppercase tracking-wider shadow-md">
                        <span>{heroForm.boton_texto || 'Ver Colección'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>

                      <div className="mt-5 text-[10px] text-gray-400 bg-black/30 px-3 py-1 rounded-full border border-white/5">
                        Visualizando plantilla: <span className="text-[#D9A6B8] font-semibold">{heroForm.nombre}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección Inferior: Biblioteca de Plantillas Guardadas */}
                <div className="space-y-4 pt-4 border-t border-[#D9A6B8]/15">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-editorial text-xl font-bold text-white flex items-center gap-2">
                        <span>Biblioteca de Plantillas de Portada</span>
                        <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-[#311B2B] text-[#D9A6B8] font-bold border border-[#D9A6B8]/30">
                          {heroPlantillas.length} {heroPlantillas.length === 1 ? 'plantilla' : 'plantillas'}
                        </span>
                      </h3>
                      <p className="text-xs text-gray-400">
                        Selecciona cualquier plantilla para activarla en la web en 1 segundo o cárgala en el editor para modificarla.
                      </p>
                    </div>
                  </div>

                  {heroPlantillas.length === 0 ? (
                    <div className="text-center py-12 glass-card rounded-2xl border border-[#D9A6B8]/20">
                      <p className="text-sm text-gray-300">No hay plantillas registradas</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {heroPlantillas.map((tpl) => {
                        const isCurrentActive = tpl.es_predeterminada;
                        const isCurrentlyEditing = selectedHeroId === tpl.id;

                        return (
                          <div
                            key={tpl.id}
                            className={`glass-card p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                              isCurrentActive
                                ? 'border-emerald-500/60 bg-emerald-950/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                                : isCurrentlyEditing
                                ? 'border-[#D9A6B8] bg-[#311B2B]/40'
                                : 'border-[#D9A6B8]/20 hover:border-[#D9A6B8]/50'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-bold text-white text-sm line-clamp-1">
                                  {tpl.nombre}
                                </h4>
                                {isCurrentActive ? (
                                  <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                                    <Check className="w-2.5 h-2.5" />
                                    <span>Activa</span>
                                  </span>
                                ) : (
                                  <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-[#1C0F18] text-gray-400 border border-white/10 font-normal">
                                    Guardada
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-[#D9A6B8] font-medium mb-1">
                                Tag: <span className="text-gray-300">{tpl.tag}</span>
                              </div>

                              <p className="font-editorial text-base text-gray-200 line-clamp-1 italic mb-2">
                                "{tpl.titulo_linea_1} {tpl.titulo_linea_2}"
                              </p>

                              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4">
                                {tpl.subtitulo}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-[#D9A6B8]/10 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSelectHeroTemplate(tpl)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] hover:text-[#1C0F18] text-white text-xs font-semibold transition-colors flex items-center gap-1"
                                  title="Cargar en editor y vista previa"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Editar</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDuplicateHeroTemplate(tpl)}
                                  className="p-1.5 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] hover:text-[#1C0F18] text-gray-300 hover:text-[#1C0F18] transition-colors"
                                  title="Duplicar como nueva plantilla"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>

                                {!isCurrentActive && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteHero(tpl.id, tpl.nombre)}
                                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60 transition-colors"
                                    title="Eliminar plantilla"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {!isCurrentActive && (
                                <button
                                  type="button"
                                  onClick={() => handleActivateHero(tpl.id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-800 border border-emerald-500/40 text-emerald-200 text-xs font-semibold transition-colors flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Activar en Web</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- PAGINACIÓN (Se activa cuando hay más de 10 registros) --- */}
            {activeTab !== 'hero' && currentTotal > 10 && (
              <div className="p-3.5 rounded-xl glass-card border border-[#D9A6B8]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-300 shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Mostrar:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-[#1C0F18] border border-[#D9A6B8]/30 rounded-lg px-2.5 py-1 text-white font-semibold focus:outline-none focus:border-[#D9A6B8]"
                  >
                    <option value={10}>10 / pág</option>
                    <option value={20}>20 / pág</option>
                    <option value={50}>50 / pág</option>
                    <option value={100}>100 / pág</option>
                  </select>
                  <span className="text-gray-400 text-[11px]">
                    ({startIndex + 1}-{endIndex} de {currentTotal})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] hover:text-[#1C0F18] disabled:opacity-40 disabled:hover:bg-[#311B2B] disabled:hover:text-gray-300 transition-colors font-semibold text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>

                  <div className="flex items-center gap-1 px-2 font-mono text-xs text-white">
                    <span className="text-[#D9A6B8] font-bold">{currentPage}</span>
                    <span className="text-gray-500">/</span>
                    <span>{totalPages}</span>
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] hover:text-[#1C0F18] disabled:opacity-40 disabled:hover:bg-[#311B2B] disabled:hover:text-gray-300 transition-colors font-semibold text-xs"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      </div>

      {/* Mobile Sticky Bottom Navigation (Mobile-First UX) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#261521]/95 backdrop-blur-md border-t border-[#D9A6B8]/20 px-2 py-2 flex items-center justify-around shadow-2xl safe-area-pb">
        {allowedModules.includes('productos') && (
          <button
            onClick={() => setActiveTab('productos')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              activeTab === 'productos'
                ? 'text-[#D9A6B8] bg-[#311B2B] font-bold scale-105'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Productos</span>
          </button>
        )}
        {allowedModules.includes('categorias') && (
          <button
            onClick={() => setActiveTab('categorias')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              activeTab === 'categorias'
                ? 'text-[#D9A6B8] bg-[#311B2B] font-bold scale-105'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Categorías</span>
          </button>
        )}
        {allowedModules.includes('colores') && (
          <button
            onClick={() => setActiveTab('colores')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              activeTab === 'colores'
                ? 'text-[#D9A6B8] bg-[#311B2B] font-bold scale-105'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Palette className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Colores</span>
          </button>
        )}
        {(isSuperAdmin || allowedModules.includes('hero') || allowedModules.includes('productos')) && (
          <button
            onClick={() => setActiveTab('hero')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              activeTab === 'hero'
                ? 'text-[#D9A6B8] bg-[#311B2B] font-bold scale-105'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Portada</span>
          </button>
        )}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-gray-400 hover:text-gray-200 transition-all"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Más</span>
        </button>
      </nav>

      {/* --- MODAL FORMULARIO SEGÚN TAB --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/85 backdrop-blur-md p-3 sm:p-6 md:p-8 flex justify-center items-center">
          <div className="relative w-full max-w-2xl sm:max-w-3xl glass-card rounded-2xl border border-[#D9A6B8]/30 bg-[#261521] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header del Modal Fijo con Margen y Padding Limpio */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#D9A6B8]/20 bg-[#261521] z-10 flex-shrink-0">
              <h3 className="font-editorial text-xl sm:text-2xl font-bold text-white">
                {editingItem ? 'Editar' : 'Crear'}{' '}
                {activeTab === 'colores'
                  ? 'Color'
                  : activeTab === 'usuarios'
                  ? 'Usuario'
                  : activeTab === 'roles'
                  ? 'Rol'
                  : activeTab.slice(0, -1)}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-[#311B2B] transition-colors"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido con scroll interno para no desbordar ni perder márgenes en pantalla */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain">

            {/* FORM PRODUCTO */}
            {activeTab === 'productos' && (
              <form onSubmit={handleSubmitProducto} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">Categoría *</label>
                    <select
                      required
                      value={prodForm.categoria_id}
                      onChange={(e) => setProdForm({ ...prodForm, categoria_id: e.target.value })}
                      className="w-full p-2 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white focus:outline-none focus:border-[#D9A6B8]"
                    >
                      <option value="">Selecciona categoría</option>
                      {paginatedCategorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} {!c.activo && '(inactiva)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">Nombre del Producto *</label>
                    <input
                      type="text"
                      required
                      value={prodForm.nombre}
                      onChange={(e) => setProdForm({ ...prodForm, nombre: e.target.value })}
                      placeholder="Ej: Calza Sculpt Seamless"
                      className="w-full p-2 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white focus:outline-none focus:border-[#D9A6B8]"
                    />
                  </div>

                  {/* Variantes por Color, Imágenes y Tallas */}
                  <div className="sm:col-span-2 space-y-3 pt-2 border-t border-[#D9A6B8]/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-bold text-sm">
                          Variantes por Color ({prodForm.variantes.length})
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          Cada color tiene sus propias fotografías de catálogo y disponibilidad de tallas.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addVariant}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] hover:text-[#1C0F18] border border-[#D9A6B8]/30 text-xs font-bold text-white transition-all shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Color</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {prodForm.variantes.map((v, vIdx) => (
                        <div
                          key={vIdx}
                          className="p-3.5 rounded-xl bg-[#1C0F18]/80 border border-[#D9A6B8]/25 space-y-3 shadow-inner"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-4 h-4 rounded-full border border-white/40 shadow-inner"
                                style={{ backgroundColor: v.color_hex || getColorHex(v.color) }}
                              />
                              <span className="font-bold text-white text-xs">
                                Color #{vIdx + 1}: <span className="text-[#D9A6B8]">{v.color}</span>
                              </span>
                            </div>
                            {prodForm.variantes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeVariant(vIdx)}
                                className="p-1 rounded-md text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Eliminar este color"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Nombre del color y selector rápido de paleta */}
                          <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                                Colores estándar del catálogo:
                              </span>
                              {(colores.filter((c) => c.activo).length > 0
                                ? colores.filter((c) => c.activo)
                                : LUXURY_PALETTE
                              ).map((pal) => (
                                <button
                                  key={pal.nombre}
                                  type="button"
                                  onClick={() => updateVariantColor(vIdx, pal.nombre, pal.hex)}
                                  className={`w-4 h-4 rounded-full border transition-transform ${
                                    v.color.toLowerCase() === pal.nombre.toLowerCase()
                                      ? 'border-white scale-125 ring-1 ring-[#D9A6B8]'
                                      : 'border-white/30 hover:scale-110'
                                  }`}
                                  style={{ backgroundColor: pal.hex }}
                                  title={`${pal.nombre} (${pal.hex})`}
                                />
                              ))}
                            </div>
                            <input
                              type="text"
                              required
                              value={v.color}
                              onChange={(e) => updateVariantColor(vIdx, e.target.value)}
                              placeholder="Nombre del color (Ej: Negro Onix, Rosa Palo...)"
                              className="w-full p-2 rounded bg-[#261521] border border-[#D9A6B8]/30 text-white text-xs focus:outline-none focus:border-[#D9A6B8]"
                            />
                          </div>

                          {/* Tallas disponibles para este color: (ÚNICA) o (XS,S,M,L,XL) */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                              <label className="text-[10px] text-gray-300 font-semibold uppercase tracking-wider">
                                Tallas para {v.color}:
                              </label>
                              <span className="text-[10px] text-gray-400">
                                Modo: <strong className="text-white">{v.tallas?.toUpperCase().includes('ÚNICA') ? '(ÚNICA)' : (v.tallas || 'Seleccionar')}</strong>
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              {/* Opción 1: Talla (ÚNICA) */}
                              <button
                                type="button"
                                onClick={() => toggleVariantTalla(vIdx, 'ÚNICA')}
                                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                                  v.tallas?.toUpperCase().includes('ÚNICA')
                                    ? 'bg-[#D9A6B8] text-[#1C0F18] border-[#D9A6B8] shadow-md shadow-[#D9A6B8]/20 ring-1 ring-white/40'
                                    : 'bg-[#261521] text-gray-300 border-white/15 hover:border-[#D9A6B8]/50 hover:bg-[#311B2B]'
                                }`}
                                title="Seleccionar talla (ÚNICA)"
                              >
                                <span
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                    v.tallas?.toUpperCase().includes('ÚNICA')
                                      ? 'bg-[#1C0F18] border-[#1C0F18] text-[#D9A6B8]'
                                      : 'border-gray-500'
                                  }`}
                                >
                                  {v.tallas?.toUpperCase().includes('ÚNICA') && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </span>
                                <span>(ÚNICA)</span>
                              </button>

                              <span className="text-[10px] text-gray-500 text-center font-bold uppercase sm:px-1">o</span>

                              {/* Opción 2: Rango por tallas (XS, S, M, L, XL) */}
                              <div className="flex-1 flex items-center gap-1.5">
                                {STANDARD_SIZES.map((size) => {
                                  const isUnica = v.tallas?.toUpperCase().includes('ÚNICA');
                                  const currentSizes = (!isUnica && v.tallas)
                                    ? v.tallas.split(',').map((s) => s.trim().toUpperCase())
                                    : [];
                                  const isChecked = currentSizes.includes(size);
                                  return (
                                    <button
                                      key={size}
                                      type="button"
                                      onClick={() => toggleVariantTalla(vIdx, size)}
                                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg border text-xs font-bold transition-all ${
                                        isChecked
                                          ? 'bg-[#D9A6B8] text-[#1C0F18] border-[#D9A6B8] shadow-sm ring-1 ring-white/30'
                                          : 'bg-[#261521] text-gray-400 border-white/10 hover:border-[#D9A6B8]/40 hover:text-white'
                                      }`}
                                      title={`Habilitar talla ${size} en color ${v.color}`}
                                    >
                                      <span
                                        className={`w-3 h-3 rounded flex items-center justify-center border ${
                                          isChecked ? 'bg-[#1C0F18] border-[#1C0F18] text-[#D9A6B8]' : 'border-gray-500'
                                        }`}
                                      >
                                        {isChecked && <Check className="w-2 h-2 stroke-[3]" />}
                                      </span>
                                      <span>{size}</span>
                                    </button>
                                  );
                                })}

                                <button
                                  type="button"
                                  onClick={() => selectAllSizes(vIdx)}
                                  className="text-[10px] px-2 py-1.5 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] hover:text-[#1C0F18] text-gray-300 font-semibold border border-[#D9A6B8]/30 transition-all flex-shrink-0"
                                  title="Seleccionar todas las tallas (XS a XL)"
                                >
                                  (Todas)
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Imágenes de este color */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] text-gray-300 font-semibold uppercase tracking-wider">
                                Fotografías en color {v.color} ({v.imagenes.length}):
                              </span>
                              <label className="cursor-pointer text-[10px] text-[#D9A6B8] hover:underline font-bold flex items-center gap-1">
                                <Upload className="w-3 h-3" />
                                <span>+ Subir foto a {v.color}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) await addImageToVariant(vIdx, file);
                                  }}
                                />
                              </label>
                            </div>

                            {v.imagenes.length === 0 ? (
                              <div className="p-3 text-center rounded-lg border border-dashed border-[#D9A6B8]/30 text-gray-400 text-[11px]">
                                No hay fotos para este color. Haz clic en "+ Subir foto a {v.color}".
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 overflow-x-auto py-1">
                                {v.imagenes.map((img, imgIdx) => (
                                  <div
                                    key={imgIdx}
                                    className="relative group/thumb w-14 h-18 rounded-lg overflow-hidden border border-[#D9A6B8]/30 flex-shrink-0 bg-[#261521]"
                                  >
                                    <img
                                      src={img}
                                      alt={`Foto ${imgIdx + 1} de ${v.color}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeImageFromVariant(vIdx, imgIdx)}
                                      className="absolute top-1 right-1 p-1 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white shadow-md opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                                      title="Eliminar foto"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">Precio CLP *</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={prodForm.precio}
                      onChange={(e) => setProdForm({ ...prodForm, precio: Number(e.target.value) })}
                      className="w-full p-2 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white focus:outline-none focus:border-[#D9A6B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">Precio Anterior CLP (opcional)</label>
                    <input
                      type="number"
                      value={prodForm.precio_anterior}
                      onChange={(e) => setProdForm({ ...prodForm, precio_anterior: e.target.value })}
                      placeholder="Para mostrar precio tachado"
                      className="w-full p-2 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white focus:outline-none focus:border-[#D9A6B8]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-gray-300 mb-1 font-semibold">Etiqueta CRO (opcional)</label>
                    <select
                      value={prodForm.etiqueta}
                      onChange={(e) => setProdForm({ ...prodForm, etiqueta: e.target.value })}
                      className="w-full p-2 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white focus:outline-none focus:border-[#D9A6B8]"
                    >
                      <option value="">Sin etiqueta</option>
                      <option value="Top Ventas">Top Ventas</option>
                      <option value="Últimas unidades">Últimas unidades</option>
                      <option value="Nuevo">Nuevo</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-gray-300 mb-1 font-semibold">Descripción</label>
                    <textarea
                      rows={2}
                      value={prodForm.descripcion}
                      onChange={(e) => setProdForm({ ...prodForm, descripcion: e.target.value })}
                      placeholder="Detalles sobre compresión, tejido y calce..."
                      className="w-full p-2 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white focus:outline-none focus:border-[#D9A6B8]"
                    />
                  </div>
                </div>

                {/* Subida y Compresión de Imagen via Canvas */}
                <div className="pt-2 border-t border-[#D9A6B8]/20">
                  <label className="block text-gray-300 mb-1.5 font-semibold">
                    Fotografía del Producto (Compresor WebP integrado en navegador)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#311B2B] hover:bg-[#D9A6B8] hover:text-[#1C0F18] border border-[#D9A6B8]/40 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Seleccionar Fotografía</span>
                    </button>

                    {imagePreview && (
                      <div className="flex items-center gap-3">
                        <img
                          src={imagePreview}
                          alt="Previsualización"
                          className="w-14 h-16 object-cover rounded border border-[#D9A6B8]/40 bg-[#1C0F18]"
                        />
                        <div className="text-[11px] text-gray-300">
                          <span className="text-emerald-400 font-bold block">✓ Comprimida en WebP</span>
                          {imageSizeKB && <span>Peso optimizado: {imageSizeKB} KB</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#D9A6B8]/20">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#311B2B] text-gray-300 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[#D9A6B8] text-[#1C0F18] font-bold uppercase tracking-wider hover:bg-[#E6BAC8]"
                  >
                    Guardar Producto
                  </button>
                </div>
              </form>
            )}

            {/* FORM CATEGORÍA */}
            {activeTab === 'categorias' && (
              <form onSubmit={handleSubmitCategoria} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Nombre de la Categoría *</label>
                  <input
                    type="text"
                    required
                    value={catForm.nombre}
                    onChange={(e) => setCatForm({ ...catForm, nombre: e.target.value })}
                    placeholder="Ej: Enteritos"
                    className="w-full p-2 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white focus:outline-none focus:border-[#D9A6B8]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Descripción</label>
                  <textarea
                    rows={3}
                    value={catForm.descripcion}
                    onChange={(e) => setCatForm({ ...catForm, descripcion: e.target.value })}
                    placeholder="Descripción de la categoría..."
                    className="w-full p-2 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white focus:outline-none focus:border-[#D9A6B8]"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#D9A6B8]/20">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#311B2B] text-gray-300 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[#D9A6B8] text-[#1C0F18] font-bold uppercase tracking-wider hover:bg-[#E6BAC8]"
                  >
                    Guardar Categoría
                  </button>
                </div>
              </form>
            )}

            {/* FORM COLOR */}
            {activeTab === 'colores' && (
              <form onSubmit={handleSubmitColor} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Nombre del Color *</label>
                  <input
                    type="text"
                    required
                    value={colorForm.nombre}
                    onChange={(e) => setColorForm({ ...colorForm, nombre: e.target.value })}
                    placeholder="Ej: Ciruela Imperial"
                    className="w-full p-2 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white focus:outline-none focus:border-[#D9A6B8]"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">
                    Código Hexadecimal y Selector Visual *
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={colorForm.hex && colorForm.hex.startsWith('#') && colorForm.hex.length === 7 ? colorForm.hex : '#18181b'}
                      onChange={(e) => setColorForm({ ...colorForm, hex: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer border border-[#D9A6B8]/30 bg-transparent p-0.5"
                      title="Seleccionar tono visualmente"
                    />
                    <input
                      type="text"
                      required
                      value={colorForm.hex}
                      onChange={(e) => setColorForm({ ...colorForm, hex: e.target.value })}
                      placeholder="#18181b"
                      className="flex-1 p-2 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white font-mono uppercase focus:outline-none focus:border-[#D9A6B8]"
                    />
                    <div
                      className="w-10 h-10 rounded-lg border border-white/40 shadow-inner flex-shrink-0"
                      style={{ backgroundColor: colorForm.hex }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Descripción (opcional)</label>
                  <textarea
                    rows={2}
                    value={colorForm.descripcion}
                    onChange={(e) => setColorForm({ ...colorForm, descripcion: e.target.value })}
                    placeholder="Tono oscuro mate para la colección de leggings..."
                    className="w-full p-2 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white focus:outline-none focus:border-[#D9A6B8]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="colorActivo"
                    checked={colorForm.activo}
                    onChange={(e) => setColorForm({ ...colorForm, activo: e.target.checked })}
                    className="rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-[#D9A6B8] focus:ring-0 w-4 h-4"
                  />
                  <label htmlFor="colorActivo" className="text-gray-300 font-semibold cursor-pointer">
                    Color Activo en Catálogo (disponible para prendas)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#D9A6B8]/20">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#311B2B] text-gray-300 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[#D9A6B8] text-[#1C0F18] font-bold uppercase tracking-wider hover:bg-[#E6BAC8]"
                  >
                    Guardar Color
                  </button>
                </div>
              </form>
            )}

            {/* FORM USUARIO */}
            {activeTab === 'usuarios' && (isSuperAdmin || allowedModules.includes('usuarios')) && (
              <form onSubmit={handleSubmitUsuario} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Rol *</label>
                  <select
                    required
                    value={userForm.rol_id}
                    onChange={(e) => setUserForm({ ...userForm, rol_id: e.target.value })}
                    className="w-full p-2 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white focus:outline-none focus:border-[#D9A6B8]"
                  >
                    <option value="">Selecciona rol</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={userForm.nombre}
                    onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
                    placeholder="Ej: Administrador"
                    className="w-full p-2 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white focus:outline-none focus:border-[#D9A6B8]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="usuario@studiobj.cl"
                    className="w-full p-2 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white focus:outline-none focus:border-[#D9A6B8]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">
                    {editingItem ? 'Nueva Contraseña (dejar en blanco para conservar actual)' : 'Contraseña *'}
                  </label>
                  <input
                    type="password"
                    required={!editingItem}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full p-2 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white focus:outline-none focus:border-[#D9A6B8]"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#D9A6B8]/20">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#311B2B] text-gray-300 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[#D9A6B8] text-[#1C0F18] font-bold uppercase tracking-wider hover:bg-[#E6BAC8]"
                  >
                    Guardar Usuario
                  </button>
                </div>
              </form>
            )}

            {/* FORM ROL */}
            {activeTab === 'roles' && (isSuperAdmin || allowedModules.includes('roles')) && (
              <form onSubmit={handleSubmitRol} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Nombre del Rol *</label>
                  <input
                    type="text"
                    required
                    value={rolForm.nombre}
                    onChange={(e) => setRolForm({ ...rolForm, nombre: e.target.value })}
                    placeholder="Ej: Administrador"
                    className="w-full p-2.5 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white focus:outline-none focus:border-[#D9A6B8]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Descripción</label>
                  <textarea
                    rows={2}
                    value={rolForm.descripcion}
                    onChange={(e) => setRolForm({ ...rolForm, descripcion: e.target.value })}
                    placeholder="Permisos y alcance de este rol..."
                    className="w-full p-2.5 rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-white focus:outline-none focus:border-[#D9A6B8]"
                  />
                </div>

                {/* Asignación interactiva de Módulos / Menús */}
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">
                    Módulos y Menús Asignados al Rol *
                  </label>
                  <p className="text-[11px] text-gray-400 mb-2">
                    Marca o desmarca los módulos a los que tendrán acceso los usuarios asignados a este rol:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SYSTEM_MODULES.map((mod) => {
                      const currentMods = rolForm.modulos
                        ? rolForm.modulos.split(',').map((s) => s.trim().toLowerCase())
                        : [];
                      const isAssigned = currentMods.includes(mod.id.toLowerCase());
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => toggleModuloInRol(mod.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                            isAssigned
                              ? 'bg-[#311B2B] border-[#D9A6B8] text-white shadow-md shadow-[#D9A6B8]/10'
                              : 'bg-[#1C0F18]/80 border-[#D9A6B8]/20 text-gray-400 hover:border-[#D9A6B8]/40'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors ${
                              isAssigned
                                ? 'bg-[#D9A6B8] border-[#D9A6B8] text-[#1C0F18]'
                                : 'border-gray-500 bg-transparent'
                            }`}
                          >
                            {isAssigned && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white capitalize">{mod.label}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{mod.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="rolActivo"
                    checked={rolForm.activo}
                    onChange={(e) => setRolForm({ ...rolForm, activo: e.target.checked })}
                    className="rounded bg-[#1C0F18] border border-[#D9A6B8]/30 text-[#D9A6B8] focus:ring-0 w-4 h-4"
                  />
                  <label htmlFor="rolActivo" className="text-gray-300 font-semibold cursor-pointer">
                    Rol Habilitado y Activo
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#D9A6B8]/20">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#311B2B] text-gray-300 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[#D9A6B8] text-[#1C0F18] font-bold uppercase tracking-wider hover:bg-[#E6BAC8]"
                  >
                    Guardar Rol
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
