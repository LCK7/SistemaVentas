import { PrismaClient, Rol } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de datos...");

  // ─── Limpiar datos existentes ─────────────────────────
  await prisma.detalleVenta.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.movimientoInventario.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.movimientoCaja.deleteMany();
  await prisma.caja.deleteMany();
  await prisma.gasto.deleteMany();
  await prisma.rolPermiso.deleteMany();
  await prisma.permiso.deleteMany();
  await prisma.configuracion.deleteMany();
  await prisma.usuario.deleteMany();

  // ─── PERMISOS ─────────────────────────────────────────
  const permisos = [
    { nombre: "ventas:crear", descripcion: "Crear nuevas ventas (POS)" },
    { nombre: "ventas:anular", descripcion: "Anular ventas existentes" },
    { nombre: "ventas:ver-todas", descripcion: "Ver ventas de todos los vendedores" },
    { nombre: "inventario:ver", descripcion: "Ver productos e inventario" },
    { nombre: "inventario:editar", descripcion: "Crear y editar productos" },
    { nombre: "inventario:ajustar-stock", descripcion: "Realizar ajustes de stock" },
    { nombre: "clientes:ver", descripcion: "Ver lista de clientes" },
    { nombre: "clientes:editar", descripcion: "Crear y editar clientes" },
    { nombre: "clientes:eliminar", descripcion: "Eliminar clientes" },
    { nombre: "finanzas:ver", descripcion: "Ver módulo de finanzas" },
    { nombre: "finanzas:gastos", descripcion: "Registrar gastos" },
    { nombre: "finanzas:caja", descripcion: "Gestionar caja" },
    { nombre: "reportes:ver", descripcion: "Ver reportes generales" },
    { nombre: "reportes:exportar", descripcion: "Exportar reportes" },
    { nombre: "usuarios:gestionar", descripcion: "Gestionar usuarios del sistema" },
    { nombre: "configuracion:ver", descripcion: "Ver configuración del sistema" },
    { nombre: "configuracion:editar", descripcion: "Editar configuración y permisos" },
  ];

  for (const permiso of permisos) {
    await prisma.permiso.create({ data: permiso });
  }
  console.log(`✅ ${permisos.length} permisos creados`);

  // ─── ASIGNAR PERMISOS A ROLES ─────────────────────────
  // ADMIN tiene todos los permisos
  const todosPermisos = await prisma.permiso.findMany();
  for (const permiso of todosPermisos) {
    await prisma.rolPermiso.create({
      data: { rol: "ADMIN", permisoId: permiso.id },
    });
  }

  // VENDEDOR tiene permisos limitados
  const permisosVendedor = [
    "ventas:crear",
    "inventario:ver",
    "clientes:ver",
    "clientes:editar",
    "finanzas:caja",
  ];
  for (const nombre of permisosVendedor) {
    const permiso = todosPermisos.find((p) => p.nombre === nombre);
    if (permiso) {
      await prisma.rolPermiso.create({
        data: { rol: "VENDEDOR", permisoId: permiso.id },
      });
    }
  }
  console.log("✅ Permisos asignados a roles");

  // ─── USUARIOS ─────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123", 10);
  const vendedorPassword = await bcrypt.hash("vendedor123", 10);

  const admin = await prisma.usuario.create({
    data: {
      nombre: "Carlos Mendoza",
      email: "admin@minimarket.com",
      passwordHash: adminPassword,
      rol: "ADMIN",
    },
  });

  const vendedor1 = await prisma.usuario.create({
    data: {
      nombre: "María García",
      email: "vendedor@minimarket.com",
      passwordHash: vendedorPassword,
      rol: "VENDEDOR",
    },
  });

  const vendedor2 = await prisma.usuario.create({
    data: {
      nombre: "Juan Pérez",
      email: "juan@minimarket.com",
      passwordHash: vendedorPassword,
      rol: "VENDEDOR",
    },
  });
  console.log("✅ Usuarios creados");

  // ─── CONFIGURACIÓN ────────────────────────────────────
  const configuraciones = [
    { clave: "nombre_negocio", valor: "Mi MiniMarket", tipo: "string" },
    { clave: "moneda", valor: "PEN", tipo: "string" },
    { clave: "simbolo_moneda", valor: "S/", tipo: "string" },
    { clave: "impuesto_nombre", valor: "IGV", tipo: "string" },
    { clave: "impuesto_porcentaje", valor: "18", tipo: "number" },
    { clave: "aplicar_impuesto", valor: "true", tipo: "boolean" },
    { clave: "ruc", valor: "12345678901", tipo: "string" },
    { clave: "direccion", valor: "Av. Principal 123", tipo: "string" },
    { clave: "telefono", valor: "999-888-777", tipo: "string" },
  ];

  for (const config of configuraciones) {
    await prisma.configuracion.create({ data: config });
  }
  console.log("✅ Configuraciones creadas");

  // ─── CATEGORÍAS ──────────────────────────────────────
  const categorias = [
    { nombre: "Lácteos", descripcion: "Leche, yogur, queso, mantequilla" },
    { nombre: "Panadería", descripcion: "Pan, pasteles, galletas" },
    { nombre: "Bebidas", descripcion: "Gaseosas, jugos, agua" },
    { nombre: "Abarrotes", descripcion: "Arroz, azúcar, fideos, conservas" },
    { nombre: "Limpieza", descripcion: "Detergente, jabón, desinfectantes" },
    { nombre: "Snacks", descripcion: "Papas, chocolates, caramelos" },
    { nombre: "Cuidado Personal", descripcion: "Shampoo, pasta dental, jabón" },
  ];

  for (const cat of categorias) {
    await prisma.categoria.create({ data: cat });
  }
  console.log("✅ Categorías creadas");

  // ─── PRODUCTOS ───────────────────────────────────────
  const categoriasDB = await prisma.categoria.findMany();
  const catMap = Object.fromEntries(categoriasDB.map((c) => [c.nombre, c.id]));

  const productos = [
    { codigo: "75010001", nombre: "Leche Gloria 1L", precioCompra: 3.5, precioVenta: 5.0, stock: 50, stockMinimo: 10, categoria: "Lácteos" },
    { codigo: "75010002", nombre: "Yogur Gloria Natural 1L", precioCompra: 4.0, precioVenta: 6.5, stock: 30, stockMinimo: 8, categoria: "Lácteos" },
    { codigo: "75010003", nombre: "Queso Fresco 250g", precioCompra: 5.0, precioVenta: 8.0, stock: 20, stockMinimo: 5, categoria: "Lácteos" },
    { codigo: "75020001", nombre: "Pan Molde Bimbo 450g", precioCompra: 4.5, precioVenta: 7.0, stock: 40, stockMinimo: 10, categoria: "Panadería" },
    { codigo: "75020002", nombre: "Galletas Oreo 120g", precioCompra: 2.0, precioVenta: 3.5, stock: 60, stockMinimo: 15, categoria: "Panadería" },
    { codigo: "75030001", nombre: "Coca-Cola 1.5L", precioCompra: 4.0, precioVenta: 6.5, stock: 45, stockMinimo: 10, categoria: "Bebidas" },
    { codigo: "75030002", nombre: "Agua San Luis 1L", precioCompra: 1.5, precioVenta: 2.5, stock: 80, stockMinimo: 20, categoria: "Bebidas" },
    { codigo: "75030003", nombre: "Jugo Del Valle 1L", precioCompra: 3.0, precioVenta: 5.0, stock: 35, stockMinimo: 8, categoria: "Bebidas" },
    { codigo: "75040001", nombre: "Arroz Costeño 1kg", precioCompra: 2.5, precioVenta: 4.0, stock: 100, stockMinimo: 20, categoria: "Abarrotes" },
    { codigo: "75040002", nombre: "Azúcar Rubia 1kg", precioCompra: 2.0, precioVenta: 3.5, stock: 90, stockMinimo: 20, categoria: "Abarrotes" },
    { codigo: "75040003", nombre: "Fideos Don Vittorio 500g", precioCompra: 1.8, precioVenta: 3.0, stock: 70, stockMinimo: 15, categoria: "Abarrotes" },
    { codigo: "75040004", nombre: "Aceite Primor 1L", precioCompra: 5.0, precioVenta: 8.5, stock: 25, stockMinimo: 8, categoria: "Abarrotes" },
    { codigo: "75050001", nombre: "Detergente Ariel 500g", precioCompra: 4.5, precioVenta: 7.5, stock: 30, stockMinimo: 8, categoria: "Limpieza" },
    { codigo: "75050002", nombre: "Jabón Lux 125g", precioCompra: 1.5, precioVenta: 2.5, stock: 4, stockMinimo: 10, categoria: "Limpieza" },
    { codigo: "75050003", nombre: "Lejía Clorox 1L", precioCompra: 2.5, precioVenta: 4.0, stock: 3, stockMinimo: 10, categoria: "Limpieza" },
    { codigo: "75060001", nombre: "Papas Lays 120g", precioCompra: 2.5, precioVenta: 4.0, stock: 50, stockMinimo: 12, categoria: "Snacks" },
    { codigo: "75060002", nombre: "Chocolate Sublime 50g", precioCompra: 1.5, precioVenta: 2.5, stock: 2, stockMinimo: 15, categoria: "Snacks" },
    { codigo: "75070001", nombre: "Shampoo Pantene 400ml", precioCompra: 8.0, precioVenta: 13.0, stock: 15, stockMinimo: 5, categoria: "Cuidado Personal" },
    { codigo: "75070002", nombre: "Pasta Dental Colgate 90ml", precioCompra: 3.5, precioVenta: 6.0, stock: 40, stockMinimo: 10, categoria: "Cuidado Personal" },
    { codigo: "75070003", nombre: "Jabón Dove 90g", precioCompra: 2.0, precioVenta: 3.5, stock: 6, stockMinimo: 10, categoria: "Cuidado Personal" },
  ];

  for (const p of productos) {
    await prisma.producto.create({
      data: {
        codigo: p.codigo,
        nombre: p.nombre,
        precioCompra: p.precioCompra,
        precioVenta: p.precioVenta,
        stock: p.stock,
        stockMinimo: p.stockMinimo,
        categoriaId: catMap[p.categoria],
      },
    });
  }
  console.log(`✅ ${productos.length} productos creados`);

  // ─── CLIENTES ─────────────────────────────────────────
  const clientes = [
    { nombre: "Ana Torres", telefono: "987-654-321", email: "ana@email.com" },
    { nombre: "Pedro Sánchez", telefono: "976-543-210", email: "pedro@email.com" },
    { nombre: "Lucía Fernández", telefono: "965-432-109", email: "lucia@email.com" },
  ];

  for (const c of clientes) {
    await prisma.cliente.create({ data: c });
  }
  console.log("✅ Clientes creados");

  // ─── CAJA ─────────────────────────────────────────────
  await prisma.caja.create({
    data: { nombre: "Caja Principal", saldoActual: 500.0 },
  });
  console.log("✅ Caja creada");

  console.log("\n🎉 Seed completado exitosamente!");
  console.log("📧 Admin: admin@minimarket.com / admin123");
  console.log("📧 Vendedor: vendedor@minimarket.com / vendedor123");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
