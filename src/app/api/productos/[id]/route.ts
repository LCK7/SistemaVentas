import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: { categoria: { select: { id: true, nombre: true } } },
  });

  if (!producto) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  return NextResponse.json(producto);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await req.json();

    // Si es una desactivación
    if (data.activo !== undefined) {
      const producto = await prisma.producto.update({
        where: { id },
        data: { activo: data.activo },
        include: { categoria: { select: { id: true, nombre: true } } },
      });
      return NextResponse.json(producto);
    }

    // Actualización normal
    const producto = await prisma.producto.update({
      where: { id },
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        precioCompra: parseFloat(data.precioCompra),
        precioVenta: parseFloat(data.precioVenta),
        stock: parseInt(data.stock) ?? undefined,
        stockMinimo: parseInt(data.stockMinimo) ?? undefined,
        iva: data.iva ?? undefined,
        categoriaId: data.categoriaId,
      },
      include: { categoria: { select: { id: true, nombre: true } } },
    });
    return NextResponse.json(producto);
  } catch (error) {
    console.error("Error actualizando producto:", error);
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}
