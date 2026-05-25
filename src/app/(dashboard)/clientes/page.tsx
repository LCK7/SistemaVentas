import ClientesList from "@/components/clientes/ClientesList";

export default function ClientesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
        <p className="text-gray-500 mt-1">Gestión de clientes del negocio</p>
      </div>
      <ClientesList />
    </div>
  );
}
