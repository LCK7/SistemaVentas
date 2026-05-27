import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const usuarioId = searchParams.get("usuarioId");

  const where: any = { estado: "COMPLETADA" };
  if (desde || hasta) {
    where.createdAt = {};
    if (desde) where.createdAt.gte = new Date(desde);
    if (hasta) where.createdAt.lte = new Date(hasta + "T23:59:59.999Z");
  }
  if (usuarioId) where.usuarioId = usuarioId;

  try {
    const resumen = await prisma.venta.aggregate({
      where,
      _sum: { total: true },
      _count: true,
    });

    // Ventas por día
    const ventas = await prisma.venta.findMany({
      where,
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const ventasPorDiaMap = new Map<string, { total: number; ventas: number }>();
    for (const v of ventas) {
      const fecha = v.createdAt.toISOString().split("T")[0];
      const prev = ventasPorDiaMap.get(fecha) || { total: 0, ventas: 0 };
      prev.total += Number(v.total);
      prev.ventas += 1;
      ventasPorDiaMap.set(fecha, prev);
    }
    const ventasPorDia = Array.from(ventasPorDiaMap.entries()).map(([fecha, data]) => ({
      fecha,
      ...data,
    }));

    // Ventas por vendedor
    const ventasPorVendedorRaw = await prisma.venta.groupBy({
      by: ["usuarioId"],
      where,
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
    });

    const usuarios = await prisma.usuario.findMany({
      where: { id: { in: ventasPorVendedorRaw.map((v) => v.usuarioId) } },
      select: { id: true, nombre: true },
    });
    const usuarioMap = Object.fromEntries(usuarios.map((u) => [u.id, u.nombre]));

    const ventasPorVendedor = ventasPorVendedorRaw.map((v) => ({
      usuarioId: v.usuarioId,
      nombre: usuarioMap[v.usuarioId] || "Desconocido",
      total: Number(v._sum.total || 0),
      tickets: v._count,
    }));

    // Top productos: buscar detalles join con venta
    const ventasConFiltro = await prisma.venta.findMany({
      where,
      select: { id: true },
    });
    const ventaIds = ventasConFiltro.map((v) => v.id);

    const detalles = await prisma.detalleVenta.findMany({
      where: { ventaId: { in: ventaIds } },
      select: {
        cantidad: true,
        subtotal: true,
        producto: { select: { nombre: true, codigo: true } },
      },
    });

    const prodMap = new Map<string, { nombre: string; codigo: string; cantidad: number; total: number }>();
    for (const d of detalles) {
      const key = d.producto.codigo;
      const prev = prodMap.get(key) || {
        nombre: d.producto.nombre,
        codigo: d.producto.codigo,
        cantidad: 0,
        total: 0,
      };
      prev.cantidad += d.cantidad;
      prev.total += Number(d.subtotal);
      prodMap.set(key, prev);
    }
    const topProductos = Array.from(prodMap.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    return NextResponse.json({
      resumen: {
        totalVentas: Number(resumen._sum.total || 0),
        totalTickets: resumen._count,
        promedioTicket: resumen._count > 0 ? Number(resumen._sum.total || 0) / resumen._count : 0,
      },
      ventasPorDia,
      ventasPorVendedor,
      topProductos,
    });
  } catch (error) {
    console.error("Error en resumen reporte:", error);
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}
