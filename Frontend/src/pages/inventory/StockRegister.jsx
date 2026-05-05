import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { PackagePlus, Save, CheckCircle } from "lucide-react";

const StockRegister = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    productId: "",
    initial_stock: "",
    min_stock: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get("/products");
        // Only allow active products
        const data = (res.data.data.products || []).filter(p => p.active !== false);
        setProducts(data);
      } catch (err) {
        console.error("Error fetching catalog", err);
      }
    };
    fetchCatalog();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.post("/inventory/register", {
        productId: parseInt(formData.productId),
        initial_stock: parseFloat(formData.initial_stock),
        min_stock: parseFloat(formData.min_stock || 0)
      });
      setSuccess(true);
      setFormData({ productId: "", initial_stock: "", min_stock: "" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Error al registrar inventario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-10 mt-8">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold text-[#0A0A0A] tracking-tight flex items-center">
          <PackagePlus className="mr-3 text-[#C9A14A]" size={32} />
          Registro de Stock
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Añadir inventario inicial o reabastecer artículos del catálogo.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 flex items-center">
            <CheckCircle className="mr-2" size={20} />
            <span className="font-bold">¡Inventario registrado correctamente!</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Producto del Catálogo</label>
            <select
              required
              value={formData.productId}
              onChange={e => setFormData({ ...formData, productId: e.target.value })}
              className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#C9A14A]/50 outline-none transition-all"
            >
              <option value="">Seleccione un producto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.sku ? `[${p.sku}] ` : ''}{p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Cantidad a Sumar</label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={formData.initial_stock}
                onChange={e => setFormData({ ...formData, initial_stock: e.target.value })}
                className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#C9A14A]/50 outline-none transition-all"
                placeholder="Ej. 100"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Stock Mínimo (Opcional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.min_stock}
                onChange={e => setFormData({ ...formData, min_stock: e.target.value })}
                className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#C9A14A]/50 outline-none transition-all"
                placeholder="Ej. 10"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A0A0A] text-white p-3.5 rounded-xl font-bold flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-70"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="mr-2" size={20} /> Registrar Stock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockRegister;
