# 🏪 Sistema de Ventas para Minimarket — Planeación

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js 14** (App Router) | 14.x | Framework full-stack (SSR, API Routes, React) |
| **React** | 18.x | UI interactiva |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 3.x | Estilos utility-first |
| **PostgreSQL** | 15+ | Base de datos relacional |
| **Prisma ORM** | 5.x | ORM type-safe para PostgreSQL |
| **NextAuth.js** | 4.x | Autenticación (credenciales + roles) |
| **Recharts / Tremor** | - | Gráficos y reportes |
| **Zustand** | 4.x | Estado global del lado del cliente |
| **React Hook Form + Zod** | - | Formularios con validación |
| **Shadcn/ui** | - | Componentes base accesibles |

---

## 📐 Arquitectura del Sistema

### Estructura de Carpetas

```
sistemaVentas/
├── prisma/
│   ├── schema.prisma          # Modelos de base de datos
│   └── seed.ts                # Datos de prueba
├── src/
│   ├── app/                   # App Router (Next.js 14)
│   │   ├── (auth)/            # Grupo de rutas de autenticación
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/       # Grupo de rutas protegidas (layout con sidebar)
│   │   │   ├── ventas/        # Módulo Ventas (POS)
│   │   │   ├── inventario/    # Módulo Inventario
│   │   │   ├── finanzas/      # Módulo Finanzas
│   │   │   ├── reportes/      # Módulo Reportes
│   │   │   ├── usuarios/      # Gestión de usuarios (solo admin)
│   │   │   └── configuracion/ # Configuración del sistema
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # [...nextauth]
│   │   │   ├── ventas/
│   │   │   ├── inventario/
│   │   │   ├── productos/
│   │   │   ├── clientes/
│   │   │   ├── finanzas/
│   │   │   ├── reportes/
│   │   │   ├── usuarios/
│   │   │   └── configuracion/
│   │   └── layout.tsx
│   ├── components/            # Componentes reutilizables
│   │   ├── ui/                # Shadcn/ui components
│   │   ├── layout/            # Sidebar, Navbar, etc.
│   │   ├── ventas/            # POS, Ticket, etc.
│   │   ├── inventario/        # Tablas, filtros, etc.
│   │   ├── finanzas/          # Gráficos, resúmenes
│   │   ├── reportes/          # Tablas dinámicas, exportación
│   │   └── shared/            # Loaders, EmptyState, etc.
│   ├── lib/                   # Utilidades compartidas
│   │   ├── prisma.ts          # Cliente Prisma singleton
│   │   ├── auth.ts            # Configuración NextAuth
│   │   └── utils.ts           # Funciones helper
│   ├── hooks/                 # Custom hooks
│   ├── types/                 # Tipos TypeScript compartidos
│   └── middleware.ts          # Protección de rutas por rol
├── public/                    # Assets estáticos
├── .env                       # Variables de entorno (DB, JWT, etc.)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## 🗄️ Modelo de Base de Datos (Prisma)

### Diagrama Entidad-Relación (Texto)

```
USUARIO ────< VENTA >─── DETALLE_VENTA >─── PRODUCTO
  │                        │
  │                        └─── PRODUCTO
  │
  ├─── ROL (enum: ADMIN, VENDEDOR)
  │
  └─── PERMISO (M:M con ROL vía ROL_PERMISO)

CLIENTE ────< VENTA

PRODUCTO ────< MOVIMIENTO_INVENTARIO
  │
  └─── CATEGORIA

CAJA ────< VENTA
  │
  └─── MOVIMIENTO_CAJA

GASTO

CONFIGURACION (KV store)
```

### Schema Prisma

```prisma
// Enum: Roles del sistema
enum Rol {
  ADMIN        // Dueño — acceso total
  VENDEDOR     // Vendedor — acceso limitado
}

enum TipoMovimientoCaja {
  APERTURA
  CIERRE
  INGRESO
  EGRESO
}

enum TipoMovimientoInventario {
  ENTRADA      // Compra a proveedor, ajuste+
  SALIDA       // Venta, merma, ajuste-
}

