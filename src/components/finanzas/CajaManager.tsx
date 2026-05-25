"use client";

import { useState, useEffect } from "react";
import { Wallet, RefreshCw, History, DollarSign, Loader2, ArrowUpRight, ArrowDownRight, User, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

type Movimiento = {
  id: string;
  tipo: string;
  monto: number;
  descripcion: string | null;
  createdAt: string;
  usuario: { nombre: string };
};

type CajaData = {
  id: string;
  nombre: string;
  saldoActual: number;
  movimientos: Movimiento[];
};

const tipoLabels: Record<string, string> = {
  APERTURA: "Apertura",
  CIERRE: "Cierre",
  INGRESO: "Ingreso",
  EGRESO: "Egreso",
};

const tipoColors: Record<string, string> = {
  APERTURA: "text-green-600 bg-green-50",
  CIERRE: "text-red-600 bg-red-50",
  INGRESO: "text-green-600 bg-green-50",
  EGRESO: "text-red-600 bg-red-50",
};

const tipoIcons: Record<string, typeof ArrowUpRight> = {
  APERTURA: ArrowUpRight,
  CIERRE: ArrowDownRight,
  INGRESO: ArrowUpRight,
  EGRESO: ArrowDownRight,
};

export default function CajaManager() {
  const [caja, setCaja] = useState<CajaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [movimientoTipo, setMovimientoTipo] = useState("INGRESO");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCaja();
  }, []);

  const fetchCaja = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/caja");
      if (res.ok) {
        const data = await res.json();
        setCaja(data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || parseFloat(monto) <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/caja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: movimientoTipo,
          monto: parseFloat(monto),
          descripcion,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al procesar");
      }

      toast.success("Movimiento registrado exitosamente");
      setShowModal(false);
      setMonto("");
      setDescripcion("");
      fetchCaja();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Caja</h2>
          <p className="text-gray-500 mt-1">Control de apertura, cierre y movimientos</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchCaja}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200"
          >
            <DollarSign className="w-4 h-4" />
            Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Saldo Actual */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-200">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 font-medium">Saldo Actual</p>
            <p className="text-4xl font-bold text-gray-900 mt-1">
              {caja ? formatCurrency(caja.saldoActual) : "S/ 0.00"}
            </p>
          </div>
          {caja && (
            <div className="text-right">
              <p className="text-sm text-gray-500">{caja.nombre}</p>
            </div>
          )}
        </div>
      </div>

      {/* Movimientos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Últimos Movimientos</h3>
        </div>

        {!caja || caja.movimientos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No hay movimientos registrados</p>
        ) : (
          <div className="space-y-2">
            {caja.movimientos.map((mov) => {
              const Icon = tipoIcons[mov.tipo] || ArrowUpRight;
              return (
                <div
                  key={mov.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tipoColors[mov.tipo] || "bg-gray-100"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tipoLabels[mov.tipo] || mov.tipo}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        {mov.descripcion && <span>{mov.descripcion} · </span>}
                        <User className="w-3 h-3" />
                        {mov.usuario.nombre}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      ["APERTURA", "INGRESO"].includes(mov.tipo) ? "text-green-600" : "text-red-600"
                    }`}>
                      {["APERTURA", "INGRESO"].includes(mov.tipo) ? "+" : "-"}
                      {formatCurrency(mov.monto)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(mov.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Nuevo Movimiento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold">Nuevo Movimiento de Caja</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "INGRESO", label: "Ingreso", icon: ArrowUpRight },
                    { value: "EGRESO", label: "Egreso", icon: ArrowDownRight },
                    { value: "APERTURA", label: "Apertura", icon: ArrowUpRight },
                    { value: "CIERRE", label: "Cierre", icon: ArrowDownRight },
                  ].map((tipo) => {
                    const Icon = tipo.icon;
                    return (
                      <button
                        key={tipo.value}
                        type="button"
                        onClick={() => setMovimientoTipo(tipo.value)}
                        className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          movimientoTipo === tipo.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {tipo.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 text-lg font-medium outline-none focus:border-blue-500"
                    placeholder="0.00"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-blue-500"
                  placeholder="Motivo del movimiento (opcional)"
                />
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5" />
                    Registrar Movimiento
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
