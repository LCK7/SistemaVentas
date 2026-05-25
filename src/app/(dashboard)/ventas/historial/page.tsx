"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Calendar, Download, Printer, Eye, Loader2, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";

type Venta = {
  id: string;
  numeroTicket: number;
  total: number;
  metodoPago: string;
  estado: string;
  createdAt: string;
  usuario: { nombre: string };
  cliente: { nombre: string } | null;
  detalles: { cantidad: number; producto: { nombre: string } }[];
};

export default function HistorialVentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [desde, setDesde] = useState(new Date().toISOString().split("T")[0]);
  const [hasta, setHasta] = useState(new Date().toISOString().split("T")[0]);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);

  const fetchVentas = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      params.set("limit", "50");

      const res = await fetch(`/api/ventas?${params}`);
      const data = await res.json();
      setVentas(data.ventas || []);
    } catch {
      toast.error("Error al cargar ventas");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  const filteredVentas = ventas.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(v.numeroTicket).includes(q) ||
      v.usuario.nombre.toLowerCase().includes(q) ||
      (v.cliente?.nombre || "").toLowerCase().includes(q)
    );
  });

  const downloadBoleta = (ventaId: string) => {
    window.open(`/api/ventas/boleta?ventaId=${ventaId}`, "_blank");
  };

  const metodoLabels: Record<string, string> = {
    EFECTIVO: "Efectivo",
    TARJETA: "Tarjeta",
    TRANSFERENCIA: "Transferencia",
    OTRO: "Otro",
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Historial de Ventas</h2>
        <p className="text-gray-500 mt-1">Consulta y descarga tus ventas</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none"
          />
          <span className="text-gray-400">a</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none"
          />
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar ticket, vendedor, cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 ml-auto">
          <a
            href={`/api/ventas/reporte?formato=pdf&desde=${desde}&hasta=${hasta}`}
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            PDF
          </a>
          <a
            href={`/api/ventas/reporte?formato=excel&desde=${desde}&hasta=${hasta}`}
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Excel
          </a>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : filteredVentas.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <ShoppingCart className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500">No hay ventas en este período</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ticket</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Vendedor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Items</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Pago</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVentas.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-blue-600">#{v.numeroTicket}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(v.createdAt).toLocaleDateString("es-PE", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{v.usuario.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{v.cliente?.nombre || "-"}</td>
                  <td className="px-4 py-3 text-center">{v.detalles.reduce((s, d) => s + d.cantidad, 0)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {metodoLabels[v.metodoPago] || v.metodoPago}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      v.estado === "COMPLETADA" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {v.estado === "COMPLETADA" ? "Completada" : "Anulada"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    S/ {Number(v.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedVenta(v)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadBoleta(v.id)}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"
                        title="Descargar boleta"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal detalle */}
      {selectedVenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold">Ticket #{selectedVenta.numeroTicket}</h3>
              <button onClick={() => setSelectedVenta(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Fecha</p>
                  <p className="font-medium">{new Date(selectedVenta.createdAt).toLocaleString("es-PE")}</p>
                </div>
                <div>
                  <p className="text-gray-500">Vendedor</p>
                  <p className="font-medium">{selectedVenta.usuario.nombre}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cliente</p>
                  <p className="font-medium">{selectedVenta.cliente?.nombre || "Sin cliente"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Método de Pago</p>
                  <p className="font-medium">{metodoLabels[selectedVenta.metodoPago]}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Productos</p>
                <div className="space-y-2">
                  {selectedVenta.detalles.map((d, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {d.cantidad}x {d.producto.nombre}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-between">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">
                  S/ {Number(selectedVenta.total).toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => {
                  downloadBoleta(selectedVenta.id);
                  setSelectedVenta(null);
                }}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Descargar Boleta PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
