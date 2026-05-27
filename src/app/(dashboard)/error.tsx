"use client";

import { AlertTriangle, Store, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-xl shadow-red-200/50">
          <AlertTriangle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          Algo salió mal
        </h2>
        <p className="text-sm text-gray-500">
          Ocurrió un error al cargar esta sección. Por favor intenta de nuevo.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200/50"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <Store className="w-4 h-4" />
            Ir al inicio
          </a>
        </div>
        {process.env.NODE_ENV === "development" && (
          <p className="text-xs text-gray-400 mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 max-w-full overflow-auto">
            {error.message}
          </p>
        )}
      </div>
    </div>
  );
}
