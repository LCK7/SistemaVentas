"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Loader2, Printer, CreditCard, Banknote } from "lucide-react";
import { toast } from "sonner";

type Producto = {
  id: string;
  codigo: string;
  nombre: string;
  precioVenta: number;
  stock: number;
  categoria: { nombre: string };
};

type CartItem = {
  productoId: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnit: number;
  subtotal: number;
};

type VentaResult = {
  id: string;
  numeroTicket: number;
  total: number;
  metodoPago: string;
  detalles: any[];
  usuario: { nombre: string };
  cliente?: { nombre: string } | null;
  createdAt: string;
};

export default function POSPanel() {
  const [search, setSearch] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([]);
  const [paymentModal, setPaymentModal] = useState(false);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [montoPagado, setMontoPagado] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<VentaResult | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [clienteSearch, setClienteSearch] = useState("");
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<{ id: string; nombre: string } | null>(null);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [cajaCerrada, setCajaCerrada] = useState(false);

  useEffect(() => {
    fetchProductos();
    fetchCategorias();
    fetchClientes();
    fetchCajaStatus();
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  const fetchCajaStatus = async () => {
    try {
      const res = await fetch("/api/caja");
      const data = await res.json();
      const movs = data.movimientos || [];
      setCajaCerrada(!!movs.find((m: any) => m.tipo === "CIERRE"));
    } catch {
      setCajaCerrada(false);
    }
  };

  useEffect(() => {
    const q = search.toLowerCase();
    let filtrados = productos;
    if (q) {
      filtrados = productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q)
      );
    }
    if (categoriaFiltro) {
      filtrados = filtrados.filter((p) => p.categoria?.nombre === categoriaFiltro);
    }
    setProductosFiltrados(filtrados.slice(0, 20));
  }, [search, productos, categoriaFiltro]);

  const fetchProductos = async () => {
    try {
      const res = await fetch("/api/productos?limit=200");
      const data = await res.json();
      setProductos(data.productos || []);
    } catch {
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const res = await fetch("/api/categorias");
      const data = await res.json();
      setCategorias(data);
    } catch {}
  };

  const fetchClientes = async () => {
    try {
      const res = await fetch("/api/clientes");
      const data = await res.json();
      setClientes(data);
    } catch {}
  };

  const addToCart = useCallback((producto: Producto) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productoId === producto.id);
      if (existing) {
        if (existing.cantidad >= producto.stock) {
          toast.error(`Stock máximo alcanzado para ${producto.nombre}`);
          return prev;
        }
        return prev.map((item) =>
          item.productoId === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precioUnit,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          productoId: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          cantidad: 1,
          precioUnit: Number(producto.precioVenta),
          subtotal: Number(producto.precioVenta),
        },
      ];
    });
    setSearch("");
    searchInputRef.current?.focus();
  }, []);

  const updateQuantity = (productoId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productoId !== productoId) return item;
          const newCant = item.cantidad + delta;
          if (newCant <= 0) return null;
          return { ...item, cantidad: newCant, subtotal: newCant * item.precioUnit };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productoId: string) => {
    setCart((prev) => prev.filter((item) => item.productoId !== productoId));
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const vuelto = montoPagado ? parseFloat(montoPagado) - total : 0;

  const buscarPorCodigoExacto = async (codigo: string) => {
    try {
      const res = await fetch(`/api/productos?codigoExacto=${encodeURIComponent(codigo)}`);
      const data = await res.json();
      if (data.producto) {
        addToCart(data.producto);
        return true;
      }
    } catch {}
    return false;
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search) {
      const esNumerico = /^\d+$/.test(search.trim());
      if (esNumerico) {
        const encontrado = await buscarPorCodigoExacto(search.trim());
        if (encontrado) return;
      }
      if (productosFiltrados.length > 0) {
        addToCart(productosFiltrados[0]);
      }
    }
  };

  const processSale = async () => {
    if (cart.length === 0) return;
    setProcessing(true);

    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productos: cart.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
          })),
          metodoPago,
          clienteId: clienteSeleccionado?.id || null,
          montoPagado: montoPagado ? parseFloat(montoPagado) : total,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const venta = await res.json();
      setLastSale(venta);
      setCart([]);
      setMontoPagado("");
      setClienteSeleccionado(null);
      toast.success(`Venta #${venta.numeroTicket} registrada exitosamente`);
    } catch (err: any) {
      toast.error(err.message || "Error al procesar venta");
    } finally {
      setProcessing(false);
      setPaymentModal(false);
    }
  };

  const printTicket = () => {
    if (!lastSale) return;
    window.open(`/api/ventas/boleta?ventaId=${lastSale.id}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Banner caja cerrada */}
      {cajaCerrada && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-300 text-gray-600 text-sm">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          La caja ya fue cerrada hoy. No se pueden registrar más ventas.
        </div>
      )}
      <div className="flex gap-4 h-[calc(100vh-12rem)]">
      {/* Panel izquierdo - Productos */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Búsqueda */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar producto por código o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              autoFocus
            />
          </div>
          {/* Filtro de categorías */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoriaFiltro("")}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                !categoriaFiltro ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaFiltro(cat.nombre)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  categoriaFiltro === cat.nombre ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto p-4">
          {productosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-2" />
              <p className="text-sm">Busca productos para agregar al carrito</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {productosFiltrados.map((p) => {
                const stockLevel = p.stock <= 0 ? "agotado" : p.stock <= 5 ? "bajo" : "normal";
                const stockColors = {
                  agotado: "bg-red-100 text-red-700 border-red-200",
                  bajo: "bg-orange-100 text-orange-700 border-orange-200",
                  normal: "bg-gray-50 text-gray-500 border-gray-100",
                };
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={p.stock <= 0}
                    className="flex flex-col p-3 rounded-xl border-2 border-gray-100 hover:border-blue-300 hover:shadow-md hover:bg-blue-50/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed group bg-white"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                        {p.codigo}
                      </span>
                      {p.categoria?.nombre && (
                        <span className="text-[10px] text-gray-400 truncate max-w-[80px] text-right">
                          {p.categoria.nombre}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5em]">
                      {p.nombre}
                    </p>
                    <p className="text-lg font-bold text-blue-600 mt-auto pt-2">
                      S/ {Number(p.precioVenta).toFixed(2)}
                    </p>
                    <div className={`mt-2 px-2 py-1 rounded-md text-[11px] font-medium text-center border ${stockColors[stockLevel]}`}>
                      {stockLevel === "agotado" ? "AGOTADO" : `Stock: ${p.stock}`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Panel derecho - Carrito */}
      <div className="w-96 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrito ({cart.length})
            </h3>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700">
                Vaciar
              </button>
            )}
          </div>
          {/* Cliente */}
          <div className="relative mt-2">
            <input
              type="text"
              placeholder="Cliente (opcional)..."
              value={clienteSeleccionado ? clienteSeleccionado.nombre : clienteSearch}
              onChange={(e) => {
                setClienteSearch(e.target.value);
                setClienteSeleccionado(null);
                setShowClienteDropdown(true);
              }}
              onFocus={() => setShowClienteDropdown(true)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
            />
            {showClienteDropdown && !clienteSeleccionado && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-10 max-h-32 overflow-y-auto">
                {clientes
                  .filter((c) => c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()))
                  .map((c) => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      onClick={() => {
                        setClienteSeleccionado(c);
                        setClienteSearch(c.nombre);
                        setShowClienteDropdown(false);
                      }}
                    >
                      {c.nombre}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Items del carrito */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-10 h-10 mb-2" />
              <p className="text-sm">Carrito vacío</p>
              <p className="text-xs text-gray-300 mt-1">Selecciona productos</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productoId} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.nombre}</p>
                  <p className="text-xs text-gray-500">S/ {item.precioUnit.toFixed(2)} c/u</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.productoId, -1)}
                    className="p-1 rounded hover:bg-gray-200 text-gray-500"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.cantidad}</span>
                  <button
                    onClick={() => updateQuantity(item.productoId, 1)}
                    className="p-1 rounded hover:bg-gray-200 text-gray-500"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm font-semibold text-gray-900 w-20 text-right">
                  S/ {item.subtotal.toFixed(2)}
                </p>
                <button
                  onClick={() => removeFromCart(item.productoId)}
                  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Total y cobrar */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Total</span>
            <span className="text-2xl font-bold text-gray-900">S/ {total.toFixed(2)}</span>
          </div>
          <button
            onClick={() => cajaCerrada ? null : setPaymentModal(true)}
            disabled={cart.length === 0 || cajaCerrada}
            className={`w-full py-3 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
              cajaCerrada
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            <CreditCard className="w-5 h-5" />
            {cajaCerrada ? "Caja Cerrada — No se puede cobrar" : `Cobrar S/ ${total.toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* Modal de Pago */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold">Cobrar Venta</h3>
              <button onClick={() => setPaymentModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-center">
                <span className="text-gray-500">Total a cobrar: </span>
                <span className="text-3xl font-bold text-gray-900">S/ {total.toFixed(2)}</span>
              </p>

              {/* Método de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "EFECTIVO", label: "Efectivo", icon: Banknote },
                    { value: "TARJETA", label: "Tarjeta", icon: CreditCard },
                    { value: "TRANSFERENCIA", label: "Transferencia", icon: CreditCard },
                    { value: "OTRO", label: "Otro", icon: CreditCard },
                  ].map((mp) => {
                    const Icon = mp.icon;
                    return (
                      <button
                        key={mp.value}
                        onClick={() => setMetodoPago(mp.value)}
                        className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          metodoPago === mp.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {mp.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Monto pagado (solo efectivo) */}
              {metodoPago === "EFECTIVO" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto recibido</label>
                  <input
                    type="number"
                    step="0.01"
                    value={montoPagado}
                    onChange={(e) => setMontoPagado(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-lg font-medium outline-none focus:border-blue-500"
                    placeholder="0.00"
                    autoFocus
                  />
                  {montoPagado && parseFloat(montoPagado) >= total && (
                    <p className="text-sm text-green-600 font-medium mt-2">
                      Vuelto: S/ {vuelto.toFixed(2)}
                    </p>
                  )}
                  {montoPagado && parseFloat(montoPagado) < total && (
                    <p className="text-sm text-red-500 mt-2">
                      Falta: S/ {(total - parseFloat(montoPagado)).toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {/* Resumen */}
              <div className="p-3 rounded-xl bg-gray-50 text-sm space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Items</span>
                  <span>{cart.reduce((s, i) => s + i.cantidad, 0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Método</span>
                  <span className="font-medium capitalize">{metodoPago.toLowerCase()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-1 border-t border-gray-200">
                  <span>Total</span>
                  <span>S/ {total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={processSale}
                disabled={processing || (metodoPago === "EFECTIVO" && montoPagado !== "" && parseFloat(montoPagado) < total)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Confirmar Cobro
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Venta Exitosa */}
      {lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">¡Venta Exitosa!</h3>
            <p className="text-gray-500 mt-2">Ticket #{lastSale.numeroTicket}</p>
            <p className="text-3xl font-bold text-gray-900 mt-4">S/ {Number(lastSale.total).toFixed(2)}</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={printTicket}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Imprimir Boleta
              </button>
              <button
                onClick={() => setLastSale(null)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
