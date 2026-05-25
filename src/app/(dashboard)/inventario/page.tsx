import ProductTable from "@/components/products/ProductTable";

export default function InventarioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Inventario</h2>
        <p className="text-gray-500 mt-1">Gestión de productos y stock</p>
      </div>
      <ProductTable />
    </div>
  );
}
