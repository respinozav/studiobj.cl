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

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos de inactividad

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

  const logout = (dueToInactivity: boolean = false) => {
    localStorage.removeItem('studiobj_token');
    localStorage.removeItem('studiobj_user');
    localStorage.removeItem('studiobj_last_activity');
    if (dueToInactivity) {
      localStorage.setItem('studiobj_session_expired', 'true');
    }
    setToken(null);
    setUser(null);
  };

  // Control de caducidad por 15 minutos de inactividad
  useEffect(() => {
    if (!token) return;

    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      const now = Date.now();
      localStorage.setItem('studiobj_last_activity', now.toString());
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        logout(true);
      }, INACTIVITY_TIMEOUT_MS);
    };

    // Verificar si ya pasaron más de 15 minutos desde la última interacción registrada
    const lastActivityStr = localStorage.getItem('studiobj_last_activity');
    if (lastActivityStr) {
      const lastActivity = parseInt(lastActivityStr, 10);
      if (!isNaN(lastActivity) && Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
        logout(true);
        return;
      }
    }

    resetTimer();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    let lastThrottledTime = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottledTime > 5000) {
        lastThrottledTime = now;
        resetTimer();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    const intervalCheck = setInterval(() => {
      const savedTime = localStorage.getItem('studiobj_last_activity');
      if (savedTime) {
        const last = parseInt(savedTime, 10);
        if (!isNaN(last) && Date.now() - last > INACTIVITY_TIMEOUT_MS) {
          logout(true);
        }
      }
    }, 20000);

    return () => {
      if (timer) clearTimeout(timer);
      clearInterval(intervalCheck);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [token]);

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
    localStorage.setItem('studiobj_last_activity', Date.now().toString());
    localStorage.removeItem('studiobj_session_expired');
    setToken(res.access_token);
    setUser(normalized);
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
