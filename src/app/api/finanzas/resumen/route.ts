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

    const whereEgresosHoy = { tipo: "EGRESO" as const, createdAt: { gte: hoy } };
    const whereEgresosMes = { tipo: "EGRESO" as const, createdAt: { gte: inicioMes } };

    const [
      caja,
      ventasHoy,
      ventasMes,
      gastosHoy,
      gastosMes,
      egresosHoy,
      egresosMes,
      totalVentas,
      totalGastos,
      totalEgresos,
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
      prisma.movimientoCaja.aggregate({
        where: whereEgresosHoy,
        _sum: { monto: true },
        _count: true,
      }),
      prisma.movimientoCaja.aggregate({
        where: whereEgresosMes,
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
      prisma.movimientoCaja.aggregate({
        where: { tipo: "EGRESO" },
        _sum: { monto: true },
      }),
      // Ventas por día (últimos 7 días)
      prisma.$queryRaw`
        SELECT DATE("createdAt") as fecha, SUM("total") as total, COUNT(*)::int as ventas
        FROM "ventas"
        WHERE "createdAt" >= NOW() - INTERVAL '7 days'
          AND "estado" = 'COMPLETADA'
        GROUP BY DATE("createdAt")
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

    const egresosHoyTotal = Number(egresosHoy._sum.monto || 0);
    const egresosMesTotal = Number(egresosMes._sum.monto || 0);
    const gastosHoyTotal = Number(gastosHoy._sum.monto || 0);
    const gastosMesTotal = Number(gastosMes._sum.monto || 0);
    const ventasHoyTotal = Number(ventasHoy._sum.total || 0);
    const ventasMesTotal = Number(ventasMes._sum.total || 0);

    return NextResponse.json({
      caja: {
        saldoActual: Number(caja?.saldoActual || 0),
        nombre: caja?.nombre || "Sin caja",
      },
      hoy: {
        ventas: ventasHoyTotal,
        tickets: ventasHoy._count,
        gastos: gastosHoyTotal,
        gastosCount: gastosHoy._count,
        egresos: egresosHoyTotal,
        egresosCount: egresosHoy._count,
        totalSalidas: gastosHoyTotal + egresosHoyTotal,
        balance: ventasHoyTotal - gastosHoyTotal - egresosHoyTotal,
      },
      mes: {
        ventas: ventasMesTotal,
        tickets: ventasMes._count,
        gastos: gastosMesTotal,
        gastosCount: gastosMes._count,
        egresos: egresosMesTotal,
        egresosCount: egresosMes._count,
        totalSalidas: gastosMesTotal + egresosMesTotal,
        balance: ventasMesTotal - gastosMesTotal - egresosMesTotal,
      },
      historico: {
        totalVentas: Number(totalVentas._sum.total || 0),
        totalGastos: Number(totalGastos._sum.monto || 0),
        totalEgresos: Number(totalEgresos._sum.monto || 0),
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
