"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-xl shadow-red-200/50">
          <AlertTriangle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          Error de autenticación
        </h2>
        <p className="text-sm text-gray-500">
          Ocurrió un error inesperado. Por favor intenta de nuevo.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200/50"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    </div>
  );
}
