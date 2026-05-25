import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  const where: any = {};
  if (query) {
    where.OR = [
      { nombre: { contains: query, mode: "insensitive" } },
      { nit: { contains: query, mode: "insensitive" } },
    ];
  }

  const clientes = await prisma.cliente.findMany({
    where,
    orderBy: { nombre: "asc" },
    take: 50,
  });

  return NextResponse.json(clientes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const cliente = await prisma.cliente.create({
      data: {
        nombre: data.nombre,
        telefono: data.telefono || null,
        email: data.email || null,
        direccion: data.direccion || null,
        nit: data.nit || null,
      },
    });
    return NextResponse.json(cliente, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "El NIT ya está registrado" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 });
  }
}
