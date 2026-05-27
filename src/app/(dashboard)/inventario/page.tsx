"use client";

import { useState } from "react";
import { Package, PlusCircle, ListOrdered } from "lucide-react";
import ProductTable from "@/components/products/ProductTable";
import StockRepositionPanel from "@/components/inventario/StockRepositionPanel";
import MovimientosPanel from "@/components/inventario/MovimientosPanel";

const tabs = [
  { id: "productos", label: "Productos", icon: Package },
  { id: "reposicion", label: "Reposición", icon: PlusCircle },
  { id: "movimientos", label: "Movimientos", icon: ListOrdered },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function InventarioPage() {
  const [activeTab, setActiveTab] = useState<TabId>("productos");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Inventario</h2>
        <p className="text-gray-500 mt-1">Gestión de productos, reposiciones y movimientos de stock</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      {activeTab === "productos" && <ProductTable />}
      {activeTab === "reposicion" && <StockRepositionPanel />}
      {activeTab === "movimientos" && <MovimientosPanel />}
    </div>
  );
}
