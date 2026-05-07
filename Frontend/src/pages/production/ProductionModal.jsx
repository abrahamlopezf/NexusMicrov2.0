import React, { useState, useEffect, useRef } from 'react';
import { X, Hammer, ClipboardList, AlertCircle, ShoppingCart } from 'lucide-react';
import inventoryService from '../../api/inventoryService';
import productionService from '../../api/productionService';
import axios from '../../api/axios'; // Para traer ventas

const ProductionModal = ({ onClose, onSuccess }) => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetchData = async () => {
      try {
        setLoadingData(true);
        // Traer productos y ventas en paralelo
        const [prodRes, salesRes] = await Promise.all([
          inventoryService.getProducts(),
          axios.get('/sales')
        ]);

        let productList = [];
        if (prodRes && prodRes.status === 'success' && prodRes.data && prodRes.data.products) {
          productList = prodRes.data.products;
        } else if (prodRes && prodRes.data && Array.isArray(prodRes.data)) {
          productList = prodRes.data;
        }

        const salesList = salesRes.data?.data || [];

        if (isMounted.current) {
          setProducts(productList);
          setSales(salesList);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (isMounted.current) setLoadingData(false);
      }
    };
    fetchData();
    return () => { isMounted.current = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !selectedSaleId) {
      setError('Selecciona un producto y una venta vinculada');
      return;
    }

    try {
      if (isMounted.current) setLoading(true);
      setError(null);
      
      const payload = {
        productId: parseInt(selectedProductId),
        saleId: parseInt(selectedSaleId),
        quantity: parseInt(quantity),
        notes: notes
      };

      const response = await productionService.createWorkOrder(payload);
      if (response && response.success) {
        alert('Orden de producción vinculada correctamente.');
        window.location.reload();
      } else {
        if (isMounted.current) setError(response?.message || 'Error al crear la orden');
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.response?.data?.message || 'Error de conexión');
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3 text-slate-900">
            <ClipboardList size={20} />
            <h2 className="text-xl font-black">Vincular Producción</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold uppercase tracking-tight">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Venta Vinculada */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Venta Vinculada (Obligatorio)</label>
              <select
                required
                value={selectedSaleId}
                onChange={(e) => setSelectedSaleId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="">Selecciona una venta...</option>
                {sales.map(s => (
                  <option key={s.id} value={s.id}>
                    Orden #{s.id} - {s.sale_number}
                  </option>
                ))}
              </select>
            </div>

            {/* Producto */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Producto</label>
              <select
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="">Selecciona un producto...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Cantidad a Producir</label>
              <input
                required
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl text-center text-slate-700 outline-none focus:border-indigo-500"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Instrucciones</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500"
                placeholder="Notas para el taller..."
                rows={2}
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || loadingData}
              className="flex-1 px-6 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] disabled:opacity-50"
            >
              {loading ? "..." : "Crear Orden"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductionModal;