enum EstadoVenta {
  COMPLETADA
  ANULADA
}

enum MetodoPago {
  EFECTIVO
  TARJETA
  TRANSFERENCIA
  OTRO
}

// ─── MÓDULO: USUARIOS Y PERMISOS ─────────────────────────

model Usuario {
  id            String   @id @default(cuid())
  nombre        String
  email         String   @unique
  passwordHash  String
  rol           Rol      @default(VENDEDOR)
  activo        Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  ventas        Venta[]
  movimientosCaja MovimientoCaja[]
  creadoPor     String?  // ID del admin que lo creó

  @@map("usuarios")
}

model Permiso {
  id          String   @id @default(cuid())
  nombre      String   @unique // ej: "ventas:crear", "inventario:editar"
  descripcion String?

  roles       RolPermiso[]

  @@map("permisos")
}

model RolPermiso {
  rol         Rol
  permisoId   String
  permiso     Permiso @relation(fields: [permisoId], references: [id])

  @@id([rol, permisoId])
  @@map("roles_permisos")
}

// ─── MÓDULO: PRODUCTOS E INVENTARIO ───────────────────────

model Categoria {
  id          String   @id @default(cuid())
  nombre      String   @unique
  descripcion String?
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())

  productos   Producto[]

  @@map("categorias")
}

model Producto {
  id              String   @id @default(cuid())
  codigo          String   @unique  // Código de barras o SKU
  nombre          String
  descripcion     String?
  precioCompra    Decimal  @db.Decimal(10, 2)
  precioVenta     Decimal  @db.Decimal(10, 2)
  stock           Int      @default(0)
  stockMinimo     Int      @default(5)   // Alerta de reabastecimiento
  iva             Boolean  @default(true)
  activo          Boolean  @default(true)
  imagenUrl       String?
  categoriaId     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  categoria           Categoria              @relation(fields: [categoriaId], references: [id])
  detalleVentas       DetalleVenta[]
  movimientos         MovimientoInventario[]

  @@index([categoriaId])
  @@index([codigo])
  @@index([nombre])
  @@map("productos")
}

model MovimientoInventario {
  id          String                @id @default(cuid())
  tipo        TipoMovimientoInventario
  cantidad    Int
  motivo      String                // "venta", "compra", "ajuste", "merma"
  referencia  String?               // ID de venta o factura de compra
  createdAt   DateTime              @default(now())
  userId      String
  productoId  String

  producto    Producto              @relation(fields: [productoId], references: [id])

  @@index([productoId])
  @@index([createdAt])
  @@map("movimientos_inventario")
}

// ─── MÓDULO: CLIENTES ─────────────────────────────────────

model Cliente {
  id          String   @id @default(cuid())
  nombre      String
  telefono    String?
  email       String?
  direccion   String?
  nit         String?  @unique  // NIT opcional para facturación
  createdAt   DateTime @default(now())

  ventas      Venta[]

  @@index([nombre])
  @@map("clientes")
}

// ─── MÓDULO: VENTAS (POS) ────────────────────────────────

model Venta {
  id              String       @id @default(cuid())
  numeroTicket    Int          @default(autoincrement())
  total           Decimal      @db.Decimal(10, 2)
  metodoPago      MetodoPago   @default(EFECTIVO)
  estado          EstadoVenta  @default(COMPLETADA)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  usuarioId       String
  clienteId       String?
  cajaId          String?

  usuario         Usuario      @relation(fields: [usuarioId], references: [id])
  cliente         Cliente?     @relation(fields: [clienteId], references: [id])
  caja            Caja?        @relation(fields: [cajaId], references: [id])
  detalles        DetalleVenta[]

  @@index([usuarioId])
  @@index([createdAt])
  @@index([numeroTicket])
  @@map("ventas")
}

model DetalleVenta {
  id          String   @id @default(cuid())
  cantidad    Int
  precioUnit  Decimal  @db.Decimal(10, 2)
  subtotal    Decimal  @db.Decimal(10, 2)

  ventaId     String
  productoId  String

  venta       Venta    @relation(fields: [ventaId], references: [id], onDelete: Cascade)
  producto    Producto @relation(fields: [productoId], references: [id])

  @@index([ventaId])
  @@map("detalles_venta")
}

