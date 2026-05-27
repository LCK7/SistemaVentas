import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const caja = await prisma.caja.findFirst({
      where: { activo: true },
      include: {
        movimientos: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { usuario: { select: { nombre: true } } },
        },
      },
    });

    if (!caja) {
      return NextResponse.json({ error: "No hay caja activa" }, { status: 404 });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ventasHoy = await prisma.venta.aggregate({
      where: { createdAt: { gte: hoy }, cajaId: caja.id, estado: "COMPLETADA" },
      _sum: { total: true },
    });

    return NextResponse.json({
      ...caja,
      ventasHoyTotal: Number(ventasHoy._sum.total || 0),
    });
  } catch (error) {
    console.error("Error obteniendo caja:", error);
    return NextResponse.json({ error: "Error al obtener caja" }, { status: 500 });
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
    const { tipo, monto, descripcion } = data;

    const caja = await prisma.caja.findFirst({ where: { activo: true } });
    if (!caja) {
      return NextResponse.json({ error: "No hay caja activa" }, { status: 404 });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Verificar si ya hay cierre hoy — bloquea todo después del cierre
    const existingCierre = await prisma.movimientoCaja.findFirst({
      where: { cajaId: caja.id, tipo: "CIERRE", createdAt: { gte: hoy } },
    });
    if (existingCierre) {
      return NextResponse.json({ error: "La caja ya fue cerrada hoy. No se permiten más movimientos." }, { status: 400 });
    }

    if (tipo === "APERTURA") {
      const existingApertura = await prisma.movimientoCaja.findFirst({
        where: { cajaId: caja.id, tipo: "APERTURA", createdAt: { gte: hoy } },
      });
      if (existingApertura) {
        return NextResponse.json({ error: "La caja ya fue abierta hoy" }, { status: 400 });
      }
    }

    const movimiento = await prisma.movimientoCaja.create({
      data: {
        tipo,
        monto: parseFloat(monto) || 0,
        descripcion: descripcion || `Movimiento: ${tipo}`,
        cajaId: caja.id,
        usuarioId: user.id,
      },
      include: { usuario: { select: { nombre: true } } },
    });

    // Actualizar saldo
    if (tipo === "APERTURA" || tipo === "INGRESO") {
      await prisma.caja.update({
        where: { id: caja.id },
        data: { saldoActual: { increment: parseFloat(monto) || 0 } },
      });
    } else if (tipo === "EGRESO") {
      await prisma.caja.update({
        where: { id: caja.id },
        data: { saldoActual: { decrement: parseFloat(monto) || 0 } },
      });
    } else if (tipo === "CIERRE") {
      await prisma.caja.update({
        where: { id: caja.id },
        data: { saldoActual: parseFloat(monto) || 0 },
      });
    }

    return NextResponse.json(movimiento, { status: 201 });
  } catch (error) {
    console.error("Error en movimiento de caja:", error);
    return NextResponse.json({ error: "Error al procesar movimiento" }, { status: 500 });
  }
}
