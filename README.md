# MiniMarket — Sistema de Ventas e Inventario

Sistema web full-stack para la gestión completa de un minimarket: punto de venta (POS), control de inventario, caja por día, finanzas, clientes, reportes y configuración.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| **Framework** | Next.js 16, React 19, TypeScript |
| **Estilos** | Tailwind CSS v4, Lucide React (iconos) |
| **Base de datos** | PostgreSQL 15, Prisma 6 (ORM) |
| **Autenticación** | NextAuth.js v5 (credenciales, JWT) |
| **Reportes** | jsPDF (PDF), ExcelJS (XLSX) |
| **Notificaciones** | Sonner (toasts) |
| **Contenedores** | Docker + Docker Compose |
| **Lenguaje** | Español, moneda PEN (S/) |

---

## Módulos

### Dashboard (`/dashboard`)
Visión general del día: ventas, tickets, productos activos, alertas de stock bajo, últimas ventas y acceso rápido a todos los módulos.

### Punto de Venta (`/ventas/nueva`)
- Buscador de productos por nombre o código de barras (lector compatible)
- Filtro por categoría
- Indicador visual de stock en cada producto (rojo = agotado, naranja = bajo, gris = normal)
- Carrito de compras con control de cantidades
- Selección opcional de cliente con autocompletado
- Pago con múltiples métodos: Efectivo, Tarjeta, Transferencia, Otro
- Cálculo automático de vuelto
- Impresión de boleta/ ticket en formato térmico 80mm (PDF)
- Bloqueo automático si la caja del día está cerrada

### Historial de Ventas (`/ventas/historial`)
- Tabla paginada con filtros por fecha, vendedor
- Modal de detalle por venta
- Exportación a PDF y Excel

### Inventario (`/inventario`)
- **Productos**: CRUD completo, toggle activo/inactivo, edición en línea de código
- **Reposición**: buscador con autocompletado, botones rápidos (+5, +10, +25, +50), visualización de últimos movimientos, alerta de stock faltante
- **Movimientos**: historial completo de entradas y salidas con filtros y paginación

### Clientes (`/clientes`)
- Registro y edición de clientes (nombre, teléfono, email, dirección, NIT)
- Búsqueda por cualquier campo
- Vista de tarjetas con número de compras por cliente

### Finanzas (`/finanzas`)
- **Panel Financiero**: KPIs (saldo caja, ventas, salidas, balance), gráfico de ventas últimos 7 días, gastos por categoría, métodos de pago, resumen del mes
- **Gestión de Caja**: manejo del ciclo de vida completo de la caja diaria
  - Sin apertura → botón "Abrir Caja" (ingresar monto inicial)
  - Abierta → ver saldo, apertura, ventas, ingresos extras y egresos. Acciones: Ingreso Extra, Egreso, Cerrar Caja
  - Cerrada → vista de solo lectura sin botones de acción, banner informativo, exportación PDF/Excel
  - Modal de confirmación antes de cerrar
  - Comparativa de saldo esperado vs real al cerrar
  - Modal de recomendaciones post-cierre (productos por reponer, resumen de ventas del día)
- **Gastos**: registro de gastos por categoría (Servicios, Alquiler, Proveedores, etc.), los gastos descuentan automáticamente de la caja

### Reportes (`/reportes`)
- **Ventas**: filtros por fecha y vendedor, KPIs, desglose diario, ranking de vendedores, top 10 productos. Exportación PDF/Excel
- **Inventario**: reporte de movimientos con KPIs (entradas, salidas, diferencia neta)

### Usuarios (`/usuarios` — solo admin)
- CRUD de usuarios (Dueño/Vendedor)
- Toggle activo/inactivo

### Configuración (`/configuracion` — solo admin)
- Datos del negocio (nombre, RUC, dirección, teléfono)
- Gestión de categorías de productos
- Información del sistema

---

## Funcionamiento Básico

