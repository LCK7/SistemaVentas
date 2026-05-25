"use client";

import { useState } from "react";
import { BarChart3, Download, Calendar, Users, ShoppingCart, FileText, TrendingUp } from "lucide-react";

export default function ReportesPage() {
  const [desde, setDesde] = useState(new Date().toISOString().split("T")[0]);
  const [hasta, setHasta] = useState(new Date().toISOString().split("T")[0]);
  const [usuarioId, setUsuarioId] = useState("");

  const reportUrl = (formato: string) => {
    const params = new URLSearchParams();
    params.set("formato", formato);
    params.set("desde", desde);
    params.set("hasta", hasta);
    if (usuarioId) params.set("usuarioId", usuarioId);
    return `/api/ventas/reporte?${params}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reportes</h2>
        <p className="text-gray-500 mt-1">Análisis y exportación de datos del negocio</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Filtros del Reporte</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
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
                onChange={(e) => setHasta(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor (opcional)</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                placeholder="ID del vendedor"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={reportUrl("pdf")}
            target="_blank"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Descargar PDF
          </a>
          <a
            href={reportUrl("excel")}
            target="_blank"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar Excel
          </a>
        </div>
      </div>

      {/* Tipos de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Ventas por Período</h3>
          <p className="text-sm text-gray-500 mt-1">Análisis de ventas diarias, semanales y mensuales</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Rendimiento por Vendedor</h3>
          <p className="text-sm text-gray-500 mt-1">Ventas totales por cada vendedor del equipo</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Productos Más Vendidos</h3>
          <p className="text-sm text-gray-500 mt-1">Top productos con mayor rotación en el período</p>
        </div>
      </div>
    </div>
  );
}
