"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Search, Mail, Phone, MapPin, Loader2, X, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  nit: string | null;
  createdAt: string;
  _count?: { ventas: number };
};

export default function ClientesList() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  // Form
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [nit, setNit] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const res = await fetch("/api/clientes");
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingCliente(null);
    setNombre("");
    setTelefono("");
    setEmail("");
    setDireccion("");
    setNit("");
    setShowModal(true);
  };

  const openEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setNombre(cliente.nombre);
    setTelefono(cliente.telefono || "");
    setEmail(cliente.email || "");
    setDireccion(cliente.direccion || "");
    setNit(cliente.nit || "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setProcessing(true);
    try {
      const url = editingCliente
        ? `/api/clientes/${editingCliente.id}`
        : "/api/clientes";
      const method = editingCliente ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          telefono: telefono || null,
          email: email || null,
          direccion: direccion || null,
          nit: nit || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar");
      }

      toast.success(editingCliente ? "Cliente actualizado" : "Cliente creado");
      setShowModal(false);
      fetchClientes();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredClientes = clientes.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.telefono || "").includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.nit || "").includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
          <p className="text-gray-500 mt-1">Gestión de clientes del negocio</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre, teléfono, email o NIT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center py-16">
          <Users className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No hay clientes</p>
          <p className="text-sm text-gray-400 mt-1">Crea tu primer cliente para empezar</p>
          <button
            onClick={openCreate}
            className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            + Nuevo Cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClientes.map((cliente) => (
            <div
              key={cliente.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
              onClick={() => openEdit(cliente)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Editar →
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{cliente.nombre}</h3>
              <div className="mt-3 space-y-1.5">
                {cliente.telefono && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> {cliente.telefono}
                  </p>
                )}
                {cliente.email && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> {cliente.email}
                  </p>
                )}
                {cliente.direccion && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> {cliente.direccion}
                  </p>
                )}
              </div>
              {cliente.nit && (
                <p className="text-xs text-gray-400 mt-2 font-mono">NIT: {cliente.nit}</p>
              )}
              {cliente._count && cliente._count.ventas > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                  <ShoppingCart className="w-3 h-3" />
                  {cliente._count.ventas} compras
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold">
                {editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-blue-500"
                  placeholder="Nombre completo"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-blue-500"
                  placeholder="999-888-777"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-blue-500"
                  placeholder="cliente@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-blue-500"
                  placeholder="Av. Principal 456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
                <input
                  type="text"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-blue-500"
                  placeholder="12345678901"
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
                    Guardando...
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5" />
                    {editingCliente ? "Actualizar Cliente" : "Crear Cliente"}
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
