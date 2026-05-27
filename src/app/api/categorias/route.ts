import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const todas = searchParams.get("todas") === "true";

  const categorias = await prisma.categoria.findMany({
    where: todas ? {} : { activo: true },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(categorias);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { nombre, descripcion } = await req.json();
    if (!nombre?.trim()) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const categoria = await prisma.categoria.create({
      data: { nombre: nombre.trim(), descripcion: descripcion?.trim() || null },
    });

    return NextResponse.json(categoria, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 });
  }
}
