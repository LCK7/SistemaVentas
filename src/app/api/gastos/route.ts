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
  const categoria = searchParams.get("categoria");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = {};
  if (desde || hasta) {
    where.createdAt = {};
    if (desde) where.createdAt.gte = new Date(desde);
    if (hasta) where.createdAt.lte = new Date(hasta + "T23:59:59.999Z");
  }
  if (categoria) where.categoria = categoria;

  try {
    const [gastos, total, totalMonto] = await Promise.all([
      prisma.gasto.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.gasto.count({ where }),
      prisma.gasto.aggregate({ where, _sum: { monto: true } }),
    ]);

    return NextResponse.json({
      gastos,
      total,
      totalMonto: totalMonto._sum.monto || 0,
    });
  } catch (error) {
    console.error("Error obteniendo gastos:", error);
    return NextResponse.json({ error: "Error al obtener gastos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await req.json();

    if (!data.concepto || !data.monto || !data.categoria) {
      return NextResponse.json({ error: "Campos requeridos: concepto, monto, categoria" }, { status: 400 });
    }

    const gasto = await prisma.gasto.create({
      data: {
        concepto: data.concepto,
        monto: parseFloat(data.monto),
        categoria: data.categoria,
        usuarioId: user.id,
        descripcion: data.descripcion || null,
      },
    });

    // Descontar de caja
    const caja = await prisma.caja.findFirst({ where: { activo: true } });
    if (caja) {
      await prisma.caja.update({
        where: { id: caja.id },
        data: { saldoActual: { decrement: parseFloat(data.monto) } },
      });

      await prisma.movimientoCaja.create({
        data: {
          tipo: "EGRESO",
          monto: parseFloat(data.monto),
          descripcion: `Gasto: ${data.concepto}`,
          cajaId: caja.id,
          usuarioId: user.id,
        },
      });
    }

    return NextResponse.json(gasto, { status: 201 });
  } catch (error) {
    console.error("Error creando gasto:", error);
    return NextResponse.json({ error: "Error al crear gasto" }, { status: 500 });
  }
}