// ─── MÓDULO: CAJA / FINANZAS ─────────────────────────────

model Caja {
  id          String   @id @default(cuid())
  nombre      String   // "Caja Principal", "Caja 2", etc.
  saldoActual Decimal  @default(0) @db.Decimal(10, 2)
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())

  ventas      Venta[]
  movimientos MovimientoCaja[]

  @@map("cajas")
}

model MovimientoCaja {
  id          String              @id @default(cuid())
  tipo        TipoMovimientoCaja
  monto       Decimal             @db.Decimal(10, 2)
  descripcion String?
  createdAt   DateTime            @default(now())

  cajaId      String
  usuarioId   String

  caja        Caja                @relation(fields: [cajaId], references: [id])

  @@index([cajaId])
  @@index([createdAt])
  @@map("movimientos_caja")
}

model Gasto {
  id          String   @id @default(cuid())
  concepto    String
  monto       Decimal  @db.Decimal(10, 2)
  categoria   String   // "servicios", "proveedores", "nomina", "otros"
  createdAt   DateTime @default(now())
  usuarioId   String

  @@index([createdAt])
  @@index([categoria])
  @@map("gastos")
}

// ─── MÓDULO: CONFIGURACIÓN ───────────────────────────────

model Configuracion {
  id       String @id @default(cuid())
  clave    String @unique
  valor    String // JSON string
  tipo     String @default("string") // "string", "number", "boolean", "json"

  @@map("configuracion")
}
```

---

## 🔐 Modelo de Permisos (RBAC)

### Roles Base

| Rol | Descripción |
|-----|-------------|
| **ADMIN** | Dueño — acceso completo a todo el sistema |
| **VENDEDOR** | Acceso a POS, consulta de inventario, reportes básicos propios |

### Matriz de Permisos por Módulo

| Módulo | Acción | ADMIN | VENDEDOR |
|--------|--------|-------|----------|
| **Ventas** | Crear venta (POS) | ✅ | ✅ |
| | Anular venta | ✅ | ❌ |
| | Ver ventas de todos | ✅ | ❌ (solo propias) |
| **Inventario** | Ver productos | ✅ | ✅ |
| | Crear/Editar productos | ✅ | ❌ |
| | Ajustar stock | ✅ | ❌ |
| | Ver movimientos | ✅ | ✅ (solo lectura) |
| **Clientes** | Ver clientes | ✅ | ✅ |
| | Crear/Editar clientes | ✅ | ✅ |
| | Eliminar clientes | ✅ | ❌ |
| **Finanzas** | Ver caja | ✅ | ❌ |
| | Apertura/Cierre de caja | ✅ | ✅ (propia) |
| | Registrar gastos | ✅ | ❌ |
| **Reportes** | Ver reportes generales | ✅ | ❌ |
| | Ver mis ventas | ✅ | ✅ |
| | Exportar reportes | ✅ | ❌ |
| **Usuarios** | Ver usuarios | ✅ | ❌ |
| | Crear/Editar/Eliminar | ✅ | ❌ |
| **Configuración** | Ver configuración | ✅ | ❌ |
| | Editar permisos/roles | ✅ | ❌ |
| | Editar parámetros | ✅ | ❌ |

> **Nota:** Los permisos se almacenan en la tabla `Permiso` y se asignan a roles vía `RolPermiso`. El sistema permite crear roles personalizados en el futuro.

---

## 🧭 Rutas del Frontend

### Dashboard Layout (protegido con Sidebar)

```
/dashboard                    → Redirige a /dashboard/ventas
├── /ventas                   → POS (Punto de Venta)
│   ├── /ventas/nueva         → Nueva venta (interfaz POS principal)
│   ├── /ventas/historial     → Historial de ventas (con filtros)
│   └── /ventas/[id]          → Detalle de venta / ticket
├── /inventario               → Listado de productos (tabla + búsqueda)
│   ├── /inventario/nuevo     → Registrar nuevo producto
│   ├── /inventario/[id]      → Editar producto
│   ├── /inventario/movimientos → Historial de movimientos
│   └── /inventario/categorias → Gestión de categorías
├── /clientes                 → Listado de clientes
│   ├── /clientes/nuevo       → Nuevo cliente
│   └── /clientes/[id]        → Editar / historial del cliente
├── /finanzas                 → Resumen financiero
│   ├── /finanzas/caja        → Gestión de caja (apertura/cierre)
│   ├── /finanzas/gastos      → Registro de gastos
│   └── /finanzas/resumen     → Estado de resultados
├── /reportes                 → Centro de reportes
│   ├── /reportes/ventas      → Reporte de ventas (por período, vendedor)
│   ├── /reportes/inventario  → Productos más vendidos, stock bajo
│   ├── /reportes/financiero  → Ganancias, pérdidas
│   └── /reportes/exportar    → Exportar a PDF/Excel
├── /usuarios                 → Gestión de usuarios (solo ADMIN)
│   ├── /usuarios/nuevo       → Crear usuario
│   └── /usuarios/[id]        → Editar usuario / permisos
└── /configuracion            → Configuración del sistema (solo ADMIN)
    ├── /configuracion/general → Nombre del negocio, moneda, impuestos
    ├── /configuracion/roles   → Gestión de roles y permisos
    └── /configuracion/respaldo → Respaldo de base de datos
