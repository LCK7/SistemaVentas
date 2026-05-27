import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productoId = searchParams.get("productoId");
  const tipo = searchParams.get("tipo");
  const motivo = searchParams.get("motivo");
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = {};
  if (productoId) where.productoId = productoId;
  if (tipo) where.tipo = tipo;
  if (motivo) where.motivo = motivo;
  if (desde || hasta) {
    where.createdAt = {};
    if (desde) where.createdAt.gte = new Date(desde);
    if (hasta) where.createdAt.lte = new Date(hasta);
  }

  const [movimientos, total] = await Promise.all([
    prisma.movimientoInventario.findMany({
      where,
      include: {
        producto: { select: { id: true, codigo: true, nombre: true } },
        usuario: { select: { id: true, nombre: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.movimientoInventario.count({ where }),
  ]);

  return NextResponse.json({ movimientos, total, page, limit });
}
