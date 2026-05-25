"use client";

import { useState } from "react";
import { BarChart3, Wallet, PiggyBank } from "lucide-react";
import FinanzasDashboard from "@/components/finanzas/FinanzasDashboard";
import CajaManager from "@/components/finanzas/CajaManager";
import GastosList from "@/components/finanzas/GastosList";

const tabs = [
  { id: "dashboard", label: "Panel Financiero", icon: BarChart3 },
  { id: "caja", label: "Gestión de Caja", icon: Wallet },
  { id: "gastos", label: "Gastos", icon: PiggyBank },
];

export default function FinanzasPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Finanzas</h2>
        <p className="text-gray-500 mt-1">
          Control financiero completo: caja, gastos y resumen del negocio
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "" : "text-gray-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="transition-all duration-300">
        {activeTab === "dashboard" && <FinanzasDashboard />}
        {activeTab === "caja" && <CajaManager />}
        {activeTab === "gastos" && <GastosList />}
      </div>
    </div>
  );
}
