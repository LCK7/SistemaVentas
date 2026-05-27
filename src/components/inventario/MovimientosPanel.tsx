"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

type Movimiento = {
  id: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  motivo: string;
  referencia: string | null;
  createdAt: string;
  producto: { id: string; codigo: string; nombre: string };
  usuario: { id: string; nombre: string; email: string };
};

export default function MovimientosPanel() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroMotivo, setFiltroMotivo] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const fetchMovimientos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("productoId", search);
      if (filtroTipo) params.set("tipo", filtroTipo);
      if (filtroMotivo) params.set("motivo", filtroMotivo);
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/inventario/movimientos?${params}`);
      const data = await res.json();
      setMovimientos(data.movimientos || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  }, [search, filtroTipo, filtroMotivo, desde, hasta, page]);

  useEffect(() => {
    fetchMovimientos();
  }, [fetchMovimientos]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por producto..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          />
        </div>
        <select
          value={filtroTipo}
          onChange={(e) => { setFiltroTipo(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Todos los tipos</option>
          <option value="ENTRADA">Entrada</option>
          <option value="SALIDA">Salida</option>
        </select>
        <select
          value={filtroMotivo}
          onChange={(e) => { setFiltroMotivo(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Todos los motivos</option>
          <option value="reposicion">Reposición</option>
          <option value="venta">Venta</option>
          <option value="ajuste">Ajuste</option>
        </select>
        <input
          type="date"
          value={desde}
          onChange={(e) => { setDesde(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
          title="Desde"
        />
        <input
          type="date"
          value={hasta}
          onChange={(e) => { setHasta(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
          title="Hasta"
        />
        <span className="text-sm text-gray-400">
          {total} movimiento(s)
        </span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : movimientos.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No hay movimientos registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Producto</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Cantidad</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Motivo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Referencia</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{m.producto.nombre}</span>
                      <span className="text-gray-400 ml-2 font-mono text-xs">{m.producto.codigo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.tipo === "ENTRADA"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {m.tipo === "ENTRADA" ? "Entrada" : "Salida"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      <span className={m.tipo === "ENTRADA" ? "text-green-600" : "text-red-600"}>
                        {m.tipo === "ENTRADA" ? "+" : "-"}{m.cantidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{m.motivo}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{m.referencia || "-"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.usuario.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
