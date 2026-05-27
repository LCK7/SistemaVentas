import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { nombre, descripcion, activo } = await req.json();

    const data: any = {};
    if (nombre !== undefined) data.nombre = nombre.trim();
    if (descripcion !== undefined) data.descripcion = descripcion?.trim() || null;
    if (activo !== undefined) data.activo = activo;

    const categoria = await prisma.categoria.update({
      where: { id },
      data,
    });

    return NextResponse.json(categoria);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const productsCount = await prisma.producto.count({ where: { categoriaId: id } });
    if (productsCount > 0) {
      return NextResponse.json({
        error: `No se puede eliminar: ${productsCount} producto(s) usan esta categoría. Deshabilítala en su lugar.`,
      }, { status: 409 });
    }

    await prisma.categoria.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 });
  }
}
