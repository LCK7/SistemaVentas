import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await req.json();
    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nombre: data.nombre,
        telefono: data.telefono ?? null,
        email: data.email ?? null,
        direccion: data.direccion ?? null,
        nit: data.nit ?? null,
      },
    });
    return NextResponse.json(cliente);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "El NIT ya está registrado" }, { status: 400 });
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 });
  }
}
