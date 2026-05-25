import UserTable from "@/components/users/UserTable";

export default function UsuariosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Usuarios</h2>
        <p className="text-gray-500 mt-1">Gestión de usuarios del sistema</p>
      </div>
      <UserTable />
    </div>
  );
}
