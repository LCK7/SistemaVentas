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
  const formato = searchParams.get("formato") || "json";

  const where: any = {};
  if (desde || hasta) {
    where.createdAt = {};
    if (desde) where.createdAt.gte = new Date(desde);
    if (hasta) where.createdAt.lte = new Date(hasta);
  }

  const [movimientos, totales] = await Promise.all([
    prisma.movimientoInventario.findMany({
      where,
      include: {
        producto: { select: { id: true, codigo: true, nombre: true } },
        usuario: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.movimientoInventario.groupBy({
      by: ["tipo"],
      where,
      _sum: { cantidad: true },
    }),
  ]);

  const entradas = totales.find((t) => t.tipo === "ENTRADA")?._sum.cantidad || 0;
  const salidas = totales.find((t) => t.tipo === "SALIDA")?._sum.cantidad || 0;

  if (formato === "json") {
    return NextResponse.json({
      movimientos,
      resumen: { totalEntradas: entradas, totalSalidas: salidas, totalMovimientos: movimientos.length },
    });
  }

  return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
}
