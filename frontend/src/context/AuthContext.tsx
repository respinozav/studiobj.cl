import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('studiobj_token'));
  const [user, setUser] = useState<Usuario | null>(() => {
    try {
      const saved = localStorage.getItem('studiobj_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const profile = await api.getMe();
          const rolName = profile.rol_nombre || profile.rol || 'Sin Rol';
          const isSuper = rolName === 'Super Admin' || rolName === 'Admin';
          const normalized: Usuario = {
            id: profile.id,
            rol_id: profile.rol_id || '',
            rol: rolName,
            rol_nombre: rolName,
            modulos: profile.modulos || (isSuper ? 'productos,categorias,colores,usuarios,roles' : 'productos,categorias,colores'),
            nombre: profile.nombre,
            email: profile.email,
            activo: profile.activo
          };
          setUser(normalized);
          localStorage.setItem('studiobj_user', JSON.stringify(normalized));
        } catch {
          logout();
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };
    verifyToken();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    const rolName = res.user.rol_nombre || res.user.rol || 'Sin Rol';
    const isSuper = rolName === 'Super Admin' || rolName === 'Admin';
    const normalized: Usuario = {
      id: res.user.id,
      rol_id: res.user.rol_id || '',
      rol: rolName,
      rol_nombre: rolName,
      modulos: res.user.modulos || (isSuper ? 'productos,categorias,colores,usuarios,roles' : 'productos,categorias,colores'),
      nombre: res.user.nombre,
      email: res.user.email,
      activo: res.user.activo
    };
    localStorage.setItem('studiobj_token', res.access_token);
    localStorage.setItem('studiobj_user', JSON.stringify(normalized));
    setToken(res.access_token);
    setUser(normalized);
  };

  const logout = () => {
    localStorage.removeItem('studiobj_token');
    localStorage.removeItem('studiobj_user');
    setToken(null);
    setUser(null);
  };

  const isSuperAdmin = Boolean(
    user && (user.rol === 'Super Admin' || user.rol_nombre === 'Super Admin' || user.rol === 'Admin' || user.rol_nombre === 'Admin')
  );

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
