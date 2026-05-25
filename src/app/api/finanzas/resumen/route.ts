import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

    const [
      caja,
      ventasHoy,
      ventasMes,
      gastosHoy,
      gastosMes,
      totalVentas,
      totalGastos,
      ventasPorDia,
      gastosPorCategoria,
      metodosPago,
    ] = await Promise.all([
      prisma.caja.findFirst({ where: { activo: true } }),
      prisma.venta.aggregate({
        where: { createdAt: { gte: hoy }, estado: "COMPLETADA" },
        _sum: { total: true },
        _count: true,
      }),
      prisma.venta.aggregate({
        where: { createdAt: { gte: inicioMes }, estado: "COMPLETADA" },
        _sum: { total: true },
        _count: true,
      }),
      prisma.gasto.aggregate({
        where: { createdAt: { gte: hoy } },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.gasto.aggregate({
        where: { createdAt: { gte: inicioMes } },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.venta.aggregate({
        where: { estado: "COMPLETADA" },
        _sum: { total: true },
      }),
      prisma.gasto.aggregate({
        where: {},
        _sum: { monto: true },
      }),
      // Ventas por día (últimos 7 días)
      prisma.$queryRaw`
        SELECT DATE(created_at) as fecha, SUM(total) as total, COUNT(*) as ventas
        FROM ventas
        WHERE created_at >= NOW() - INTERVAL '7 days'
          AND estado = 'COMPLETADA'
        GROUP BY DATE(created_at)
        ORDER BY fecha ASC
      `,
      // Gastos por categoría
      prisma.gasto.groupBy({
        by: ["categoria"],
        _sum: { monto: true },
        _count: true,
        orderBy: { _sum: { monto: "desc" } },
      }),
      // Métodos de pago usados hoy
      prisma.venta.groupBy({
        by: ["metodoPago"],
        where: { createdAt: { gte: hoy }, estado: "COMPLETADA" },
        _sum: { total: true },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      caja: {
        saldoActual: Number(caja?.saldoActual || 0),
        nombre: caja?.nombre || "Sin caja",
      },
      hoy: {
        ventas: Number(ventasHoy._sum.total || 0),
        tickets: ventasHoy._count,
        gastos: Number(gastosHoy._sum.monto || 0),
        gastosCount: gastosHoy._count,
        balance: Number(ventasHoy._sum.total || 0) - Number(gastosHoy._sum.monto || 0),
      },
      mes: {
        ventas: Number(ventasMes._sum.total || 0),
        tickets: ventasMes._count,
        gastos: Number(gastosMes._sum.monto || 0),
        gastosCount: gastosMes._count,
        balance: Number(ventasMes._sum.total || 0) - Number(gastosMes._sum.monto || 0),
      },
      historico: {
        totalVentas: Number(totalVentas._sum.total || 0),
        totalGastos: Number(totalGastos._sum.monto || 0),
      },
      ventasPorDia,
      gastosPorCategoria,
      metodosPago,
    });
  } catch (error) {
    console.error("Error obteniendo resumen financiero:", error);
    return NextResponse.json({ error: "Error al obtener resumen" }, { status: 500 });
  }
}
