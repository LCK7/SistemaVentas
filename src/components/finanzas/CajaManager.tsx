"use client";

import { useState, useEffect } from "react";
import {
  Wallet, RefreshCw, History, DollarSign, Loader2, ArrowUpRight, ArrowDownRight,
  User, LogIn, LogOut, Plus, Minus, CheckCircle2, XCircle, Clock, Receipt,
  Download, FileText, Package, ShoppingCart, AlertTriangle, Lightbulb,
} from "lucide-react";
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
  ventasHoyTotal: number;
  aperturaHoy?: { monto: number; usuario: { nombre: string } } | null;
  cierreHoy?: boolean;
};

const tipoLabels: Record<string, string> = {
  APERTURA: "Apertura de Caja",
  CIERRE: "Cierre de Caja",
  INGRESO: "Ingreso Extra",
  EGRESO: "Egreso",
};

export default function CajaManager() {
  const [caja, setCaja] = useState<CajaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Modal INGRESO/EGRESO
  const [showMovModal, setShowMovModal] = useState(false);
  const [movTipo, setMovTipo] = useState<"INGRESO" | "EGRESO">("INGRESO");
  const [movMonto, setMovMonto] = useState("");
  const [movDesc, setMovDesc] = useState("");

  // Modal APERTURA
  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [aperturaMonto, setAperturaMonto] = useState("");

  // Confirmación antes de abrir modal de cierre
  const [showCierreConfirmacion, setShowCierreConfirmacion] = useState(false);

  // Modal CIERRE
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [cierreMonto, setCierreMonto] = useState("");

  // Modal recomendaciones post-cierre
  const [showRecomendaciones, setShowRecomendaciones] = useState(false);
  const [recomendaciones, setRecomendaciones] = useState<{
    productosBajoStock: { nombre: string; codigo: string; stock: number; stockMinimo: number }[];
    resumenVentas: { total: number; tickets: number };
  } | null>(null);

  useEffect(() => {
    fetchCaja();
  }, []);

  const fetchCaja = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/caja");
      if (res.ok) {
        const data = await res.json();
        const movs = data.movimientos || [];
        const aperturaHoy = movs.find((m: Movimiento) => m.tipo === "APERTURA");
        const cierreHoy = !!movs.find((m: Movimiento) => m.tipo === "CIERRE");
        setCaja({ ...data, aperturaHoy, cierreHoy });
      } else {
        setCaja(null);
      }
    } catch {
      setCaja(null);
    } finally {
      setLoading(false);
    }
  };

  const abrirCaja = async () => {
    if (!aperturaMonto || parseFloat(aperturaMonto) <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch("/api/caja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "APERTURA", monto: parseFloat(aperturaMonto), descripcion: "Apertura del día" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error");
      }
      toast.success("Caja abierta exitosamente");
      setShowAperturaModal(false);
      setAperturaMonto("");
      fetchCaja();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const cerrarCaja = async () => {
    if (!cierreMonto || parseFloat(cierreMonto) < 0) {
      toast.error("Ingrese el saldo final");
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch("/api/caja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "CIERRE", monto: parseFloat(cierreMonto), descripcion: "Cierre del día" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error");
      }
      toast.success("Caja cerrada exitosamente");
      setShowCierreModal(false);
      setCierreMonto("");
      // Marcar como cerrada de inmediato (sin esperar fetchCaja)
      setCaja((prev) => prev ? { ...prev, cierreHoy: true } : prev);
      fetchCaja();

      // Obtener recomendaciones para el día siguiente
      try {
        const [prodRes, ventasRes] = await Promise.all([
          fetch("/api/productos?limit=500"),
          fetch(`/api/ventas/resumen-reporte?desde=${new Date().toISOString().split("T")[0]}&hasta=${new Date().toISOString().split("T")[0]}`),
        ]);
        const prodData = await prodRes.json();
        const ventasData = await ventasRes.json();
        const productos = (prodData.productos || []).filter(
          (p: any) => p.activo !== false && p.stock <= (p.stockMinimo || 0)
        );
        setRecomendaciones({
          productosBajoStock: productos.map((p: any) => ({
            nombre: p.nombre,
            codigo: p.codigo,
            stock: p.stock,
            stockMinimo: p.stockMinimo || 0,
          })),
          resumenVentas: {
            total: ventasData.resumen?.totalVentas || 0,
            tickets: ventasData.resumen?.totalTickets || 0,
          },
        });
        setShowRecomendaciones(true);
      } catch {
        // Si falla, no mostrar recomendaciones
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const registrarMovimiento = async () => {
    if (!movMonto || parseFloat(movMonto) <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch("/api/caja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: movTipo, monto: parseFloat(movMonto), descripcion: movDesc }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error");
      }
      toast.success(movTipo === "INGRESO" ? "Ingreso registrado" : "Egreso registrado");
      setShowMovModal(false);
      setMovMonto("");
      setMovDesc("");
      fetchCaja();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const movs = caja?.movimientos || [];
  const hasAperturaHoy = !!movs.find((m) => m.tipo === "APERTURA");
  const hasCierreHoy = !!(movs.find((m) => m.tipo === "CIERRE") || caja?.cierreHoy);
  const totalIngresosExtras = movs
    .filter((m) => m.tipo === "INGRESO")
    .reduce((s, m) => s + Number(m.monto), 0);
  const totalEgresos = movs
    .filter((m) => m.tipo === "EGRESO")
    .reduce((s, m) => s + Number(m.monto), 0);
  const diffMovs = caja ? Number(caja.saldoActual) - Number(caja?.aperturaHoy?.monto || 0) - Number(caja?.ventasHoyTotal || 0) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ESTADO: NO HAY APERTURA HOY
  if (!hasAperturaHoy) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Caja</h2>
          <p className="text-gray-500 mt-1">La caja aún no ha sido abierta hoy</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-200">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Caja Cerrada</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Para comenzar las operaciones del día, abre la caja registrando el monto inicial con el que dispones.
          </p>
          <button
            onClick={() => setShowAperturaModal(true)}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-semibold hover:from-green-600 hover:to-green-700 shadow-xl shadow-green-200 transition-all"
          >
            <LogIn className="w-6 h-6" />
            Abrir Caja
          </button>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-1"><Receipt className="w-4 h-4" /> Las ventas se suman solas</span>
            <span className="flex items-center gap-1"><Plus className="w-4 h-4" /> Ingresos extras los registras tú</span>
            <span className="flex items-center gap-1"><Minus className="w-4 h-4" /> Egresos los registras tú</span>
          </div>
        </div>

        {/* Modal Apertura */}
        {showAperturaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Abrir Caja</h3>
              <p className="text-sm text-gray-500 mb-6">¿Con cuánto dinero inicias el día?</p>
              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl font-bold">S/</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={aperturaMonto}
                  onChange={(e) => setAperturaMonto(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 text-2xl font-bold text-center outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAperturaModal(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={abrirCaja} disabled={processing} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Abrir Caja
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ESTADO: CAJA CERRADA (con cierre confirmado hoy) — solo lectura
  if (hasCierreHoy) {
    return (
      <div className="space-y-6 opacity-90">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-400">Gestión de Caja</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                <Clock className="w-3 h-3" />
                Caja Cerrada — Finalizada
              </span>
              <span className="text-xs text-gray-400">{caja?.nombre}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="/api/caja/reporte?formato=pdf" target="_blank" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs">
              <FileText className="w-3.5 h-3.5" /> PDF
            </a>
            <a href="/api/caja/reporte?formato=excel" target="_blank" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs">
              <Download className="w-3.5 h-3.5" /> Excel
            </a>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-100 border border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Caja cerrada — operaciones del día finalizadas</p>
            <p className="text-xs text-gray-500">No se pueden registrar más ingresos, egresos ni movimientos. Los datos son solo de consulta.</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-xl shadow-blue-200">
          <p className="text-blue-200 text-sm font-medium">Saldo Final de Caja</p>
          <p className="text-5xl font-bold mt-2">{formatCurrency(caja?.saldoActual || 0)}</p>
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-blue-500/30">
            <div>
              <p className="text-blue-200 text-xs">Apertura</p>
              <p className="text-lg font-semibold">{formatCurrency(Number(caja.aperturaHoy?.monto || 0))}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs">Ventas Hoy</p>
              <p className="text-lg font-semibold">+{formatCurrency(Number(caja.ventasHoyTotal || 0))}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs">Ingresos Extra</p>
              <p className="text-lg font-semibold">+{formatCurrency(totalIngresosExtras)}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs">Egresos</p>
              <p className="text-lg font-semibold text-red-300">-{formatCurrency(totalEgresos)}</p>
            </div>
          </div>
        </div>

        {/* Movimientos (solo lectura) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Movimientos de Hoy</h3>
            </div>
            <span className="text-xs text-gray-400">{caja?.movimientos?.length || 0} registro(s)</span>
          </div>
          {!caja?.movimientos?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay movimientos</p>
          ) : (
            <div className="space-y-1">
              {caja.movimientos.map((mov) => (
                <div key={mov.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${["APERTURA", "INGRESO"].includes(mov.tipo) ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                      {mov.tipo === "APERTURA" ? <LogIn className="w-5 h-5" /> :
                       mov.tipo === "CIERRE" ? <LogOut className="w-5 h-5" /> :
                       mov.tipo === "INGRESO" ? <ArrowUpRight className="w-5 h-5" /> :
                       <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tipoLabels[mov.tipo] || mov.tipo}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        {mov.descripcion && <span>{mov.descripcion} · </span>}
                        <User className="w-3 h-3" />{mov.usuario.nombre}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${["APERTURA", "INGRESO"].includes(mov.tipo) ? "text-green-600" : "text-red-600"}`}>
                      {["APERTURA", "INGRESO"].includes(mov.tipo) ? "+" : "-"}{formatCurrency(mov.monto)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(mov.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal recomendaciones post-cierre */}
        {showRecomendaciones && recomendaciones && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Cierre Completado</h3>
                  <p className="text-sm text-gray-500">
                    Ventas del día: {formatCurrency(recomendaciones.resumenVentas.total)} ({recomendaciones.resumenVentas.tickets} tickets)
                  </p>
                </div>
              </div>

              {recomendaciones.productosBajoStock.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <h4 className="font-semibold text-gray-900 text-sm">Productos por Reponer</h4>
                    <span className="text-xs text-gray-400">({recomendaciones.productosBajoStock.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {recomendaciones.productosBajoStock.slice(0, 15).map((p) => (
                      <div key={p.codigo} className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.nombre}</p>
                          <p className="text-xs text-gray-500 font-mono">{p.codigo}</p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap ml-3">
                          <span className="text-red-600 font-semibold">{p.stock}</span>
                          <span className="text-gray-400"> / {p.stockMinimo} mín</span>
                        </div>
                      </div>
                    ))}
                    {recomendaciones.productosBajoStock.length > 15 && (
                      <p className="text-xs text-gray-400 text-center pt-1">
                        y {recomendaciones.productosBajoStock.length - 15} más...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {recomendaciones.productosBajoStock.length === 0 && (
                <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-100 text-center">
                  <Package className="w-6 h-6 text-green-500 mx-auto mb-1" />
                  <p className="text-sm text-green-700 font-medium">Stock al día</p>
                  <p className="text-xs text-green-600">Todos los productos tienen inventario suficiente</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-600 flex items-start gap-2">
                <ShoppingCart className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p>Revisa el inventario y la sección de reportes para planificar las compras de mañana.</p>
              </div>

              <button onClick={() => setShowRecomendaciones(false)} className="w-full mt-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
                Entendido
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

    return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Caja</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <Clock className="w-3 h-3" />
              Caja Abierta
            </span>
            <span className="text-xs text-gray-400">{caja?.nombre}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/caja/reporte?formato=pdf"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs"
            title="Descargar PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </a>
          <a
            href="/api/caja/reporte?formato=excel"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs"
            title="Descargar Excel"
          >
            <Download className="w-3.5 h-3.5" />
            Excel
          </a>
          <button onClick={fetchCaja} className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50" title="Actualizar">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Saldo principal */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-xl shadow-blue-200">
        <p className="text-blue-200 text-sm font-medium">Saldo Actual en Caja</p>
        <p className="text-5xl font-bold mt-2">{formatCurrency(caja?.saldoActual || 0)}</p>
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-blue-500/30">
          <div>
            <p className="text-blue-200 text-xs">Apertura</p>
            <p className="text-lg font-semibold">{formatCurrency(Number(caja.aperturaHoy?.monto || 0))}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Ventas Hoy</p>
            <p className="text-lg font-semibold">+{formatCurrency(Number(caja.ventasHoyTotal || 0))}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Ingresos Extra</p>
            <p className="text-lg font-semibold">+{formatCurrency(totalIngresosExtras)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Egresos</p>
            <p className="text-lg font-semibold text-red-300">-{formatCurrency(totalEgresos)}</p>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => { setMovTipo("INGRESO"); setMovMonto(""); setMovDesc(""); setShowMovModal(true); }}
          className="flex flex-col items-center gap-2 p-5 rounded-xl bg-white border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
            <ArrowUpRight className="w-6 h-6 text-green-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">Ingreso Extra</span>
          <span className="text-xs text-gray-400">Dinero que entra</span>
        </button>

        <button
          onClick={() => { setMovTipo("EGRESO"); setMovMonto(""); setMovDesc(""); setShowMovModal(true); }}
          className="flex flex-col items-center gap-2 p-5 rounded-xl bg-white border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
            <ArrowDownRight className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">Egreso / Gasto</span>
          <span className="text-xs text-gray-400">Dinero que sale</span>
        </button>

        <button
          onClick={() => { setShowCierreConfirmacion(true); }}
          className="flex flex-col items-center gap-2 p-5 rounded-xl bg-white border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
            <LogOut className="w-6 h-6 text-orange-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">Cerrar Caja</span>
          <span className="text-xs text-gray-400">Finalizar turno</span>
        </button>
      </div>

      {/* Movimientos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Movimientos de Hoy</h3>
          </div>
          <span className="text-xs text-gray-400">{caja?.movimientos?.length || 0} registro(s)</span>
        </div>

        {!caja?.movimientos?.length ? (
          <p className="text-sm text-gray-400 text-center py-8">No hay movimientos hoy</p>
        ) : (
          <div className="space-y-1">
            {caja.movimientos.map((mov) => (
              <div key={mov.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    ["APERTURA", "INGRESO"].includes(mov.tipo) ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  }`}>
                    {mov.tipo === "APERTURA" ? <LogIn className="w-5 h-5" /> :
                     mov.tipo === "CIERRE" ? <LogOut className="w-5 h-5" /> :
                     mov.tipo === "INGRESO" ? <ArrowUpRight className="w-5 h-5" /> :
                     <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tipoLabels[mov.tipo] || mov.tipo}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      {mov.descripcion && <span>{mov.descripcion} · </span>}
                      <User className="w-3 h-3" />{mov.usuario.nombre}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    ["APERTURA", "INGRESO"].includes(mov.tipo) ? "text-green-600" : "text-red-600"
                  }`}>
                    {["APERTURA", "INGRESO"].includes(mov.tipo) ? "+" : "-"}{formatCurrency(mov.monto)}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(mov.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal INGRESO / EGRESO */}
      {showMovModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                movTipo === "INGRESO" ? "bg-green-100" : "bg-red-100"
              }`}>
                {movTipo === "INGRESO"
                  ? <ArrowUpRight className={`w-8 h-8 text-green-600`} />
                  : <ArrowDownRight className={`w-8 h-8 text-red-600`} />
                }
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {movTipo === "INGRESO" ? "Registrar Ingreso" : "Registrar Egreso"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {movTipo === "INGRESO"
                  ? "Dinero que ingresa a la caja (no ventas)"
                  : "Dinero que sale de la caja"}
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-bold">S/</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={movMonto}
                  onChange={(e) => setMovMonto(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 text-2xl font-bold text-center outline-none focus:border-blue-500"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div>
                <input
                  type="text"
                  value={movDesc}
                  onChange={(e) => setMovDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-blue-500"
                  placeholder={movTipo === "INGRESO" ? "¿Por qué ingresa este dinero?" : "¿En qué se gastó?"}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowMovModal(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  onClick={registrarMovimiento}
                  disabled={processing}
                  className={`flex-1 py-3 rounded-xl text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2 ${
                    movTipo === "INGRESO"
                      ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  }`}
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {movTipo === "INGRESO" ? "Registrar Ingreso" : "Registrar Egreso"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación antes de cerrar caja */}
      {showCierreConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Estás seguro?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Una vez cerrada la caja de hoy, no se podrán registrar más ingresos, egresos ni movimientos en el día.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCierreConfirmacion(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => { setShowCierreConfirmacion(false); setCierreMonto(""); setShowCierreModal(true); }} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:from-orange-600 hover:to-orange-700 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal CIERRE */}
      {showCierreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cerrar Caja</h3>
            <p className="text-sm text-gray-500 mb-6">
              Ingresa el dinero real que hay en la caja. Si hay diferencia, se registrará automáticamente.
            </p>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Apertura:</span><span className="font-medium">{formatCurrency(Number(caja.aperturaHoy?.monto || 0))}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">+ Ventas hoy:</span><span className="font-medium text-green-600">+{formatCurrency(Number(caja.ventasHoyTotal || 0))}</span></div>
              {totalIngresosExtras > 0 && (
                <div className="flex justify-between"><span className="text-gray-500">+ Ingresos extras:</span><span className="font-medium text-green-600">+{formatCurrency(totalIngresosExtras)}</span></div>
              )}
              {totalEgresos > 0 && (
                <div className="flex justify-between"><span className="text-gray-500">- Egresos / Gastos:</span><span className="font-medium text-red-600">-{formatCurrency(totalEgresos)}</span></div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                <span>Saldo esperado:</span>
                <span>{formatCurrency(Number(caja.saldoActual))}</span>
              </div>
            </div>

            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-bold">S/</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cierreMonto}
                onChange={(e) => setCierreMonto(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 text-2xl font-bold text-center outline-none focus:border-orange-500"
                placeholder={String(Number(caja.saldoActual))}
                autoFocus
              />
            </div>
            {cierreMonto && parseFloat(cierreMonto) !== Number(caja.saldoActual) && (
              <p className={`text-sm mb-4 ${parseFloat(cierreMonto) > Number(caja.saldoActual) ? "text-green-600" : "text-red-600"}`}>
                {parseFloat(cierreMonto) > Number(caja.saldoActual)
                  ? `Hay S/ ${(parseFloat(cierreMonto) - Number(caja.saldoActual)).toFixed(2)} de más`
                  : `Faltan S/ ${(Number(caja.saldoActual) - parseFloat(cierreMonto)).toFixed(2)}`}
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowCierreModal(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={cerrarCaja} disabled={processing} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Cerrar Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal recomendaciones post-cierre */}
      {showRecomendaciones && recomendaciones && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cierre Completado</h3>
                <p className="text-sm text-gray-500">
                  Ventas del día: {formatCurrency(recomendaciones.resumenVentas.total)} ({recomendaciones.resumenVentas.tickets} tickets)
                </p>
              </div>
            </div>

            {recomendaciones.productosBajoStock.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <h4 className="font-semibold text-gray-900 text-sm">Productos por Reponer</h4>
                  <span className="text-xs text-gray-400">({recomendaciones.productosBajoStock.length})</span>
                </div>
                <div className="space-y-1.5">
                  {recomendaciones.productosBajoStock.slice(0, 15).map((p) => (
                    <div key={p.codigo} className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.nombre}</p>
                        <p className="text-xs text-gray-500 font-mono">{p.codigo}</p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap ml-3">
                        <span className="text-red-600 font-semibold">{p.stock}</span>
                        <span className="text-gray-400"> / {p.stockMinimo} mín</span>
                      </div>
                    </div>
                  ))}
                  {recomendaciones.productosBajoStock.length > 15 && (
                    <p className="text-xs text-gray-400 text-center pt-1">
                      y {recomendaciones.productosBajoStock.length - 15} más...
                    </p>
                  )}
                </div>
              </div>
            )}

            {recomendaciones.productosBajoStock.length === 0 && (
              <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-100 text-center">
                <Package className="w-6 h-6 text-green-500 mx-auto mb-1" />
                <p className="text-sm text-green-700 font-medium">Stock al día</p>
                <p className="text-xs text-green-600">Todos los productos tienen inventario suficiente</p>
              </div>
            )}

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-600 flex items-start gap-2">
              <ShoppingCart className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p>Revisa el inventario y la sección de reportes para planificar las compras de mañana.</p>
            </div>

            <button
              onClick={() => setShowRecomendaciones(false)}
              className="w-full mt-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
