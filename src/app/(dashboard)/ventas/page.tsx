import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShoppingCart, Plus, History, TrendingUp, Receipt } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default async function VentasPage() {
  const session = await auth();
  const user = session?.user as any;

  const ventasHoy = await prisma.venta.findMany({
    where: {
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      estado: "COMPLETADA",
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      usuario: { select: { nombre: true } },
      detalles: { select: { cantidad: true } },
    },
  });

  const totalHoy = ventasHoy.reduce((s, v) => s + Number(v.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ventas</h2>
          <p className="text-gray-500 mt-1">Punto de venta y gestión de ventas</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/ventas/nueva"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva Venta
          </Link>
          <Link
            href="/ventas/historial"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <History className="w-4 h-4" />
            Historial
          </Link>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalHoy)}</p>
          <p className="text-sm text-gray-500">Ventas de hoy</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{ventasHoy.length}</p>
          <p className="text-sm text-gray-500">Tickets hoy</p>
        </div>
        <Link href="/ventas/nueva" className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white hover:from-blue-700 hover:to-blue-800 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold">Abrir POS</p>
          <p className="text-sm text-blue-100 group-hover:text-white transition-colors">
            Ir al punto de venta →
          </p>
        </Link>
      </div>

      {/* Ventas recientes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Ventas Recientes</h3>
        {ventasHoy.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No hay ventas registradas hoy</p>
        ) : (
          <div className="space-y-2">
            {ventasHoy.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Ticket #{v.numeroTicket}</p>
                    <p className="text-xs text-gray-500">{v.usuario.nombre} · {v.detalles.reduce((s, d) => s + d.cantidad, 0)} productos</p>
                  </div>
                </div>
                <span className="text-sm font-semibold">S/ {Number(v.total).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
