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
  const categoriaId = searchParams.get("categoriaId");
  const incluirInactivos = searchParams.get("incluirInactivos") === "true";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = {};
  if (!incluirInactivos) where.activo = true;
  if (categoriaId) where.categoriaId = categoriaId;
  if (query) {
    where.OR = [
      { nombre: { contains: query, mode: "insensitive" } },
      { codigo: { contains: query, mode: "insensitive" } },
    ];
  }

  const [productos, total] = await Promise.all([
    prisma.producto.findMany({
      where,
      include: { categoria: { select: { id: true, nombre: true } } },
      orderBy: { nombre: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.producto.count({ where }),
  ]);

  return NextResponse.json({ productos, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const producto = await prisma.producto.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        precioCompra: parseFloat(data.precioCompra),
        precioVenta: parseFloat(data.precioVenta),
        stock: parseInt(data.stock) || 0,
        stockMinimo: parseInt(data.stockMinimo) || 5,
        iva: data.iva ?? true,
        categoriaId: data.categoriaId,
      },
      include: { categoria: { select: { id: true, nombre: true } } },
    });
    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    console.error("Error creando producto:", error);
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}
