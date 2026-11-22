import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import { PublicStore } from './pages/PublicStore';
import { AdminLogin } from './pages/AdminLogin';
import { AdminPanel } from './pages/AdminPanel';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <LoadingProvider>
          <BrowserRouter>
            <Routes>
              {/* Tienda Pública Principal */}
              <Route path="/" element={<PublicStore />} />

              {/* Acceso a Administración */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminPanel />} />

              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </LoadingProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
