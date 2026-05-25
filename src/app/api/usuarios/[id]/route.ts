import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      activo: true,
      createdAt: true,
    },
  });

  if (!usuario) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json(usuario);
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

    // Desactivar/activar usuario (nunca eliminar)
    if (data.activo !== undefined) {
      if (id === user.id && !data.activo) {
        return NextResponse.json({ error: "No puedes desactivarte a ti mismo" }, { status: 400 });
      }
      const usuario = await prisma.usuario.update({
        where: { id },
        data: { activo: data.activo },
        select: { id: true, nombre: true, email: true, rol: true, activo: true },
      });
      return NextResponse.json(usuario);
    }

    // Actualizar datos
    const updateData: any = {};
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.email) updateData.email = data.email;
    if (data.rol) updateData.rol = data.rol;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    });

    return NextResponse.json(usuario);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 });
    }
    console.error("Error actualizando usuario:", error);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}