```

---

## 🧩 Componentes Clave por Módulo

### 1. Módulo Ventas (POS) — El corazón del sistema

```
<POSLayout>
  ├── <ProductSearch>        → Búsqueda rápida por código/nombre
  ├── <ProductGrid>          → Grid de productos con categorías
  ├── <CartPanel>            → Panel lateral del carrito
  │   ├── <CartItem>         → Item individual (cantidad, precio, subtotal)
  │   ├── <CartSummary>      → Total, descuento
  │   └── <PaymentModal>     → Modal de cobro (método, vuelto)
  ├── <TicketPreview>        → Vista previa del ticket
  └── <SaleHistory>          → Historial de ventas (tabla)
      └── <SaleRow>          → Fila con expandible para detalles
```

**Flujo POS:**
1. Seleccionar productos (búsqueda + grid) → se agregan al carrito
2. Ajustar cantidades en el carrito
3. (Opcional) Seleccionar cliente
4. Seleccionar método de pago → calcular vuelto
5. Confirmar venta → descuenta stock → genera ticket
6. Imprimir ticket (o ver en pantalla)

### 2. Módulo Inventario

```
<InventoryLayout>
  ├── <ProductTable>         → Tabla con columnas: código, nombre, stock, precio
  │   └── <StockBadge>       → Indicador de stock bajo (rojo/amarillo/verde)
  ├── <ProductForm>          → Formulario crear/editar producto
  ├── <CategoryManager>      → CRUD de categorías
  ├── <MovementHistory>      → Historial de movimientos con filtros
  └── <StockAlertBar>        → Barra de alertas de stock mínimo
```

### 3. Módulo Finanzas

```
<FinanceLayout>
  ├── <CashRegister>         → Panel de caja (apertura/cierre)
  │   ├── <OpenCloseForm>    → Formulario de apertura/cierre
  │   └── <CashMovements>    → Movimientos de la caja
  ├── <ExpenseManager>       → Gestión de gastos
  │   ├── <ExpenseForm>      → Registrar gasto
  │   └── <ExpenseList>      → Lista de gastos
  └── <FinancialSummary>     → Resumen: ingresos, egresos, saldo
      └── <SummaryCards>     → Cards con KPI
```

### 4. Módulo Reportes

```
<ReportsLayout>
  ├── <ReportFilters>        → Filtros: fecha, vendedor, categoría
  ├── <SalesChart>           → Gráfico de ventas (líneas/barras)
  ├── <TopProductsTable>     → Productos más vendidos
  ├── <SellerPerformance>    → Rendimiento por vendedor
  ├── <ProfitLossReport>     → Estado de ganancias/pérdidas
  └── <ExportButton>         → Exportar a PDF, Excel, CSV
