import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const config = await prisma.configuracion.findMany({
      orderBy: { clave: "asc" },
    });
    return NextResponse.json(config);
  } catch {
    return NextResponse.json([]);
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede modificar la configuración" }, { status: 403 });
  }

  try {
    const { config } = await req.json();

    for (const [clave, data] of Object.entries(config)) {
      const item = data as { valor: string; tipo?: string };
      await prisma.configuracion.upsert({
        where: { clave },
        update: { valor: item.valor },
        create: {
          clave,
          valor: item.valor,
          tipo: item.tipo || "string",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error guardando configuración:", error);
    return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 });
  }
}
