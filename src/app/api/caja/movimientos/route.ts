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
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = {};
  if (desde || hasta) {
    where.createdAt = {};
    if (desde) where.createdAt.gte = new Date(desde);
    if (hasta) where.createdAt.lte = new Date(hasta + "T23:59:59.999Z");
  }

  try {
    const [movimientos, total] = await Promise.all([
      prisma.movimientoCaja.findMany({
        where,
        include: {
          usuario: { select: { nombre: true } },
          caja: { select: { nombre: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.movimientoCaja.count({ where }),
    ]);

    return NextResponse.json({ movimientos, total });
  } catch (error) {
    console.error("Error obteniendo movimientos:", error);
    return NextResponse.json({ error: "Error al obtener movimientos" }, { status: 500 });
  }
}
