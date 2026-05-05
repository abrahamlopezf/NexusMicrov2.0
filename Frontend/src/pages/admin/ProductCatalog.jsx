import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { Package, Plus, Edit2, CheckCircle, XCircle } from "lucide-react";

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products");
      const data = res.data.data.products || [];
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-[#0A0A0A] tracking-tight">Catálogo de Productos</h1>
          <p className="text-gray-500 mt-1 font-medium">Master Data: Gestión centralizada de artículos</p>
        </div>
        <button 
          className="flex items-center gap-2 bg-[#C9A14A] text-white px-4 py-2 rounded-xl hover:bg-[#B38D3A] transition-colors font-medium shadow-sm"
        >
          <Plus size={18} />
          Nuevo Producto
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Cargando catálogo...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                  <th className="p-4 font-semibold">SKU</th>
                  <th className="p-4 font-semibold">Nombre</th>
                  <th className="p-4 font-semibold">Categoría</th>
                  <th className="p-4 font-semibold text-center">Unidad</th>
                  <th className="p-4 font-semibold text-right">Costo Base</th>
                  <th className="p-4 font-semibold text-center">Estado</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-600">{product.sku || 'N/A'}</td>
                    <td className="p-4">
                      <span className="font-bold text-gray-800 block">{product.name}</span>
                      <span className="text-xs text-gray-500 truncate block max-w-xs">{product.description}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 capitalize">{product.category || 'General'}</td>
                    <td className="p-4 text-center font-medium text-gray-900">{product.unit || 'u'}</td>
                    <td className="p-4 text-right font-medium text-gray-900">${parseFloat(product.base_cost || 0).toFixed(2)}</td>
                    <td className="p-4 text-center">
                      {product.active ? (
                        <CheckCircle size={20} className="text-emerald-500 inline-block" />
                      ) : (
                        <XCircle size={20} className="text-red-400 inline-block" />
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-gray-400 hover:text-[#C9A14A] transition-colors">
                        <Edit2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      No hay productos en el catálogo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCatalog;
