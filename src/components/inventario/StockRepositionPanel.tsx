"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Package, Plus, Minus, Loader2, AlertTriangle, Barcode, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

type Producto = {
  id: string;
  codigo: string;
  nombre: string;
  stock: number;
  stockMinimo: number;
  precioCompra: number;
  precioVenta: number;
  categoria?: { id: string; nombre: string };
};

type Movimiento = {
  id: string;
  tipo: string;
  cantidad: number;
  motivo: string;
  referencia: string | null;
  createdAt: string;
  producto: { id: string; codigo: string; nombre: string };
  usuario: { id: string; nombre: string };
};

export default function StockRepositionPanel() {
  const [search, setSearch] = useState("");
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [referencia, setReferencia] = useState("");
  const [reponiendo, setReponiendo] = useState(false);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loadingMovs, setLoadingMovs] = useState(false);
  const [sugerencias, setSugerencias] = useState<Producto[]>([]);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSugerencias(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSugerencias([]);
      setShowSugerencias(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscarSugerencias(search), 200);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const buscarSugerencias = async (q: string) => {
    try {
      const esNumerico = /^\d+$/.test(q.trim());
      const params = esNumerico
        ? `codigoExacto=${encodeURIComponent(q.trim())}`
        : `q=${encodeURIComponent(q.trim())}`;
      const res = await fetch(`/api/productos?${params}&limit=10`);
      const data = await res.json();
      const lista = esNumerico && data.producto ? [data.producto] : (data.productos || []);
      setSugerencias(lista);
      setShowSugerencias(lista.length > 0);
      setSelectedIdx(0);
    } catch {
      setSugerencias([]);
    }
  };

  const seleccionarProducto = async (p: Producto) => {
    setProducto(p);
    setSearch(`${p.codigo} - ${p.nombre}`);
    setShowSugerencias(false);
    setCantidad(Math.max(1, p.stockMinimo - p.stock));
    await cargarMovimientos(p.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSugerencias) {
      if (e.key === "Enter") {
        e.preventDefault();
        buscarProducto(search);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, sugerencias.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      seleccionarProducto(sugerencias[selectedIdx]);
    } else if (e.key === "Escape") {
      setShowSugerencias(false);
    }
  };

  const buscarProducto = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setProducto(null);
    try {
      const esNumerico = /^\d+$/.test(q.trim());
      const params = esNumerico
        ? `codigoExacto=${encodeURIComponent(q.trim())}`
        : `q=${encodeURIComponent(q.trim())}`;
      const res = await fetch(`/api/productos?${params}&limit=1`);
      const data = await res.json();
      const p = esNumerico ? data.producto : data.productos?.[0];
      if (p) {
        setProducto(p);
        setSearch(`${p.codigo} - ${p.nombre}`);
        setCantidad(Math.max(1, p.stockMinimo - p.stock));
        await cargarMovimientos(p.id);
      } else {
        toast.error("Producto no encontrado");
      }
    } catch {
      toast.error("Error al buscar producto");
    } finally {
      setLoading(false);
    }
  };

  const cargarMovimientos = async (productoId: string) => {
    setLoadingMovs(true);
    try {
      const res = await fetch(`/api/inventario/movimientos?productoId=${productoId}&limit=10`);
      const data = await res.json();
      setMovimientos(data.movimientos || []);
    } catch {
      setMovimientos([]);
    } finally {
      setLoadingMovs(false);
    }
  };

  const handleReponer = async () => {
    if (!producto || cantidad <= 0) return;
    setReponiendo(true);
    try {
      const res = await fetch("/api/inventario/reponer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId: producto.id,
          cantidad,
          referencia: referencia.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al reponer");
      }
      toast.success(`Stock repuesto: +${cantidad} unidades`);
      setCantidad(1);
      setReferencia("");
      setSearch("");
      setProducto(null);
      setMovimientos([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al reponer stock");
    } finally {
      setReponiendo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Buscador con autocomplete */}
      <div ref={searchRef} className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar producto</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => sugerencias.length > 0 && setShowSugerencias(true)}
            placeholder="Buscar por código de barras, código o nombre..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            autoComplete="off"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <Barcode className="w-3 h-3" />
          Código numérico = búsqueda exacta (ideal para lector de barras). Flechas ↑↓ para navegar sugerencias.
        </p>

        {/* Dropdown sugerencias */}
        {showSugerencias && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-20 max-h-72 overflow-y-auto">
            {sugerencias.map((p, i) => {
              const necesitaRepo = p.stock <= p.stockMinimo;
              return (
                <button
                  key={p.id}
                  onClick={() => seleccionarProducto(p)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 last:border-0 transition-colors ${
                    i === selectedIdx ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                    p.stock <= 0 ? "bg-red-100 text-red-600" :
                    necesitaRepo ? "bg-orange-100 text-orange-600" :
                    "bg-green-100 text-green-600"
                  }`}>
                    {p.stock}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.nombre}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="font-mono">{p.codigo}</span>
                      {p.categoria?.nombre && (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{p.categoria.nombre}</span>
                      )}
                      <span className="text-gray-300">S/ {Number(p.precioVenta).toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="text-right text-xs shrink-0">
                    {p.stock <= 0 ? (
                      <span className="text-red-600 font-semibold">Agotado</span>
                    ) : necesitaRepo ? (
                      <span className="text-orange-600 font-semibold">Stock: {p.stock}</span>
                    ) : (
                      <span className="text-gray-400">Stock: {p.stock}</span>
                    )}
                    <p className="text-gray-300">Mín: {p.stockMinimo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      )}

      {producto && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{producto.nombre}</h3>
                <p className="text-sm text-gray-500 font-mono mt-0.5">{producto.codigo}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  producto.stock <= producto.stockMinimo
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {producto.stock <= producto.stockMinimo && <AlertTriangle className="w-3 h-3" />}
                  Stock: {producto.stock}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className={`rounded-lg p-3 ${producto.stock <= producto.stockMinimo ? "bg-red-50" : "bg-gray-50"}`}>
                <p className="text-gray-500">Stock actual</p>
                <p className="text-xl font-bold text-gray-900">{producto.stock}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Stock mínimo</p>
                <p className="text-xl font-bold text-gray-900">{producto.stockMinimo}</p>
              </div>
            </div>

            {producto.stock < producto.stockMinimo && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200 text-sm text-orange-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Faltan <strong>{producto.stockMinimo - producto.stock}</strong> unidades para alcanzar el stock mínimo</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a reponer</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCantidad(cantidad + 1)}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="flex gap-1 ml-2">
                    {[5, 10, 25, 50].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCantidad(n)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          cantidad === n
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        +{n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referencia <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Factura, proveedor, etc."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleReponer}
                disabled={reponiendo || cantidad <= 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {reponiendo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Package className="w-4 h-4" />
                )}
                {reponiendo ? "Reponiendo..." : `Reponer +${cantidad} unidades`}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 px-5 py-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Últimos movimientos</h4>
            {loadingMovs ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            ) : movimientos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin movimientos registrados</p>
            ) : (
              <div className="space-y-2">
                {movimientos.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm py-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${m.tipo === "ENTRADA" ? "bg-green-500" : "bg-red-500"}`} />
                      <span className="text-gray-600">{m.tipo === "ENTRADA" ? "+" : "-"}{m.cantidad}</span>
                      <span className="text-gray-400 text-xs capitalize">{m.motivo}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(m.createdAt).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!producto && !loading && (
        <div className="flex flex-col items-center py-16 text-center">
          <Search className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Busca un producto para reponer</p>
          <p className="text-gray-400 text-sm mt-1">Usa el código de barras, código interno o nombre</p>
        </div>
      )}
    </div>
  );
}