```

### 5. Módulo Usuarios

```
<UsersLayout>
  ├── <UsersTable>           → Lista de usuarios con rol y estado
  └── <UserForm>             → Crear/editar usuario (admin asigna rol)
```

### 6. Módulo Configuración

```
<ConfigLayout>
  ├── <GeneralSettings>      → Nombre del negocio, RUC, moneda, logo
  ├── <RoleManager>          → Crear/editar roles
  │   └── <PermissionCheckboxList> → Checkbox grid de permisos
  └── <BackupManager>        → Respaldo y restauración de BD
```

---

## 📡 API Routes

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/session` | Obtener sesión actual |

### Ventas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/ventas` | Listar ventas (filtros: fecha, vendedor) |
| GET | `/api/ventas/[id]` | Detalle de venta |
| POST | `/api/ventas` | Crear nueva venta (POS) |
| PUT | `/api/ventas/[id]/anular` | Anular venta (solo admin) |

### Productos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/productos` | Listar productos (búsqueda, filtro categoría) |
| GET | `/api/productos/[id]` | Detalle producto |
| GET | `/api/productos/buscar?q=` | Búsqueda rápida (código/nombre) |
| POST | `/api/productos` | Crear producto |
| PUT | `/api/productos/[id]` | Actualizar producto |
| PATCH | `/api/productos/[id]/stock` | Ajustar stock |

### Categorías
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/categorias` | Listar categorías |
| POST | `/api/categorias` | Crear categoría |
| PUT | `/api/categorias/[id]` | Actualizar categoría |
| DELETE | `/api/categorias/[id]` | Eliminar categoría |

### Clientes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/clientes` | Listar clientes (búsqueda) |
| GET | `/api/clientes/[id]` | Detalle + historial de compras |
| POST | `/api/clientes` | Crear cliente |
| PUT | `/api/clientes/[id]` | Actualizar cliente |

### Finanzas / Caja
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/finanzas/resumen` | Resumen financiero (período) |
| GET | `/api/finanzas/caja` | Estado de cajas |
| POST | `/api/finanzas/caja/apertura` | Apertura de caja |
| POST | `/api/finanzas/caja/cierre` | Cierre de caja |
| GET | `/api/finanzas/gastos` | Listar gastos |
| POST | `/api/finanzas/gastos` | Registrar gasto |

### Reportes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/reportes/ventas?from=&to=&userId=` | Reporte de ventas |
| GET | `/api/reportes/top-productos` | Top productos más vendidos |
| GET | `/api/reportes/rendimiento-vendedores` | Ventas por vendedor |
| GET | `/api/reportes/financiero` | Estado financiero |

### Usuarios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/usuarios` | Listar usuarios (solo admin) |
| POST | `/api/usuarios` | Crear usuario (admin) |
| PUT | `/api/usuarios/[id]` | Actualizar usuario/rol |
| PATCH | `/api/usuarios/[id]/activar` | Activar/desactivar |

### Configuración
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/configuracion` | Obtener toda la configuración |
| GET | `/api/configuracion/[clave]` | Obtener un valor |
| PUT | `/api/configuracion/[clave]` | Actualizar un valor |
| POST | `/api/configuracion/respaldo` | Generar respaldo BD |

---

## 🔒 Middleware (Protección por Rol)

El `middleware.ts` de Next.js interceptará las rutas del dashboard y verificará:

1. **Autenticación:** Si no hay sesión → redirige a `/login`
2. **Autorización por ruta:** Basado en el rol del usuario, redirige con un `403` si no tiene permiso para acceder al módulo
3. **API Routes:** Verificación de permisos via `getServerSession()` + helper `authorize()`

```typescript
// Ejemplo del helper de autorización
export function authorize(user: Usuario, permiso: string): boolean {
  // ADMIN tiene todos los permisos
  if (user.rol === 'ADMIN') return true;
  // VENDEDOR tiene permisos específicos
  return user.permisos.includes(permiso);
}
```

---

## 📊 Dashboard Principal

Al iniciar sesión, el dashboard mostrará un resumen con cards de KPIs:

```
┌─────────────────────────────────────────────────────────┐
│  🏪 MiniMarket "Nombre"                     [Perfil ▼] │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ Ventas   │ │ Tickets  │ │ Stock    │ │ Ganancias│   │
│ │ Hoy      │ │ Hoy      │ │ Bajo     │ │ del Día  │   │
│ │ S/ 1,250 │ │ 34       │ │ 5 prods  │ │ S/ 350   │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐    │
│ │ 📈 Ventas Últimos 7 Días                       │    │
│ │  [Gráfico de barras/líneas]                     │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ ┌──────────────────────┐  ┌──────────────────────┐    │
│ │ 🥇 Top Productos    │  │ 👤 Vendedores del    │    │
│ │    más vendidos hoy  │  │    Día               │    │
│ │ 1. Pan (34)          │  │ 1. María  S/ 2,300   │    │
│ │ 2. Leche (22)        │  │ 2. Juan   S/ 1,800   │    │
│ │ 3. Huevos (18)       │  │ 3. Ana    S/ 1,200   │    │
│ └──────────────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Plan de Implementación (Fases)

