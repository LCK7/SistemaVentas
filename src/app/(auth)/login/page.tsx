"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, Eye, EyeOff, Loader2, ShoppingCart, TrendingUp, Users, Package } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Credenciales incorrectas");
        return;
      }

      toast.success("Inicio de sesión exitoso");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: ShoppingCart, label: "Punto de Venta", desc: "POS rápido e intuitivo" },
    { icon: Package, label: "Inventario", desc: "Control de stock en tiempo real" },
    { icon: TrendingUp, label: "Reportes", desc: "Análisis y exportación" },
    { icon: Users, label: "Usuarios", desc: "Gestión por roles y permisos" },
  ];

  return (
    <div className={`w-full max-w-md transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <div className="relative">
        {/* Decoración */}
        <div className="absolute -top-3 -right-3 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-3 -left-3 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl" />

        <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/10 border border-white/50 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-600 to-blue-800 flex items-center justify-center mb-4 shadow-xl shadow-blue-200/50 ring-4 ring-blue-50">
              <Store className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              MiniMarket
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              Sistema de Gestión y Ventas
            </p>
            <div className="mt-3 flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-blue-700 font-medium">Sistema Activo</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@minimarket.com"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white/50 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 bg-white/50 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-200/50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <Store className="w-4 h-4" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Credenciales de prueba */}
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-blue-50/30 border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Credenciales de Prueba
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/80 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Store className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-900">Dueño</p>
                  <p className="text-xs text-gray-500 font-mono">admin@minimarket.com / admin123</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/80 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-900">Vendedor</p>
                  <p className="text-xs text-gray-500 font-mono">vendedor@minimarket.com / vendedor123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.label} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-gray-100/50">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">{f.label}</p>
                <p className="text-[10px] text-gray-400">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-100/10 to-purple-100/10 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <Suspense fallback={
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
