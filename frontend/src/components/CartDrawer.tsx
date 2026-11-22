import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, MessageCircle, MapPin, User } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    totalPrecioCLP,
  } = useCart();

  const [nombre, setNombre] = useState('');
  const [comuna, setComuna] = useState('');

  // Bloquear scroll de la página completa cuando el carrito/drawer está abierto
  useEffect(() => {
    if (!isCartOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const formatCLP = (val: number) => {
    return '$' + val.toLocaleString('es-CL');
  };

  // Construir mensaje de WhatsApp con formato prolijo
  const handleCheckoutWhatsApp = () => {
    if (cart.length === 0) return;

    let mensaje = `✨ *NUEVO PEDIDO STUDIOBJ (studiobj.cl)* ✨\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (nombre.trim()) {
      mensaje += `👤 *Cliente:* ${nombre.trim()}\n`;
    }
    if (comuna.trim()) {
      mensaje += `📍 *Comuna/Despacho:* ${comuna.trim()}, Chile\n`;
    }
    mensaje += `\n📦 *DETALLE DE PRENDAS:*\n`;

    cart.forEach((item, index) => {
      mensaje += `\n${index + 1}. *${item.nombre}*\n`;
      mensaje += `   • Talla: ${item.talla} | Color: ${item.color}\n`;
      mensaje += `   • Cantidad: ${item.cantidad} x ${formatCLP(item.precio)}\n`;
      mensaje += `   • Subtotal: ${formatCLP(item.precio * item.cantidad)}\n`;
    });

    mensaje += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `💰 *TOTAL A PAGAR: ${formatCLP(totalPrecioCLP)} CLP*\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    mensaje += `Hola, deseo coordinar el pago y envío de mi pedido. ¿Me confirman disponibilidad por favor?`;

    const encodedText = encodeURIComponent(mensaje);
    const waUrl = `https://wa.me/56951156429?text=${encodedText}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Fondo oscuro traslúcido */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-[#261521] border-l border-[#D9A6B8]/20 flex flex-col h-full shadow-2xl z-10 animate-slideLeft">
        {/* Header del Carrito */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D9A6B8]/20 bg-[#1C0F18]/60">
          <div className="flex items-center gap-2">
            <span className="font-editorial text-2xl font-semibold text-white tracking-wide">
              Tu Carrito
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#311B2B] text-[#D9A6B8] font-bold border border-[#D9A6B8]/30">
              {totalItems} {totalItems === 1 ? 'prenda' : 'prendas'}
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-full hover:bg-[#311B2B] text-gray-400 hover:text-white transition-colors"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Ítems */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-[#D9A6B8]/10">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-gray-400">
              <div className="w-16 h-16 rounded-full bg-[#311B2B] flex items-center justify-center text-[#D9A6B8] mb-3">
                <X className="w-8 h-8 opacity-40" />
              </div>
              <p className="font-editorial text-xl text-white mb-1">Tu bolso está vacío</p>
              <p className="text-xs text-gray-400 max-w-xs">
                Descubre nuestra colección de compresión de lujo y agrega tus prendas favoritas.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="pt-3.5 flex gap-3.5 items-center">
                {/* Miniatura */}
                <img
                  src={item.imagen_base64}
                  alt={item.nombre}
                  className="w-16 h-20 object-cover rounded-lg bg-[#1C0F18] border border-[#D9A6B8]/20 flex-shrink-0"
                />

                {/* Detalles */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-calibri text-xs sm:text-sm text-gray-200 font-normal truncate leading-tight tracking-normal">
                    {item.nombre}
                  </h4>
                  <div className="text-[11px] text-[#D9A6B8] mt-0.5">
                    Talla: <span className="font-bold text-white uppercase">{item.talla}</span> • {item.color}
                  </div>
                  <div className="text-xs font-bold text-white price-tag mt-1">
                    {formatCLP(item.precio)}
                  </div>

                  {/* Controles de Cantidad */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-[#D9A6B8]/30 rounded bg-[#1C0F18]">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:text-[#D9A6B8] text-gray-300 transition-colors"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-white price-tag">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:text-[#D9A6B8] text-gray-300 transition-colors"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-rose-400 p-1 transition-colors"
                      aria-label="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer del Carrito con Checkout */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-[#D9A6B8]/20 bg-[#1C0F18]/90 space-y-3">
            {/* Inputs Opcionales de Despacho */}
            <div className="space-y-2 text-xs">
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#D9A6B8]/70" />
                <input
                  type="text"
                  placeholder="Tu Nombre (opcional)"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#261521] border border-[#D9A6B8]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#D9A6B8]"
                />
              </div>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#D9A6B8]/70" />
                <input
                  type="text"
                  placeholder="Comuna de despacho en Chile (opcional)"
                  value={comuna}
                  onChange={(e) => setComuna(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#261521] border border-[#D9A6B8]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#D9A6B8]"
                />
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-2 border-t border-[#D9A6B8]/15">
              <span className="text-sm font-medium text-gray-300">Total Estimado</span>
              <span className="text-xl font-extrabold text-white price-tag">
                {formatCLP(totalPrecioCLP)} CLP
              </span>
            </div>

            {/* Botón Principal "PEDIR POR WHATSAPP AHORA" */}
            <button
              onClick={handleCheckoutWhatsApp}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/40 active:scale-[0.98] transition-all"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Pedir Por WhatsApp Ahora</span>
            </button>

            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>Atención personalizada</span>
              <button
                onClick={clearCart}
                className="text-gray-500 hover:text-gray-300 underline"
              >
                Vaciar bolso
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
