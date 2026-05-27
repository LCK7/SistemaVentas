"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Store, FileText, Phone, MapPin, Globe, Loader2, Tags, Plus, X, Edit2, Trash2, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type ConfigMap = Record<string, { valor: string; tipo: string }>;

type Categoria = {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
};

const CONFIG_DEFAULTS: { clave: string; label: string; icon: any; placeholder: string }[] = [
  { clave: "NEGOCIO_NOMBRE", label: "Nombre del Negocio", icon: Store, placeholder: "Mi MiniMarket" },
  { clave: "NEGOCIO_RUC", label: "RUC", icon: FileText, placeholder: "12345678901" },
  { clave: "NEGOCIO_DIRECCION", label: "Dirección", icon: MapPin, placeholder: "Av. Principal 123" },
  { clave: "NEGOCIO_TELEFONO", label: "Teléfono", icon: Phone, placeholder: "999-888-777" },
  { clave: "NEGOCIO_WEB", label: "Sitio Web", icon: Globe, placeholder: "minimarket.com" },
];

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<ConfigMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Categorías state
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);
  const [catForm, setCatForm] = useState({ nombre: "", descripcion: "" });
  const [catSaving, setCatSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchCategorias();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/configuracion");
      const data = await res.json();
      const map: ConfigMap = {};
      for (const item of data) {
        map[item.clave] = { valor: item.valor, tipo: item.tipo };
      }
      setConfig(map);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    setCatLoading(true);
    try {
      const res = await fetch("/api/categorias?todas=true");
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch {
      setCategorias([]);
    } finally {
      setCatLoading(false);
    }
  };

  const handleChange = (clave: string, valor: string) => {
    setConfig((prev) => ({
      ...prev,
      [clave]: { ...prev[clave], valor },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      if (!res.ok) throw new Error();
      toast.success("Configuración guardada exitosamente");
    } catch {
      toast.error("Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  const openCatModal = (cat?: Categoria) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({ nombre: cat.nombre, descripcion: cat.descripcion || "" });
    } else {
      setEditingCat(null);
      setCatForm({ nombre: "", descripcion: "" });
    }
    setShowCatModal(true);
  };

  const handleCatSave = async () => {
    if (!catForm.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    setCatSaving(true);
    try {
      const url = editingCat
        ? `/api/categorias/${editingCat.id}`
        : "/api/categorias";
      const method = editingCat ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar");
      }

      toast.success(editingCat ? "Categoría actualizada" : "Categoría creada");
      setShowCatModal(false);
      fetchCategorias();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar categoría");
    } finally {
      setCatSaving(false);
    }
  };

  const handleCatDelete = async (cat: Categoria) => {
    if (!confirm(`¿Deshabilitar "${cat.nombre}"?`)) return;
    try {
      const res = await fetch(`/api/categorias/${cat.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error");
      }
      toast.success("Categoría deshabilitada");
      fetchCategorias();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
          <p className="text-gray-500 mt-1">Parámetros y ajustes del negocio</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 shadow-lg shadow-blue-200 transition-all"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar Cambios
        </button>
      </div>

      {/* Parámetros del Negocio */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Información del Negocio</h3>
            <p className="text-sm text-gray-500">Datos que aparecerán en boletas y reportes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CONFIG_DEFAULTS.map((field) => {
            const Icon = field.icon;
            const valor = config[field.clave]?.valor ?? "";
            return (
              <div key={field.clave}>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <Icon className="w-4 h-4 text-gray-400" />
                  {field.label}
                </label>
                <input
                  type="text"
                  value={valor}
                  onChange={(e) => handleChange(field.clave, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Categorías */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
              <Tags className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Categorías de Productos</h3>
              <p className="text-sm text-gray-500">Gestiona las categorías para clasificar productos</p>
            </div>
          </div>
          <button
            onClick={() => openCatModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Categoría
          </button>
        </div>

        {catLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : categorias.length === 0 ? (
          <p className="text-center py-8 text-gray-400">No hay categorías registradas</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categorias.map((cat) => (
              <div
                key={cat.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                  cat.activo ? "border-gray-200 bg-white" : "border-gray-200 bg-gray-50 opacity-60"
                }`}
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{cat.nombre}</p>
                  {cat.descripcion && (
                    <p className="text-xs text-gray-400 mt-0.5">{cat.descripcion}</p>
                  )}
                  {!cat.activo && (
                    <span className="text-xs text-gray-400 font-medium">Deshabilitada</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openCatModal(cat)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {cat.activo && (
                    <button
                      onClick={() => handleCatDelete(cat)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                      title="Deshabilitar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Información del Sistema */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-md">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Información del Sistema</h3>
            <p className="text-sm text-gray-500">Detalles técnicos de la instalación</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Versión</p>
            <p className="text-sm font-medium text-gray-900">1.0.0</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Base de Datos</p>
            <p className="text-sm font-medium text-gray-900">PostgreSQL 15</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Stack</p>
            <p className="text-sm font-medium text-gray-900">Next.js 16 + Tailwind</p>
          </div>
        </div>
      </div>

      {/* Modal Categoría */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCat ? "Editar Categoría" : "Nueva Categoría"}
              </h3>
              <button onClick={() => setShowCatModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  required
                  value={catForm.nombre}
                  onChange={(e) => setCatForm({ ...catForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
                  placeholder="Ej: Lácteos, Bebidas, Snacks"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={catForm.descripcion}
                  onChange={(e) => setCatForm({ ...catForm, descripcion: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
                  rows={2}
                  placeholder="Descripción opcional de la categoría"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCatSave}
                  disabled={catSaving || !catForm.nombre.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {catSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCat ? "Actualizar" : "Crear"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