### Fase 1 — Fundación (Semana 1)
- [x] Planeación del sistema ✅
- [ ] Inicializar proyecto Next.js + Tailwind + TypeScript
- [ ] Configurar Prisma + PostgreSQL
- [ ] Crear schema de base de datos + migración inicial + seed
- [ ] Configurar NextAuth.js (login con credenciales)
- [ ] Crear layout del dashboard (sidebar + navbar)
- [ ] Implementar middleware de autenticación
- [ ] Módulo Configuración: parámetros generales del sistema

### Fase 2 — Núcleo del Negocio (Semana 2)
- [ ] Módulo Productos: CRUD + búsqueda + categorías
- [ ] Módulo Clientes: CRUD + búsqueda
- [ ] Módulo Inventario: movimientos, alertas de stock bajo
- [ ] Módulo Ventas: POS completo (carrito, cobro, ticket)

### Fase 3 — Gestión y Control (Semana 3)
- [ ] Módulo Finanzas: caja (apertura/cierre), gastos, resumen
- [ ] Módulo Usuarios: CRUD, roles, permisos
- [ ] Módulo de Configuración: gestor de roles y permisos dinámico

### Fase 4 — Inteligencia del Negocio (Semana 4)
- [ ] Módulo Reportes: ventas, productos, vendedores
- [ ] Dashboard con gráficos (Recharts/Tremor)
- [ ] Exportación de reportes (PDF / Excel)
- [ ] Pruebas integrales y pulido de UI

---

## ⚙️ Configuración Inicial del Sistema (Seed Data)

```json
{
  "nombre_negocio": "Mi MiniMarket",
  "moneda": "PEN",
  "simbolo_moneda": "S/",
  "impuesto_nombre": "IGV",
  "impuesto_porcentaje": 18,
  "aplicar_impuesto": true,
  "ruc": "12345678901",
  "direccion": "Av. Principal 123",
  "telefono": "999-888-777",
  "stock_minimo_default": 5,
  "vista_venta_default": "grid",
  "imprimir_ticket": true
}
```

---

## 🧪 Estrategia de Pruebas

| Tipo | Herramienta | Qué probar |
|------|-------------|------------|
| Unitarias | Vitest | Hooks, helpers, validaciones |
| Integración | Vitest + Supertest | API Routes (CRUD productos, ventas) |
| Componentes | Storybook | Visual de componentes clave (POS, tablas) |
| E2E | Playwright | Flujo completo de venta, login, reportes |

---

## 📝 Notas Técnicas Adicionales

1. **Escalabilidad:** La arquitectura con Prisma + PostgreSQL permite migrar fácilmente a una BD más grande si el negocio crece.
2. **Responsive:** Tailwind garantiza que el POS funcione en tablets (útil para vendedores en piso).
3. **Sin dependencia de servicios externos:** Todo corre local o en un VPS propio.
4. **Respaldo automático:** Script programable para backup de PostgreSQL vía `pg_dump`.
5. **Auditoría:** Cada venta y movimiento queda registrado con usuario y timestamp.
