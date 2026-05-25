"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Store, FileText, Phone, MapPin, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ConfigMap = Record<string, { valor: string; tipo: string }>;

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

  useEffect(() => {
    fetchConfig();
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
      // Si no hay tabla o datos, usar defaults
    } finally {
      setLoading(false);
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
    </div>
  );
}
