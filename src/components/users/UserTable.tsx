"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Edit2, ToggleLeft, ToggleRight, X, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  createdAt: string;
  _count: { ventas: number };
};

export default function UserTable() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [saving, setSaving] = useState(false);
  const [showInactivos, setShowInactivos] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "VENDEDOR",
  });

  const fetchUsuarios = async () => {
    try {
      const params = new URLSearchParams();
      if (showInactivos) params.set("incluirInactivos", "true");
      const res = await fetch(`/api/usuarios?${params}`);
      const data = await res.json();
      setUsuarios(data);
    } catch {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [showInactivos]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ nombre: "", email: "", password: "", rol: "VENDEDOR" });
    setModalOpen(true);
  };

  const openEdit = (usuario: Usuario) => {
    setEditingUser(usuario);
    setForm({ nombre: usuario.nombre, email: usuario.email, password: "", rol: usuario.rol });
    setModalOpen(true);
  };

  const handleToggleActive = async (usuario: Usuario) => {
    try {
      const res = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !usuario.activo }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success(usuario.activo ? "Usuario deshabilitado" : "Usuario habilitado");
      fetchUsuarios();
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar estado");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingUser) {
        const body: any = { nombre: form.nombre, email: form.email, rol: form.rol };
        if (form.password) body.password = form.password;

        const res = await fetch(`/api/usuarios/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
        toast.success("Usuario actualizado");
      } else {
        const res = await fetch("/api/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
        toast.success("Usuario creado");
      }
      setModalOpen(false);
      fetchUsuarios();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const rolLabels: Record<string, string> = {
    ADMIN: "Dueño",
    VENDEDOR: "Vendedor",
  };

  const rolColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    VENDEDOR: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInactivos(!showInactivos)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
              showInactivos ? "bg-orange-50 border-orange-300 text-orange-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Ver inactivos
          </button>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Users className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay usuarios</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Rol</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Ventas</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50 ${!u.activo ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${rolColors[u.rol]}`}>
                      <Shield className="w-3 h-3" />
                      {rolLabels[u.rol]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{u._count?.ventas || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`p-1.5 rounded-lg ${u.activo ? "hover:bg-red-50 text-red-500" : "hover:bg-green-50 text-green-600"}`}
                        title={u.activo ? "Deshabilitar" : "Habilitar"}
                      >
                        {u.activo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña {editingUser && <span className="text-gray-400 font-normal">(dejar vacío para mantener)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
                  placeholder={editingUser ? "••••••••" : "Contraseña"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  required
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
                >
                  <option value="VENDEDOR">Vendedor</option>
                  <option value="ADMIN">Dueño (Admin)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUser ? "Actualizar" : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
