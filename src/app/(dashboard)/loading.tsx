import { Loader2, Store } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-xl shadow-blue-200/50">
          <Store className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-500 font-medium">Cargando...</p>
      </div>
    </div>
  );
}
