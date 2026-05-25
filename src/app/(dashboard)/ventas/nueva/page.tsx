import { auth } from "@/lib/auth";
import POSPanel from "@/components/ventas/POSPanel";

export default async function NuevaVentaPage() {
  const session = await auth();
  const user = session?.user as any;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Punto de Venta</h2>
        <p className="text-gray-500 mt-1">
          {user?.nombre} · {user?.rol === "ADMIN" ? "Dueño" : "Vendedor"}
        </p>
      </div>
      <POSPanel />
    </div>
  );
}
