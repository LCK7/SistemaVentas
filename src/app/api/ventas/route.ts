import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const usuarioId = searchParams.get("usuarioId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};
  if (desde || hasta) {
    where.createdAt = {};
    if (desde) where.createdAt.gte = new Date(desde);
    if (hasta) where.createdAt.lte = new Date(hasta + "T23:59:59.999Z");
  }
  if (usuarioId) where.usuarioId = usuarioId;
  // Vendedor solo ve sus propias ventas
  if (user.rol !== "ADMIN") {
    where.usuarioId = user.id;
  }

  const [ventas, total] = await Promise.all([
    prisma.venta.findMany({
      where,
      include: {
        usuario: { select: { id: true, nombre: true } },
        cliente: { select: { id: true, nombre: true } },
        detalles: {
          include: { producto: { select: { id: true, nombre: true, codigo: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.venta.count({ where }),
  ]);

  return NextResponse.json({ ventas, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { productos, metodoPago, clienteId, montoPagado } = data;

    if (!productos || productos.length === 0) {
      return NextResponse.json({ error: "Debe incluir al menos un producto" }, { status: 400 });
    }

    // Calcular total y verificar stock
    let total = 0;
    const detallesData: any[] = [];

    for (const item of productos) {
      const producto = await prisma.producto.findUnique({
        where: { id: item.productoId },
      });

      if (!producto || !producto.activo) {
        return NextResponse.json({ error: `Producto no encontrado: ${item.productoId}` }, { status: 400 });
      }

      if (producto.stock < item.cantidad) {
        return NextResponse.json({
          error: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
        }, { status: 400 });
      }

      const subtotal = Number(producto.precioVenta) * item.cantidad;
      total += subtotal;

      detallesData.push({
        cantidad: item.cantidad,
        precioUnit: producto.precioVenta,
        subtotal,
        productoId: producto.id,
      });

      // Descontar stock y registrar movimiento
      await prisma.producto.update({
        where: { id: producto.id },
        data: { stock: { decrement: item.cantidad } },
      });

      await prisma.movimientoInventario.create({
        data: {
          tipo: "SALIDA",
          cantidad: item.cantidad,
          motivo: "venta",
          userId: user.id,
          productoId: producto.id,
        },
      });
    }

    // Verificar que la caja no esté cerrada hoy
    const caja = await prisma.caja.findFirst({ where: { activo: true } });
    if (caja) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const cierreHoy = await prisma.movimientoCaja.findFirst({
        where: { cajaId: caja.id, tipo: "CIERRE", createdAt: { gte: hoy } },
      });
      if (cierreHoy) {
        return NextResponse.json({ error: "La caja ya fue cerrada hoy. No se pueden registrar más ventas." }, { status: 400 });
      }

      await prisma.caja.update({
        where: { id: caja.id },
        data: { saldoActual: { increment: total } },
      });
    }

    // Crear la venta
    const venta = await prisma.venta.create({
      data: {
        total,
        metodoPago: metodoPago || "EFECTIVO",
        usuarioId: user.id,
        clienteId: clienteId || null,
        cajaId: caja?.id || null,
        detalles: { create: detallesData },
      },
      include: {
        usuario: { select: { nombre: true } },
        cliente: { select: { nombre: true } },
        detalles: {
          include: { producto: { select: { nombre: true, codigo: true } } },
        },
      },
    });

    // Registrar movimiento de caja
    if (caja) {
      await prisma.movimientoCaja.create({
        data: {
          tipo: "INGRESO",
          monto: total,
          descripcion: `Venta Ticket #${venta.numeroTicket}`,
          cajaId: caja.id,
          usuarioId: user.id,
        },
      });
    }

    return NextResponse.json(venta, { status: 201 });
  } catch (error) {
    console.error("Error creando venta:", error);
    return NextResponse.json({ error: "Error al procesar la venta" }, { status: 500 });
  }
}
