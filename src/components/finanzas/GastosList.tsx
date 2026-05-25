"use client";

import { useState, useEffect } from "react";
import { PiggyBank, Plus, Calendar, Search, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

type Gasto = {
  id: string;
  concepto: string;
  monto: number;
  categoria: string;
  descripcion: string | null;
  createdAt: string;
};

const CATEGORIAS_GASTOS = [
  "Servicios",
  "Alquiler",
  "Proveedores",
  "Mantenimiento",
  "Sueldos",
  "Publicidad",
  "Impuestos",
  "Otros",
];

export default function GastosList() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMonto, setTotalMonto] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [desde, setDesde] = useState(new Date().toISOString().split("T")[0]);
  const [hasta, setHasta] = useState(new Date().toISOString().split("T")[0]);

  // Form state
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_GASTOS[0]);
  const [descripcion, setDescripcion] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchGastos();
  }, []);

  const fetchGastos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      const res = await fetch(`/api/gastos?${params}`);
      const data = await res.json();
      setGastos(data.gastos || []);
      setTotalMonto(data.totalMonto || 0);
    } catch {
      toast.error("Error al cargar gastos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto || !monto) {
      toast.error("Complete los campos obligatorios");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concepto,
          monto: parseFloat(monto),
          categoria,
          descripcion: descripcion || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success("Gasto registrado exitosamente");
      setShowModal(false);
      setConcepto("");
      setMonto("");
      setDescripcion("");
      fetchGastos();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredGastos = gastos.filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.concepto.toLowerCase().includes(q) ||
      g.categoria.toLowerCase().includes(q) ||
      (g.descripcion || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Registro de Gastos</h2>
          <p className="text-gray-500 mt-1">Controla y registra los gastos del negocio</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-200"
        >
          <Plus className="w-4 h-4" />
          Nuevo Gasto
        </button>
      </div>

      {/* Total acumulado */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3 mb-1">
          <PiggyBank className="w-6 h-6 text-red-100" />
          <p className="text-sm text-red-100 font-medium">Total Gastos (período)</p>
        </div>
        <p className="text-3xl font-bold">{formatCurrency(totalMonto)}</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none"
          />
          <span className="text-gray-400">a</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none"
          />
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar gasto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-red-500"
          />
        </div>
        <button
          onClick={fetchGastos}
          className="px-4 py-2 rounded-lg bg-gray-100 text-sm text-gray-600 hover:bg-gray-200"
        >
          Filtrar
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-red-600" />
          </div>
        ) : filteredGastos.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <PiggyBank className="w-12 h-12 mb-3" />
            <p>No hay gastos registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredGastos.map((gasto) => (
              <div key={gasto.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <PiggyBank className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{gasto.concepto}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                        {gasto.categoria}
                      </span>
                      {formatDate(gasto.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600">-{formatCurrency(gasto.monto)}</p>
                  {gasto.descripcion && (
                    <p className="text-xs text-gray-400">{gasto.descripcion}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nuevo Gasto */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold">Registrar Nuevo Gasto</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
                <input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-red-500"
                  placeholder="Ej: Pago de luz"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 text-lg font-medium outline-none focus:border-red-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-red-500"
                >
                  {CATEGORIAS_GASTOS.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-red-500"
                  placeholder="Detalles adicionales..."
                />
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:from-red-700 hover:to-red-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Registrar Gasto
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
