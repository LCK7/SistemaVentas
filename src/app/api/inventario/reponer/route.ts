import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { productoId, codigo, cantidad, referencia } = await req.json();

    if (!cantidad || cantidad <= 0) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }

    let producto;
    if (productoId) {
      producto = await prisma.producto.findUnique({ where: { id: productoId } });
    } else if (codigo) {
      producto = await prisma.producto.findUnique({ where: { codigo } });
    } else {
      return NextResponse.json({ error: "productoId o codigo requerido" }, { status: 400 });
    }

    if (!producto) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const [movimiento] = await prisma.$transaction([
      prisma.movimientoInventario.create({
        data: {
          tipo: "ENTRADA",
          cantidad: parseInt(cantidad),
          motivo: "reposicion",
          referencia: referencia || null,
          userId: user.id,
          productoId: producto.id,
        },
      }),
      prisma.producto.update({
        where: { id: producto.id },
        data: { stock: { increment: parseInt(cantidad) } },
      }),
    ] as const);

    const productoActualizado = await prisma.producto.findUnique({
      where: { id: producto.id },
      include: { categoria: { select: { id: true, nombre: true } } },
    });

    return NextResponse.json({ movimiento, producto: productoActualizado }, { status: 201 });
  } catch (error) {
    console.error("Error en reposición:", error);
    return NextResponse.json({ error: "Error al reponer stock" }, { status: 500 });
  }
}
