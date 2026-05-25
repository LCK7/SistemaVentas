import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const categorias = await prisma.categoria.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(categorias);
}
