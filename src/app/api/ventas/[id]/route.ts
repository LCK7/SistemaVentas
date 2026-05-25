import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as any;
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const venta = await prisma.venta.findUnique({
    where: { id },
    include: {
      usuario: { select: { id: true, nombre: true } },
      cliente: { select: { id: true, nombre: true, nit: true } },
      detalles: {
        include: { producto: { select: { id: true, nombre: true, codigo: true } } },
      },
    },
  });

  if (!venta) {
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }

  // Vendedor solo ve sus propias ventas
  if (user.rol !== "ADMIN" && venta.usuarioId !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json(venta);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const data = await req.json();

  if (data.accion === "anular") {
    const venta = await prisma.venta.findUnique({
      where: { id },
      include: { detalles: true },
    });

    if (!venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    if (venta.estado === "ANULADA") {
      return NextResponse.json({ error: "La venta ya está anulada" }, { status: 400 });
    }

    // Restaurar stock
    for (const det of venta.detalles) {
      await prisma.producto.update({
        where: { id: det.productoId },
        data: { stock: { increment: det.cantidad } },
      });

      await prisma.movimientoInventario.create({
        data: {
          tipo: "ENTRADA",
          cantidad: det.cantidad,
          motivo: "anulacion",
          referencia: venta.id,
          userId: user.id,
          productoId: det.productoId,
        },
      });
    }

    // Anular venta
    const ventaAnulada = await prisma.venta.update({
      where: { id },
      data: { estado: "ANULADA" },
      include: {
        usuario: { select: { nombre: true } },
        cliente: { select: { nombre: true } },
        detalles: {
          include: { producto: { select: { nombre: true } } },
        },
      },
    });

    return NextResponse.json(ventaAnulada);
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}
