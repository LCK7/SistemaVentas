"use client";

import Link from "next/link";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  AlertTriangle,
  Receipt,
  Clock,
  DollarSign,
  BarChart3,
  Settings,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type DashboardClientProps = {
  userNombre: string;
  userRol: string;
  totalVentasHoy: number;
  totalTicketsHoy: number;
  totalProductos: number;
  totalVendedores: number;
  stockBajo: { nombre: string; stock: number; stockMinimo: number }[];
  ventasRecientes: {
    id: string;
    ticket: number;
    total: number;
    vendedor: string;
    productos: number;
    fecha: string;
  }[];
};

export default function DashboardClient({
  userNombre,
  userRol,
  totalVentasHoy,
  totalTicketsHoy,
  totalProductos,
  totalVendedores,
  stockBajo,
  ventasRecientes,
}: DashboardClientProps) {
  const promedioTicket = totalTicketsHoy > 0 ? totalVentasHoy / totalTicketsHoy : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
          Bienvenido, {userNombre}
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-gray-500">
            Resumen del día —{" "}
            {new Date().toLocaleDateString("es-PE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              userRol === "ADMIN"
                ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            <Users className="w-3 h-3" />
            {userRol === "ADMIN" ? "Dueño" : "Vendedor"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-100 group-hover:shadow-xl group-hover:shadow-green-200 transition-all">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
              Hoy
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalVentasHoy)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Ventas del día</p>
          {totalVentasHoy > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-green-600 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>Meta del día activa</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-100 group-hover:shadow-xl group-hover:shadow-blue-200 transition-all">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">
              Hoy
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalTicketsHoy}</p>
          <p className="text-sm text-gray-500 mt-1">Tickets emitidos</p>
          <p className="text-xs text-gray-400 mt-1">
            {totalTicketsHoy > 0
              ? `Prom. ${formatCurrency(promedioTicket)}`
              : "Sin ventas"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-100 group-hover:shadow-xl group-hover:shadow-purple-200 transition-all">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full font-medium">
              Total
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalProductos}</p>
          <p className="text-sm text-gray-500 mt-1">Productos activos</p>
          <p className="text-xs text-gray-400 mt-1">
            {stockBajo.length} con stock bajo
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-100 group-hover:shadow-xl group-hover:shadow-orange-200 transition-all">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full font-medium">
              Equipo
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalVendedores}</p>
          <p className="text-sm text-gray-500 mt-1">Vendedores activos</p>
          <Link
            href="/ventas/historial"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 inline-block"
          >
            Ver rendimiento →
          </Link>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-blue-600" />
          Acceso Rápido a Módulos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <Link
            href="/ventas/nueva"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-200 card-hover group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-100 group-hover:shadow-xl group-hover:shadow-green-200 transition-all">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              Nueva Venta
            </span>
            <span className="text-xs text-gray-400">POS</span>
          </Link>

          <Link
            href="/ventas"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-200 card-hover group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-100 group-hover:shadow-xl group-hover:shadow-blue-200 transition-all">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              Ventas
            </span>
            <span className="text-xs text-gray-400">Historial</span>
          </Link>

          <Link
            href="/inventario"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-200 card-hover group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-100 group-hover:shadow-xl group-hover:shadow-purple-200 transition-all">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              Inventario
            </span>
            <span className="text-xs text-gray-400">Productos</span>
          </Link>

          <Link
            href="/clientes"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-200 card-hover group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-100 group-hover:shadow-xl group-hover:shadow-pink-200 transition-all">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              Clientes
            </span>
            <span className="text-xs text-gray-400">Directorio</span>
          </Link>

          <Link
            href="/finanzas"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-200 card-hover group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-100 group-hover:shadow-xl group-hover:shadow-emerald-200 transition-all">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              Finanzas
            </span>
            <span className="text-xs text-gray-400">Caja y gastos</span>
          </Link>

          <Link
            href="/reportes"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-200 card-hover group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-100 group-hover:shadow-xl group-hover:shadow-orange-200 transition-all">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              Reportes
            </span>
            <span className="text-xs text-gray-400">PDF y Excel</span>
          </Link>

          {userRol === "ADMIN" && (
            <>
              <Link
                href="/usuarios"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-200 card-hover group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:shadow-xl group-hover:shadow-indigo-200 transition-all">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  Usuarios
                </span>
                <span className="text-xs text-gray-400">Gestión</span>
              </Link>

              <Link
                href="/configuracion"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-200 card-hover group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-lg shadow-slate-100 group-hover:shadow-xl group-hover:shadow-slate-200 transition-all">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  Configuración
                </span>
                <span className="text-xs text-gray-400">Negocio</span>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Alertas de Stock</h3>
            </div>
            {stockBajo.length > 0 && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                {stockBajo.length} productos
              </span>
            )}
          </div>
          {stockBajo.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">Todo en orden</p>
              <p className="text-xs text-gray-400 mt-1">
                Stock suficiente en todos los productos
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {stockBajo.map((p) => (
                <div
                  key={p.nombre}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-amber-50 to-amber-50/50 border border-amber-100 group hover:from-amber-100 hover:to-amber-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {p.nombre}
                      </span>
                      <p className="text-xs text-gray-400">
                        Stock mínimo: {p.stockMinimo}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                    {p.stock} uds
                  </span>
                </div>
              ))}
              <Link
                href="/inventario"
                className="block text-center text-xs text-blue-600 hover:text-blue-700 font-medium pt-2"
              >
                Ir al inventario →
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Ventas Recientes</h3>
            </div>
            <Link
              href="/ventas/historial"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todo →
            </Link>
          </div>
          {ventasRecientes.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <ShoppingCart className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                Sin ventas hoy
              </p>
              <Link
                href="/ventas/nueva"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
              >
                Ir al POS →
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {ventasRecientes.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-all">
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Ticket #{v.ticket}
                      </p>
                      <p className="text-xs text-gray-500">
                        {v.vendedor} · {v.productos} productos
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(v.total)}
                  </span>
                </div>
              ))}
              {ventasRecientes.length > 5 && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  +{ventasRecientes.length - 5} más
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
