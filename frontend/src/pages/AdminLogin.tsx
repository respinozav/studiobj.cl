import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { Lock, Mail, ArrowLeft, Loader2 } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { withLoading } = useLoading();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await withLoading(login(email, password), 'Verificando acceso...');
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#1C0F18] text-white relative">
      <div className="absolute top-6 left-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#D9A6B8] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la tienda</span>
        </Link>
      </div>

      <div className="w-full max-w-sm glass-card border border-[#D9A6B8]/25 p-8 rounded-2xl shadow-2xl bg-[#261521]">
        {/* Monograma y Título con Logo Oficial */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="StudioBJ Logo"
            className="w-20 h-20 mx-auto object-contain drop-shadow-[0_0_16px_rgba(217,166,184,0.4)] mb-3"
          />
          <h1 className="font-editorial text-2xl font-bold text-white tracking-wide">
            Panel de Administración
          </h1>
          <p className="text-xs text-[#D9A6B8] mt-1 font-medium tracking-wider uppercase">
            StudioBJ
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 uppercase tracking-wider mb-1 font-semibold">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-[#D9A6B8]/70" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@studiobj.cl"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#1C0F18] border border-[#D9A6B8]/25 text-white placeholder-gray-500 focus:outline-none focus:border-[#D9A6B8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 uppercase tracking-wider mb-1 font-semibold">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-[#D9A6B8]/70" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#1C0F18] border border-[#D9A6B8]/25 text-white placeholder-gray-500 focus:outline-none focus:border-[#D9A6B8]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#D9A6B8] to-[#E6BAC8] hover:from-[#E6BAC8] hover:to-[#D9A6B8] text-[#1C0F18] font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ingresando...</span>
              </>
            ) : (
              <span>Iniciar Sesión</span>
            )}
          </button>
        </form>
      </div>

      <p className="text-[11px] text-gray-500 mt-6">
        Acceso restringido para personal autorizado StudioBJ
      </p>
    </div>
  );
};
