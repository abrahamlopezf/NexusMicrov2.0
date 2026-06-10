import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Search } from 'lucide-react';
import api from '../../api/axios';

const ReusableReturnModal = ({ onClose, onSuccess }) => {
  const [materials, setMaterials] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    material_id: '',
    quantity: '',
    unit_cost: '',
    sale_id: '',
    sale_item_id: '',
    notes: ''
  });

  useEffect(() => {
    Promise.all([
      api.get('/materials'),
      api.get('/sales').catch(() => ({ data: { data: [] } }))
    ]).then(([matRes, saleRes]) => {
      const mData = matRes.data?.data || matRes.data || [];
      setMaterials(Array.isArray(mData) ? mData : []);
      const sData = saleRes.data?.data || saleRes.data || [];
      setSales(Array.isArray(sData) ? sData : []);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.material_id || !formData.quantity) return;
    try {
      setLoading(true);
      await api.post('/inventory/reusable-returns', {
        material_id: parseInt(formData.material_id),
        quantity: parseFloat(formData.quantity),
        unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : undefined,
        sale_id: formData.sale_id ? parseInt(formData.sale_id) : undefined,
        sale_item_id: formData.sale_item_id ? parseInt(formData.sale_item_id) : undefined,
        notes: formData.notes || 'Sobrante reutilizable registrado'
      });
      alert('Sobrante registrado correctamente');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert('Error al registrar sobrante');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <RotateCcw size={20} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Registrar Sobrante</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Material reutilizable</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Material</label>
              <select
                required
                value={formData.material_id}
                onChange={e => setFormData({...formData, material_id: e.target.value})}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-400 transition-all"
              >
                <option value="">Seleccionar material...</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.unit || 'un'}) — Disp: {parseFloat(m.available_stock || 0).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Cantidad sobrante</label>
                <input
                  required
                  type="number"
                  min="0.001"
                  step="0.001"
                  placeholder="0.00"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: e.target.value})}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-400 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                  Costo unit. <span className="text-slate-300 font-normal">(opcional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.unit_cost}
                  onChange={e => setFormData({...formData, unit_cost: e.target.value})}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-400 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                  Venta origen <span className="text-slate-300 font-normal">(opcional)</span>
                </label>
                <select
                  value={formData.sale_id}
                  onChange={e => setFormData({...formData, sale_id: e.target.value, sale_item_id: ''})}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-400 transition-all"
                >
                  <option value="">Sin venta</option>
                  {sales.map(s => (
                    <option key={s.id} value={s.id}>{s.sale_number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Notas</label>
                <input
                  type="text"
                  placeholder="Ej. Sobrante de corte"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl text-sm uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar Sobrante'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReusableReturnModal;