### Autenticación y roles
Dos roles: **ADMIN** (Dueño, acceso completo) y **VENDEDOR** (acceso a POS, inventario básico, clientes, reportes y su propia caja). Las rutas de administración (`/usuarios`, `/configuracion`) están protegidas por middleware.

### Caja por día
Cada jornada comienza con una **apertura de caja** (registrando el monto inicial). Durante el día se registran ingresos extras y egresos. Las ventas desde el POS actualizan automáticamente el saldo. Al finalizar, se **cierra la caja** ingresando el dinero real; si hay diferencia se muestra. Una vez cerrada, **no se permiten más operaciones** (ventas, ingresos, egresos).

### Inventario y movimientos
Cada venta descuenta stock automáticamente y crea un movimiento de inventario (SALIDA). La reposición de stock crea movimientos de ENTRADA. El sistema alerta cuando un producto está por debajo de su stock mínimo.

### Finanzas
El panel financiero agrega datos de ventas, gastos (tabla `Gasto`) y egresos de caja (movimientos tipo EGRESO). El balance se calcula como: `ventas - gastos - egresos`.

### Seguridad
- Contraseñas hasheadas con bcryptjs
- Sesiones JWT
- Middleware protege todas las rutas excepto `/login`
- API valida permisos por rol
- Las ventas verifican stock disponible antes de confirmar

---

## Cómo Ejecutar

### Requisitos
- Node.js 20+
- PostgreSQL 15+ (o Docker)
- npm

### Desarrollo local

```bash
# 1. Clonar e instalar dependencias
npm install

# 2. Configurar .env
#    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sistema_ventas?schema=public"
#    AUTH_SECRET="una-clave-segura"

# 3. Inicializar BD y sembrar datos
npx prisma db push
npm run db:seed

# 4. Iniciar servidor de desarrollo
npm run dev
#    Abrir http://localhost:3000
```

### Con Docker Compose

```bash
docker compose up -d
# App en http://localhost:3000
# Sembrar datos: docker exec sistema_ventas_app npx prisma db seed
```

### Credenciales de prueba
- **Admin**: `admin@minimarket.com` / `admin123`
- **Vendedor**: `vendedor@minimarket.com` / `vendedor123`

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/login       # Página de inicio de sesión
│   ├── (dashboard)/       # Páginas protegidas
│   │   ├── dashboard/     # Inicio con KPIs
│   │   ├── ventas/        # POS e historial
│   │   ├── inventario/    # Productos, reposición, movimientos
│   │   ├── clientes/      # Gestión de clientes
│   │   ├── finanzas/      # Caja, gastos, panel financiero
│   │   ├── reportes/      # Reportes de ventas e inventario
│   │   ├── usuarios/      # Administración de usuarios
│   │   └── configuracion/ # Configuración del negocio
│   └── api/               # API REST (~20 endpoints)
├── components/            # Componentes React (layout, POS, tablas, etc.)
├── lib/                   # auth.ts, prisma.ts, utils.ts
├── types/                 # Tipos compartidos TypeScript
└── middleware.ts          # Protección de rutas + RBAC

prisma/
├── schema.prisma          # Modelo de datos (10 tablas, 5 enums)
└── seed.ts                # Datos de prueba
```

---

## API — Endpoints Principales

| Ruta | Método | Descripción |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | Autenticación (NextAuth) |
| `/api/productos` | GET/POST | Listar / crear productos |
| `/api/ventas` | GET/POST | Listar / crear ventas |
| `/api/ventas/boleta` | GET | Ticket PDF |
| `/api/ventas/reporte` | GET | Reporte de ventas PDF/Excel |
| `/api/caja` | GET/POST | Estado / movimientos de caja |
| `/api/caja/reporte` | GET | Reporte de caja PDF/Excel |
| `/api/finanzas/resumen` | GET | Panel financiero completo |
| `/api/gastos` | GET/POST | Listar / crear gastos |
| `/api/inventario/reponer` | POST | Reponer stock |
| `/api/inventario/movimientos` | GET | Historial de movimientos |
| `/api/configuracion` | GET/PUT | Configuración del negocio |
