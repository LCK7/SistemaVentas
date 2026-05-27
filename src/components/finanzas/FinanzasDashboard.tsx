"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Receipt, Wallet, PiggyBank, RefreshCw, Loader2, CreditCard, Banknote, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type ResumenData = {
  caja: { saldoActual: number; nombre: string };
  hoy: { ventas: number; tickets: number; gastos: number; gastosCount: number; egresos: number; egresosCount: number; totalSalidas: number; balance: number };
  mes: { ventas: number; tickets: number; gastos: number; gastosCount: number; egresos: number; egresosCount: number; totalSalidas: number; balance: number };
  historico: { totalVentas: number; totalGastos: number; totalEgresos: number };
  ventasPorDia: { fecha: string; total: number; ventas: number }[];
  gastosPorCategoria: { categoria: string; _sum: { monto: number | null }; _count: number }[];
  metodosPago: { metodoPago: string; _sum: { total: number | null }; _count: number }[];
};

export default function FinanzasDashboard() {
  const [data, setData] = useState<ResumenData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumen();
  }, []);

  const fetchResumen = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finanzas/resumen");
      if (!res.ok) {
        console.error("Error fetching resumen:", res.status, await res.text());
        setData(null);
        return;
      }
      const json = await res.json();
      if (!json || typeof json.ventasPorDia === "undefined") {
        console.error("API response missing expected fields:", json);
        setData(null);
        return;
      }
      setData(json);
    } catch (e) {
      console.error("Error fetching resumen:", e);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) return null;

  const maxVenta = Math.max(...data.ventasPorDia.map((d) => Number(d.total)), 1);
  const metodoLabels: Record<string, string> = {
    EFECTIVO: "Efectivo",
    TARJETA: "Tarjeta",
    TRANSFERENCIA: "Transferencia",
    OTRO: "Otro",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Panel Financiero</h2>
          <p className="text-gray-500 mt-1">Resumen financiero del negocio</p>
        </div>
        <button
          onClick={fetchResumen}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-200">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">Actual</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.caja.saldoActual)}</p>
          <p className="text-sm text-gray-500 mt-1">Saldo en Caja</p>
          <p className="text-xs text-gray-400 mt-1">{data.caja.nombre}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">Hoy</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.hoy.ventas)}</p>
          <p className="text-sm text-gray-500 mt-1">Ventas del Día</p>
          <p className="text-xs text-gray-400 mt-1">{data.hoy.tickets} tickets</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-200">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">Hoy</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.hoy.totalSalidas)}</p>
          <p className="text-sm text-gray-500 mt-1">Salidas del Día</p>
          <p className="text-xs text-gray-400 mt-1">
            {formatCurrency(data.hoy.gastos)} gastos · {formatCurrency(data.hoy.egresos)} egresos
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg ${data.hoy.balance >= 0 ? "from-emerald-400 to-emerald-600 shadow-emerald-200" : "from-red-400 to-red-600 shadow-red-200"}`}>
              {data.hoy.balance >= 0 ? (
                <ArrowUpRight className="w-6 h-6 text-white" />
              ) : (
                <ArrowDownRight className="w-6 h-6 text-white" />
              )}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${data.hoy.balance >= 0 ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"}`}>
              {data.hoy.balance >= 0 ? "Positivo" : "Negativo"}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(Math.abs(data.hoy.balance))}</p>
          <p className="text-sm text-gray-500 mt-1">Balance del Día</p>
          <p className="text-xs text-gray-400 mt-1">{data.hoy.balance >= 0 ? "Ganancia" : "Pérdida"}</p>
        </div>
      </div>

      {/* Gráficos y tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por día (últimos 7 días) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Ventas Últimos 7 Días
            </h3>
          </div>
          {data.ventasPorDia.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {data.ventasPorDia.map((dia, i) => {
                const total = Number(dia.total);
                const height = Math.max((total / maxVenta) * 100, 5);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20">
                      {new Date(dia.fecha).toLocaleDateString("es-PE", { weekday: "short", day: "numeric" })}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${height}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-24 text-right">
                      {formatCurrency(total)}
                    </span>
                    <span className="text-xs text-gray-400 w-10 text-right">
                      {dia.ventas}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gastos por Categoría */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-red-500" />
              Gastos por Categoría
            </h3>
          </div>
          {data.gastosPorCategoria.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin gastos registrados</p>
          ) : (
            <div className="space-y-3">
              {data.gastosPorCategoria.map((cat, i) => {
                const total = Number(cat._sum.monto || 0);
                const maxGasto = Math.max(...data.gastosPorCategoria.map((c) => Number(c._sum.monto || 0)));
                const height = Math.max((total / maxGasto) * 100, 5);
                const colors = [
                  "from-red-400 to-red-500",
                  "from-orange-400 to-orange-500",
                  "from-amber-400 to-amber-500",
                  "from-yellow-400 to-yellow-500",
                  "from-pink-400 to-pink-500",
                  "from-rose-400 to-rose-500",
                ];
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-28 truncate">{cat.categoria}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors[i % colors.length]} rounded-full transition-all duration-500`}
                        style={{ width: `${height}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-24 text-right">
                      {formatCurrency(total)}
                    </span>
                    <span className="text-xs text-gray-400 w-10 text-right">
                      {cat._count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Métodos de Pago Hoy */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900">Métodos de Pago Hoy</h3>
          </div>
          {data.metodosPago.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin ventas hoy</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {data.metodosPago.map((mp, i) => {
                const total = Number(mp._sum.total || 0);
                const porcentaje = data.hoy.ventas > 0 ? ((total / data.hoy.ventas) * 100).toFixed(0) : 0;
                const icons: Record<string, typeof Banknote> = {
                  EFECTIVO: Banknote,
                  TARJETA: CreditCard,
                  TRANSFERENCIA: CreditCard,
                  OTRO: Wallet,
                };
                const Icon = icons[mp.metodoPago] || Wallet;
                return (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {metodoLabels[mp.metodoPago] || mp.metodoPago}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(total)}</p>
                    <p className="text-xs text-gray-400">
                      {mp._count} ventas · {porcentaje}%
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen del Mes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-900">Resumen del Mes</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-blue-700 font-medium">Ventas del Mes</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(data.mes.ventas)}</p>
              <p className="text-xs text-blue-600">{data.mes.tickets} tickets emitidos</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-red-700 font-medium">Salidas del Mes</span>
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(data.mes.totalSalidas)}</p>
              <p className="text-xs text-red-600">
                {formatCurrency(data.mes.gastos)} gastos · {formatCurrency(data.mes.egresos)} egresos
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-emerald-700 font-medium">Balance del Mes</span>
                {data.mes.balance >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
              </div>
              <p className={`text-2xl font-bold ${data.mes.balance >= 0 ? "text-emerald-900" : "text-red-900"}`}>
                {formatCurrency(data.mes.balance)}
              </p>
              <p className="text-xs text-gray-500">
                Ventas - Salidas (gastos + egresos)
              </p>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total histórico ventas</span>
                <span className="font-semibold text-gray-900">{formatCurrency(data.historico.totalVentas)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-500">Total histórico gastos</span>
                <span className="font-semibold text-gray-900">{formatCurrency(data.historico.totalGastos)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-500">Total histórico egresos</span>
                <span className="font-semibold text-gray-900">{formatCurrency(data.historico.totalEgresos)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
