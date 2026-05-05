import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, Truck } from 'lucide-react';
import inventoryService from '../../api/inventoryService';
import supplierService from '../../api/supplierService';

const MaterialForm = ({ material, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(material || {
    name: '',
    description: '',
    category: '',
    unit: 'm',
    current_stock: 0,
    min_stock: 0,
    cost: 0,
    supplier_id: ''
  });
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchSuppliers();
    return () => { isMounted.current = false; };
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await supplierService.getSuppliers();
      if (isMounted.current && response && response.success) {
        setSuppliers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      if (isMounted.current) setLoadingSuppliers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isMounted.current) setLoading(true);
      setError(null);
      
      const dataToSave = {
        ...formData,
        supplier_id: formData.supplier_id || null
      };

      if (material?.id) {
        await inventoryService.updateMaterial(material.id, dataToSave);
      } else {
        await inventoryService.createMaterial(dataToSave);
      }
      alert('Insumo guardado con éxito.');
      window.location.reload();
    } catch (err) {
      if (isMounted.current) {
        setError(err.response?.data?.message || 'Error al guardar el material');
        setLoading(false);
      }
    }
  };

  return (
    <div key="modal-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div key="modal-content" className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-900">
            {material ? 'Editar Insumo' : 'Nuevo Insumo'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nombre del Material</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                placeholder="Ej. Tela Mezclilla 12oz"
              />
            </div>

            {/* Proveedor Selector */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
                <Truck size={14} className="text-indigo-500" />
                Proveedor Asociado
              </label>
              <select
                value={formData.supplier_id || ''}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
              >
                <option value="">-- Sin Proveedor --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {loadingSuppliers && <p className="text-[10px] text-indigo-500 mt-1 font-bold animate-pulse">Cargando directorio...</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Categoría</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  placeholder="Ej. Telas"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Unidad</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                >
                  <option value="m">Metros (m)</option>
                  <option value="kg">Kilogramos (kg)</option>
                  <option value="pz">Piezas (pz)</option>
                  <option value="l">Litros (l)</option>
                  <option value="yd">Yardas (yd)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Stock Inicial</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Stock Mínimo</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Costo Unitario ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
              />
            </div>
          </div>

          <div className="mt-10 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialForm;
