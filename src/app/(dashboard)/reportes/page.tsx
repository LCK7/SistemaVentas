"use client";

import { useState, useEffect } from "react";
import { BarChart3, Download, Calendar, Users, ShoppingCart, FileText, TrendingUp, Loader2, Package, ArrowUpDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

type Vendedor = { id: string; nombre: string };

type Movimiento = {
  id: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  motivo: string;
  referencia: string | null;
  createdAt: string;
  producto: { id: string; codigo: string; nombre: string };
  usuario: { id: string; nombre: string };
};

function VentasReporte() {
  const hoy = new Date().toISOString().split("T")[0];
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(hoy);

  const handleChangeDesde = (val: string) => {
    setDesde(val);
    if (val > hasta) setHasta(val);
  };

  const handleChangeHasta = (val: string) => {
    if (val < desde) return;
    setHasta(val);
  };
  const [usuarioId, setUsuarioId] = useState("");
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [descargando, setDescargando] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetch("/api/usuarios")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setVendedores(data.filter((u: any) => u.rol === "VENDEDOR" || u.rol === "ADMIN"));
      })
      .catch(() => {});
  }, []);

  const fetchData = () => {
    setLoadingData(true);
    const params = new URLSearchParams({ desde, hasta });
    if (usuarioId) params.set("usuarioId", usuarioId);
    fetch(`/api/ventas/resumen-reporte?${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoadingData(false));
  };

  useEffect(() => {
    fetchData();
  }, [desde, hasta, usuarioId]);

  const reportUrl = (formato: string) => {
    const params = new URLSearchParams();
    params.set("formato", formato);
    params.set("desde", desde);
    params.set("hasta", hasta);
    if (usuarioId) params.set("usuarioId", usuarioId);
    return `/api/ventas/reporte?${params}`;
  };

  const handleDownload = async (formato: string) => {
    setDescargando(formato);
    try {
      const res = await fetch(reportUrl(formato));
      if (!res.ok) {
        const text = await res.text();
        toast.error(`Error al generar ${formato.toUpperCase()}: ${text}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-ventas-${new Date().toISOString().split("T")[0]}.${formato === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${formato.toUpperCase()} descargado correctamente`);
    } catch {
      toast.error(`Error al descargar ${formato.toUpperCase()}`);
    } finally {
      setDescargando(null);
    }
  };

  const resumen = data?.resumen;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Filtros del Reporte</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={desde}
                max={hoy}
                onChange={(e) => handleChangeDesde(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={hasta}
                min={desde}
                max={hoy}
                onChange={(e) => handleChangeHasta(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
              >
                <option value="">Todos los vendedores</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>{v.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={fetchData}
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
            <button
              onClick={() => handleDownload("pdf")}
              disabled={descargando !== null}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {descargando === "pdf" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              PDF
            </button>
            <button
              onClick={() => handleDownload("excel")}
              disabled={descargando !== null}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {descargando === "excel" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {loadingData ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : resumen ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total Vendido</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(resumen.totalVentas)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Tickets Emitidos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{resumen.totalTickets}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Ticket Promedio</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(resumen.promedioTicket)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Días en el Período</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Math.max(1, Math.ceil((new Date(hasta).getTime() - new Date(desde).getTime()) / 86400000) + 1)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Ventas por Día */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Ventas por Día</h3>
              </div>
              {data.ventasPorDia?.length > 0 ? (
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {data.ventasPorDia.map((d: any) => (
                    <div key={d.fecha} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-gray-600">
                        {new Date(d.fecha + "T00:00:00").toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-8 text-right">{d.ventas} tkt</span>
                        <span className="font-medium text-gray-900 w-24 text-right">{formatCurrency(d.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">Sin ventas en el período</p>
              )}
            </div>

            {/* Rendimiento por Vendedor */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Rendimiento por Vendedor</h3>
              </div>
              {data.ventasPorVendedor?.length > 0 ? (
                <div className="space-y-2">
                  {data.ventasPorVendedor.map((v: any) => (
                    <div key={v.usuarioId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{v.nombre}</p>
                        <p className="text-xs text-gray-400">{v.tickets} tickets</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(v.total)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">Sin datos de vendedores</p>
              )}
            </div>

            {/* Productos Más Vendidos */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Productos Más Vendidos</h3>
              </div>
              {data.topProductos?.length > 0 ? (
                <div className="space-y-2">
                  {data.topProductos.map((p: any, i: number) => (
                    <div key={p.codigo} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? "bg-yellow-100 text-yellow-700" :
                        i === 1 ? "bg-gray-100 text-gray-600" :
                        i === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-gray-50 text-gray-400"
                      }`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.nombre}</p>
                        <p className="text-xs text-gray-400">{p.cantidad} vendidos</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(p.total)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">Sin productos vendidos</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-400">Selecciona un período y presiona Actualizar</div>
      )}
    </div>
  );
}

function InventarioReporte() {
  const hoy = new Date().toISOString().split("T")[0];
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const handleChangeDesde = (val: string) => {
    setDesde(val);
    if (val && hasta && val > hasta) setHasta(val);
  };

  const handleChangeHasta = (val: string) => {
    if (val && desde && val < desde) return;
    setHasta(val);
  };
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [resumen, setResumen] = useState({ totalEntradas: 0, totalSalidas: 0, totalMovimientos: 0 });
  const [loading, setLoading] = useState(true);

  const fetchReporte = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);

      const res = await fetch(`/api/inventario/reporte?${params}`);
      const data = await res.json();
      setMovimientos(data.movimientos || []);
      setResumen(data.resumen || { totalEntradas: 0, totalSalidas: 0, totalMovimientos: 0 });
    } catch {
      toast.error("Error al cargar reporte de inventario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReporte();
  }, []);

  const diferencia = resumen.totalEntradas - resumen.totalSalidas;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              max={hoy}
              onChange={(e) => handleChangeDesde(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              min={desde || undefined}
              max={hoy}
              onChange={(e) => handleChangeHasta(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReporte}
              className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Entradas</p>
          <p className="text-2xl font-bold text-green-600">+{resumen.totalEntradas}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Salidas</p>
          <p className="text-2xl font-bold text-red-600">-{resumen.totalSalidas}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Diferencia Neta</p>
          <p className={`text-2xl font-bold ${diferencia >= 0 ? "text-blue-600" : "text-red-600"}`}>
            {diferencia >= 0 ? "+" : ""}{diferencia}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Movimientos</p>
          <p className="text-2xl font-bold text-gray-900">{resumen.totalMovimientos}</p>
        </div>
      </div>

      {/* Tabla de movimientos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Movimientos de Stock</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : movimientos.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No hay movimientos en el período seleccionado</div>
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
                        m.tipo === "ENTRADA" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.usuario.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState<"ventas" | "inventario">("ventas");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reportes</h2>
        <p className="text-gray-500 mt-1">Análisis y exportación de datos del negocio</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("ventas")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "ventas"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Ventas
        </button>
        <button
          onClick={() => setActiveTab("inventario")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "inventario"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Package className="w-4 h-4" />
          Inventario
        </button>
      </div>

      {activeTab === "ventas" ? <VentasReporte /> : <InventarioReporte />}
    </div>
  );
}
