import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import DashboardClient from "./DashboardClient";

export default async function DashboardHome() {
  const session = await auth();
  const user = session?.user as any;

  const [ventasHoy, totalProductos, totalVendedores, ventasRecientes] =
    await Promise.all([
      prisma.venta.findMany({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          estado: "COMPLETADA",
        },
        include: {
          usuario: { select: { nombre: true } },
          detalles: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.producto.count({ where: { activo: true } }),
      prisma.usuario.count({ where: { rol: "VENDEDOR", activo: true } }),
      prisma.venta.findMany({
        where: { estado: "COMPLETADA" },
        include: {
          usuario: { select: { nombre: true } },
          detalles: { include: { producto: { select: { nombre: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  const totalVentasHoy = ventasHoy.reduce(
    (sum, v) => sum + Number(v.total),
    0
  );
  const totalTicketsHoy = ventasHoy.length;

  const todosProductos = await prisma.producto.findMany({
    where: { activo: true },
    select: { nombre: true, stock: true, stockMinimo: true },
    orderBy: { stock: "asc" },
  });
  const stockBajo = todosProductos
    .filter((p) => p.stock <= p.stockMinimo)
    .slice(0, 5);

  return (
    <DashboardClient
      userNombre={user?.nombre || "Usuario"}
      userRol={user?.rol || "VENDEDOR"}
      totalVentasHoy={totalVentasHoy}
      totalTicketsHoy={totalTicketsHoy}
      totalProductos={totalProductos}
      totalVendedores={totalVendedores}
      stockBajo={stockBajo.map((p) => ({
        nombre: p.nombre,
        stock: p.stock,
        stockMinimo: p.stockMinimo,
      }))}
      ventasRecientes={ventasRecientes.map((v) => ({
        id: v.id,
        ticket: v.numeroTicket,
        total: Number(v.total),
        vendedor: v.usuario.nombre,
        productos: v.detalles.length,
        fecha: v.createdAt.toISOString(),
      }))}
    />
  );
}
